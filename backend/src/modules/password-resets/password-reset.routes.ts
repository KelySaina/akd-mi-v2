import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';
import { logAudit } from '../../common/audit.js';
import { hashPassword } from '../auth/auth.service.js';

function genPassword() {
    return Math.random().toString(36).slice(-12) + 'A!';
}

const RequestBody = z.object({
    reason: z.string().max(500).optional().nullable(),
});

const FulfillBody = z.object({
    customPassword: z.string().min(8).optional(),
});

export async function passwordResetRoutes(app: FastifyInstance) {
    /** Public: admin lists pending/all resets */
    app.get('/', { preHandler: [authenticate, requireRole('INSTANCE_ADMIN', 'MANAGER')] }, async (req, reply) => {
        try {
            const { status } = req.query as Record<string, string | undefined>;
            const where: any = {};
            if (status) where.status = status;
            const items = await prisma.passwordResetRequest.findMany({
                where,
                include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
                orderBy: { createdAt: 'desc' },
                take: 200,
            });
            return { items };
        } catch (err) { return handleError(reply, err); }
    });

    /** Authed user (or anyone) requests admin to reset their password */
    app.post('/request', { preHandler: authenticate }, async (req, reply) => {
        try {
            const body = RequestBody.parse(req.body ?? {});
            // Avoid spam: prevent more than one open request per user
            const existing = await prisma.passwordResetRequest.findFirst({
                where: { userId: req.user!.sub, status: 'pending' },
            });
            if (existing) {
                return reply.code(409).send({ message: 'You already have a pending request', existing });
            }
            const created = await prisma.passwordResetRequest.create({
                data: {
                    userId: req.user!.sub,
                    source: 'self',
                    reason: body.reason ?? null,
                    status: 'pending',
                },
            });
            logAudit(req, 'password_reset.requested', 'password_reset', created.id, { source: 'self' });
            return reply.code(201).send(created);
        } catch (err) { return handleError(reply, err); }
    });

    /** Admin fulfills: generate (or accept) new password, mark fulfilled, return password ONCE */
    app.post('/:id/fulfill', { preHandler: [authenticate, requireRole('INSTANCE_ADMIN', 'MANAGER')] }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = FulfillBody.parse(req.body ?? {});
            const r = await prisma.passwordResetRequest.findUnique({ where: { id } });
            if (!r) return reply.code(404).send({ message: 'Request not found' });
            if (r.status !== 'pending') return reply.code(400).send({ message: `Request is already ${r.status}` });
            const newPassword = body.customPassword ?? genPassword();
            const passwordHash = await hashPassword(newPassword);
            await prisma.$transaction([
                prisma.user.update({ where: { id: r.userId }, data: { passwordHash } }),
                prisma.passwordResetRequest.update({
                    where: { id },
                    data: { status: 'fulfilled', fulfilledAt: new Date(), fulfilledById: req.user!.sub },
                }),
                // revoke all refresh sessions for that user
                prisma.session.updateMany({
                    where: { userId: r.userId, revokedAt: null },
                    data: { revokedAt: new Date() },
                }),
            ]);
            logAudit(req, 'password_reset.fulfilled', 'password_reset', id, { userId: r.userId });
            return { ok: true, generatedPassword: newPassword };
        } catch (err) { return handleError(reply, err); }
    });

    /** Admin rejects */
    app.post('/:id/reject', { preHandler: [authenticate, requireRole('INSTANCE_ADMIN', 'MANAGER')] }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const r = await prisma.passwordResetRequest.findUnique({ where: { id } });
            if (!r) return reply.code(404).send({ message: 'Request not found' });
            if (r.status !== 'pending') return reply.code(400).send({ message: `Request is already ${r.status}` });
            const updated = await prisma.passwordResetRequest.update({
                where: { id },
                data: { status: 'rejected', fulfilledAt: new Date(), fulfilledById: req.user!.sub },
            });
            logAudit(req, 'password_reset.rejected', 'password_reset', id, { userId: r.userId });
            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    /** Admin proactively regenerates a password for any user (no prior request) */
    app.post('/admin-regenerate/:userId', { preHandler: [authenticate, requireRole('INSTANCE_ADMIN', 'MANAGER')] }, async (req, reply) => {
        try {
            const { userId } = req.params as { userId: string };
            const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
            if (!u) return reply.code(404).send({ message: 'User not found' });
            const newPassword = genPassword();
            const passwordHash = await hashPassword(newPassword);
            await prisma.$transaction([
                prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
                prisma.passwordResetRequest.create({
                    data: {
                        userId,
                        source: 'admin',
                        status: 'fulfilled',
                        fulfilledAt: new Date(),
                        fulfilledById: req.user!.sub,
                        reason: 'Admin-initiated password regeneration',
                    },
                }),
                prisma.session.updateMany({
                    where: { userId, revokedAt: null },
                    data: { revokedAt: new Date() },
                }),
            ]);
            logAudit(req, 'password_reset.admin_regenerated', 'user', userId);
            return { ok: true, generatedPassword: newPassword };
        } catch (err) { return handleError(reply, err); }
    });
}

/**
 * Public endpoint registered under /api/v1/auth for the forgot-password flow.
 *
 * No email infrastructure: instead of issuing a token, we register a
 * PasswordResetRequest the admin can fulfil from the /admin/requests page.
 * Returns 200 unconditionally to avoid email enumeration.
 */
export async function forgotPasswordRoutes(app: FastifyInstance) {
    const ForgotBody = z.object({
        email: z.string().email(),
        reason: z.string().max(500).optional().nullable(),
    });

    app.post('/forgot-password', async (req, reply) => {
        try {
            const body = ForgotBody.parse(req.body);
            const u = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true, isActive: true } });
            if (!u || !u.isActive) return { ok: true };

            // De-dupe: skip if there's already an open request for this user
            const existing = await prisma.passwordResetRequest.findFirst({
                where: { userId: u.id, status: 'pending' },
            });
            if (!existing) {
                await prisma.passwordResetRequest.create({
                    data: {
                        userId: u.id,
                        source: 'forgot',
                        status: 'pending',
                        reason: body.reason ?? null,
                    },
                });
            }
            return { ok: true };
        } catch (err) { return handleError(reply, err); }
    });
}
