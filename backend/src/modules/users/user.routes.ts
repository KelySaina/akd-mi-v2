import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole, hasRole, effectiveRoles } from '../../common/auth.js';
import { PaginationQuery, skipTake } from '../../common/pagination.js';
import { handleError } from '../../common/errors.js';
import { logAudit } from '../../common/audit.js';
import { hashPassword } from '../auth/auth.service.js';
import type { Role } from '@prisma/client';

const RoleEnum = z.enum(['INSTANCE_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']);

const CreateUser = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8),
    role: RoleEnum.default('STUDENT'),
    extraRoles: z.array(RoleEnum).optional(),
    phone: z.string().optional(),
});

const UpdateUser = z.object({
    name: z.string().min(1).optional(),
    role: RoleEnum.optional(),
    extraRoles: z.array(RoleEnum).optional(),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    avatarUrl: z.string().url().optional().nullable(),
});

const UpdateRoles = z.object({
    role: RoleEnum.optional(),
    extraRoles: z.array(RoleEnum).default([]),
});

export async function userRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const q = PaginationQuery.parse(req.query);
            const where = q.q
                ? { OR: [{ email: { contains: q.q, mode: 'insensitive' as const } }, { name: { contains: q.q, mode: 'insensitive' as const } }] }
                : {};
            const [total, items] = await Promise.all([
                prisma.user.count({ where }),
                prisma.user.findMany({
                    where,
                    ...skipTake(q),
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, email: true, name: true, role: true, extraRoles: true, isActive: true, phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true },
                }),
            ]);
            return {
                total, page: q.page, limit: q.limit,
                items: items.map((u) => ({ ...u, roles: effectiveRoles(u.role, u.extraRoles) })),
            };
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const body = CreateUser.parse(req.body);
            const passwordHash = await hashPassword(body.password);
            const user = await prisma.user.create({
                data: {
                    email: body.email,
                    name: body.name,
                    role: body.role as Role,
                    extraRoles: (body.extraRoles ?? []).filter((r) => r !== body.role) as Role[],
                    phone: body.phone,
                    passwordHash,
                },
                select: { id: true, email: true, name: true, role: true, extraRoles: true, isActive: true, phone: true },
            });
            return reply.code(201).send({ ...user, roles: effectiveRoles(user.role, user.extraRoles) });
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        // Self or admin/manager (effective role)
        if (req.user!.sub !== id && !hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER')) {
            return reply.code(403).send({ error: 'Forbidden' });
        }
        const u = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true, extraRoles: true, isActive: true, phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true },
        });
        if (!u) return reply.code(404).send({ error: 'NotFound' });
        return { ...u, roles: effectiveRoles(u.role, u.extraRoles) };
    });

    /** Admin-only: update a user's primary role and extra granted roles in one call */
    app.patch('/:id/roles', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = UpdateRoles.parse(req.body);
            const current = await prisma.user.findUnique({ where: { id }, select: { role: true } });
            if (!current) return reply.code(404).send({ error: 'NotFound' });
            const primary = (body.role ?? current.role) as Role;
            const extras = (body.extraRoles ?? []).filter((r) => r !== primary) as Role[];
            const u = await prisma.user.update({
                where: { id },
                data: { role: primary, extraRoles: extras },
                select: { id: true, email: true, name: true, role: true, extraRoles: true },
            });
            return { ...u, roles: effectiveRoles(u.role, u.extraRoles) };
        } catch (err) { return handleError(reply, err); }
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = UpdateUser.parse(req.body);
            const data: any = { ...body };
            const before = await prisma.user.findUnique({ where: { id }, select: { isActive: true, role: true, name: true } });
            if (body.extraRoles && body.role) {
                data.extraRoles = body.extraRoles.filter((r) => r !== body.role);
            } else if (body.extraRoles && !body.role) {
                // Don't include primary role in extras
                data.extraRoles = before ? body.extraRoles.filter((r) => r !== before.role) : body.extraRoles;
            }
            const u = await prisma.user.update({
                where: { id },
                data,
                select: { id: true, email: true, name: true, role: true, extraRoles: true, isActive: true, phone: true, avatarUrl: true },
            });
            if (before && body.isActive !== undefined && before.isActive !== body.isActive) {
                logAudit(req, body.isActive ? 'user.activated' : 'user.deactivated', 'user', id, { name: u.name, isActive: body.isActive });
            }
            const accountKeys = Object.keys(body).filter((k) => k !== 'isActive');
            if (accountKeys.length) {
                logAudit(req, 'user.account.updated', 'user', id, { name: u.name, keys: accountKeys, role: u.role });
            }
            return { ...u, roles: effectiveRoles(u.role, u.extraRoles) };
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true, role: true } });
            await prisma.user.delete({ where: { id } });
            logAudit(req, 'user.deleted', 'user', id, existing ?? undefined);
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
