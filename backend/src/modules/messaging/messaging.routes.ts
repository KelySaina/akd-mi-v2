import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { authenticate } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';
import { publishToUsers, type RealtimeEvent } from '../../realtime/hub.js';

/* ────────────────────────────────────────────────────────────────── */
/* Validation                                                          */
/* ────────────────────────────────────────────────────────────────── */

const AttachmentSchema = z.object({
    key: z.string(),
    url: z.string().url(),
    name: z.string(),
    mimeType: z.string(),
    size: z.number().int().nonnegative(),
});

const CreateConversation = z.object({
    kind: z.enum(['DIRECT', 'GROUP']),
    /** User ids (excluding the caller — added automatically). */
    participantIds: z.array(z.string().min(1)).min(1),
    title: z.string().trim().min(1).max(120).optional(),
    avatarUrl: z.string().url().optional(),
});

const SendMessage = z.object({
    body: z.string().max(8000).default(''),
    attachments: z.array(AttachmentSchema).max(10).default([]),
}).refine((v) => v.body.trim().length > 0 || v.attachments.length > 0, {
    message: 'Message must have body or attachments',
});

const ListMessagesQuery = z.object({
    /** Cursor = message id; returns messages strictly older than the cursor. */
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});

const UpdateConversation = z.object({
    title: z.string().trim().min(1).max(120).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
});

const AddParticipants = z.object({
    userIds: z.array(z.string().min(1)).min(1),
});

/* ────────────────────────────────────────────────────────────────── */
/* Helpers                                                             */
/* ────────────────────────────────────────────────────────────────── */

function directPairKey(a: string, b: string): string {
    return [a, b].sort().join(':');
}

async function assertParticipant(conversationId: string, userId: string): Promise<boolean> {
    const p = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
        select: { id: true, leftAt: true },
    });
    return !!p && !p.leftAt;
}

/** Fetch active participant userIds for a conversation (used to fan out WS events). */
async function activeParticipantIds(conversationId: string): Promise<string[]> {
    const rows = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null },
        select: { userId: true },
    });
    return rows.map((r) => r.userId);
}

async function notifyConversation(conversationId: string, event: RealtimeEvent): Promise<void> {
    try {
        const ids = await activeParticipantIds(conversationId);
        publishToUsers(ids, event);
    } catch { /* never fail the HTTP response over a fanout error */ }
}

async function loadConversationView(conversationId: string, viewerId: string) {
    const convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            participants: {
                include: {
                    user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                },
            },
        },
    });
    if (!convo) return null;

    const me = convo.participants.find((p) => p.userId === viewerId);
    const others = convo.participants.filter((p) => p.userId !== viewerId);

    // Unread count: messages after me.lastReadAt, not from me.
    let unread = 0;
    if (me) {
        unread = await prisma.message.count({
            where: {
                conversationId: convo.id,
                deletedAt: null,
                senderId: { not: viewerId },
                ...(me.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
            },
        });
    }

    // Preview last message
    const lastMessage = await prisma.message.findFirst({
        where: { conversationId: convo.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, body: true, attachments: true, createdAt: true,
            sender: { select: { id: true, name: true } },
        },
    });

    return {
        id: convo.id,
        kind: convo.kind,
        title: convo.title,
        avatarUrl: convo.avatarUrl,
        lastMessageAt: convo.lastMessageAt,
        createdAt: convo.createdAt,
        unread,
        lastMessage,
        participants: convo.participants
            .filter((p) => !p.leftAt)
            .map((p) => ({
                userId: p.userId,
                role: p.role,
                joinedAt: p.joinedAt,
                user: p.user,
            })),
        otherUsers: others.filter((p) => !p.leftAt).map((p) => p.user),
    };
}

/* ────────────────────────────────────────────────────────────────── */
/* Routes                                                              */
/* ────────────────────────────────────────────────────────────────── */

export async function messagingRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    /** Lightweight contacts directory — every authenticated user can see active users
     *  in this institution to start a conversation. Returns at most 50 matches. */
    app.get('/contacts', async (req, reply) => {
        try {
            const me = req.user!.sub;
            const q = z.object({ q: z.string().trim().optional() }).parse(req.query);
            const where: Prisma.UserWhereInput = {
                id: { not: me },
                isActive: true,
                ...(q.q
                    ? {
                          OR: [
                              { name:  { contains: q.q, mode: 'insensitive' as const } },
                              { email: { contains: q.q, mode: 'insensitive' as const } },
                          ],
                      }
                    : {}),
            };
            const items = await prisma.user.findMany({
                where,
                orderBy: { name: 'asc' },
                take: 50,
                select: { id: true, name: true, email: true, role: true, avatarUrl: true },
            });
            return { items };
        } catch (err) { return handleError(reply, err); }
    });

    /** List the caller's conversations, ordered by most recent activity. */
    app.get('/conversations', async (req, reply) => {
        try {
            const me = req.user!.sub;
            const rows = await prisma.conversation.findMany({
                where: { participants: { some: { userId: me, leftAt: null } } },
                orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
                take: 200,
                select: { id: true },
            });
            const items = await Promise.all(rows.map((r) => loadConversationView(r.id, me)));
            return { items: items.filter(Boolean) };
        } catch (err) { return handleError(reply, err); }
    });

    /** Total unread across all conversations (for the badge in the topbar). */
    app.get('/unread-count', async (req, reply) => {
        try {
            const me = req.user!.sub;
            const parts = await prisma.conversationParticipant.findMany({
                where: { userId: me, leftAt: null },
                select: { conversationId: true, lastReadAt: true },
            });
            let total = 0;
            for (const p of parts) {
                total += await prisma.message.count({
                    where: {
                        conversationId: p.conversationId,
                        deletedAt: null,
                        senderId: { not: me },
                        ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
                    },
                });
            }
            return { total };
        } catch (err) { return handleError(reply, err); }
    });

    /** Create or reuse a conversation. Direct conversations are deduped via directPairKey. */
    app.post('/conversations', async (req, reply) => {
        try {
            const body = CreateConversation.parse(req.body);
            const me = req.user!.sub;

            // De-duplicate participant ids and remove self if included.
            const otherIds = Array.from(new Set(body.participantIds.filter((id) => id !== me)));
            if (otherIds.length === 0) {
                return reply.code(400).send({ error: 'NoParticipants' });
            }

            if (body.kind === 'DIRECT') {
                if (otherIds.length !== 1) {
                    return reply.code(400).send({ error: 'DirectRequiresOneOther' });
                }
                const peer = otherIds[0]!;
                const pairKey = directPairKey(me, peer);
                const existing = await prisma.conversation.findUnique({ where: { directPairKey: pairKey } });
                if (existing) {
                    return loadConversationView(existing.id, me);
                }
                // Verify peer exists
                const peerUser = await prisma.user.findUnique({ where: { id: peer }, select: { id: true } });
                if (!peerUser) return reply.code(404).send({ error: 'PeerNotFound' });

                const created = await prisma.conversation.create({
                    data: {
                        kind: 'DIRECT',
                        directPairKey: pairKey,
                        createdById: me,
                        participants: {
                            create: [
                                { userId: me, role: 'member' },
                                { userId: peer, role: 'member' },
                            ],
                        },
                    },
                });
                return loadConversationView(created.id, me);
            }

            // GROUP
            const users = await prisma.user.findMany({ where: { id: { in: otherIds } }, select: { id: true } });
            if (users.length !== otherIds.length) {
                return reply.code(400).send({ error: 'SomeParticipantsNotFound' });
            }
            const created = await prisma.conversation.create({
                data: {
                    kind: 'GROUP',
                    title: body.title ?? null,
                    avatarUrl: body.avatarUrl ?? null,
                    createdById: me,
                    participants: {
                        create: [
                            { userId: me, role: 'owner' },
                            ...otherIds.map((id) => ({ userId: id, role: 'member' })),
                        ],
                    },
                },
            });
            return loadConversationView(created.id, me);
        } catch (err) { return handleError(reply, err); }
    });

    /** Fetch one conversation (with participants + unread). */
    app.get('/conversations/:id', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            if (!(await assertParticipant(id, me))) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
            const view = await loadConversationView(id, me);
            if (!view) return reply.code(404).send({ error: 'NotFound' });
            return view;
        } catch (err) { return handleError(reply, err); }
    });

    /** Patch conversation metadata (group only). */
    app.patch('/conversations/:id', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            const part = await prisma.conversationParticipant.findUnique({
                where: { conversationId_userId: { conversationId: id, userId: me } },
                include: { conversation: { select: { kind: true } } },
            });
            if (!part || part.leftAt) return reply.code(403).send({ error: 'Forbidden' });
            if (part.conversation.kind === 'DIRECT') {
                return reply.code(400).send({ error: 'CannotEditDirect' });
            }
            const body = UpdateConversation.parse(req.body);
            await prisma.conversation.update({
                where: { id },
                data: {
                    title: body.title === undefined ? undefined : body.title,
                    avatarUrl: body.avatarUrl === undefined ? undefined : body.avatarUrl,
                },
            });
            return loadConversationView(id, me);
        } catch (err) { return handleError(reply, err); }
    });

    /** Add participants to a group. */
    app.post('/conversations/:id/participants', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            if (!(await assertParticipant(id, me))) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
            const convo = await prisma.conversation.findUnique({ where: { id }, select: { kind: true } });
            if (!convo) return reply.code(404).send({ error: 'NotFound' });
            if (convo.kind === 'DIRECT') return reply.code(400).send({ error: 'CannotAddToDirect' });

            const body = AddParticipants.parse(req.body);
            const users = await prisma.user.findMany({ where: { id: { in: body.userIds } }, select: { id: true } });
            for (const u of users) {
                await prisma.conversationParticipant.upsert({
                    where: { conversationId_userId: { conversationId: id, userId: u.id } },
                    update: { leftAt: null },
                    create: { conversationId: id, userId: u.id, role: 'member' },
                });
            }
            return loadConversationView(id, me);
        } catch (err) { return handleError(reply, err); }
    });

    /** Leave a conversation (soft-leave; messages remain visible to others). */
    app.post('/conversations/:id/leave', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            const part = await prisma.conversationParticipant.findUnique({
                where: { conversationId_userId: { conversationId: id, userId: me } },
            });
            if (!part) return reply.code(404).send({ error: 'NotFound' });
            await prisma.conversationParticipant.update({
                where: { id: part.id },
                data: { leftAt: new Date() },
            });
            return { ok: true };
        } catch (err) { return handleError(reply, err); }
    });

    /** List messages in a conversation, newest-first, with cursor pagination. */
    app.get('/conversations/:id/messages', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            if (!(await assertParticipant(id, me))) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
            const q = ListMessagesQuery.parse(req.query);
            const where: Prisma.MessageWhereInput = {
                conversationId: id,
                deletedAt: null,
            };
            if (q.cursor) {
                const anchor = await prisma.message.findUnique({ where: { id: q.cursor }, select: { createdAt: true } });
                if (anchor) where.createdAt = { lt: anchor.createdAt };
            }
            const items = await prisma.message.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: q.limit,
                select: {
                    id: true, body: true, attachments: true, createdAt: true, editedAt: true,
                    sender: { select: { id: true, name: true, avatarUrl: true } },
                },
            });
            const nextCursor = items.length === q.limit ? items[items.length - 1]!.id : null;
            // Return in chronological order (oldest first) for easier rendering
            return { items: items.reverse(), nextCursor };
        } catch (err) { return handleError(reply, err); }
    });

    /** Send a message. */
    app.post('/conversations/:id/messages', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            if (!(await assertParticipant(id, me))) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
            const body = SendMessage.parse(req.body);
            const now = new Date();
            const [msg] = await prisma.$transaction([
                prisma.message.create({
                    data: {
                        conversationId: id,
                        senderId: me,
                        body: body.body,
                        attachments: body.attachments as unknown as Prisma.InputJsonValue,
                    },
                    select: {
                        id: true, body: true, attachments: true, createdAt: true, editedAt: true,
                        sender: { select: { id: true, name: true, avatarUrl: true } },
                    },
                }),
                prisma.conversation.update({
                    where: { id },
                    data: { lastMessageAt: now },
                }),
                prisma.conversationParticipant.update({
                    where: { conversationId_userId: { conversationId: id, userId: me } },
                    data: { lastReadAt: now },
                }),
            ]);
            await notifyConversation(id, { type: 'message.new', conversationId: id, messageId: msg.id });
            return reply.code(201).send(msg);
        } catch (err) { return handleError(reply, err); }
    });

    /** Mark a conversation as read up to "now" (or a specific time). */
    app.post('/conversations/:id/read', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            if (!(await assertParticipant(id, me))) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
            await prisma.conversationParticipant.update({
                where: { conversationId_userId: { conversationId: id, userId: me } },
                data: { lastReadAt: new Date() },
            });
            await notifyConversation(id, { type: 'conversation.read', conversationId: id, userId: me });
            return { ok: true };
        } catch (err) { return handleError(reply, err); }
    });

    /** Edit a message (sender only, no time limit for simplicity). */
    app.patch('/messages/:id', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            const body = z.object({ body: z.string().max(8000) }).parse(req.body);
            const m = await prisma.message.findUnique({ where: { id } });
            if (!m || m.deletedAt) return reply.code(404).send({ error: 'NotFound' });
            if (m.senderId !== me) return reply.code(403).send({ error: 'Forbidden' });
            const updated = await prisma.message.update({
                where: { id },
                data: { body: body.body, editedAt: new Date() },
                select: {
                    id: true, body: true, attachments: true, createdAt: true, editedAt: true,
                    sender: { select: { id: true, name: true, avatarUrl: true } },
                },
            });
            await notifyConversation(m.conversationId, { type: 'message.updated', conversationId: m.conversationId, messageId: id });
            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    /** Soft-delete a message (sender only). */
    app.delete('/messages/:id', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const me = req.user!.sub;
            const m = await prisma.message.findUnique({ where: { id } });
            if (!m || m.deletedAt) return reply.code(404).send({ error: 'NotFound' });
            if (m.senderId !== me) return reply.code(403).send({ error: 'Forbidden' });
            await prisma.message.update({
                where: { id },
                data: { deletedAt: new Date(), body: '', attachments: [] as unknown as Prisma.InputJsonValue },
            });
            await notifyConversation(m.conversationId, { type: 'message.deleted', conversationId: m.conversationId, messageId: id });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
