import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { PaginationQuery, skipTake } from '../../common/pagination.js';
import { handleError } from '../../common/errors.js';
import { hashPassword } from '../auth/auth.service.js';
import type { Role } from '@prisma/client';

const RoleEnum = z.enum(['INSTANCE_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']);

const CreateUser = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8),
    role: RoleEnum.default('STUDENT'),
    phone: z.string().optional(),
});

const UpdateUser = z.object({
    name: z.string().min(1).optional(),
    role: RoleEnum.optional(),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    avatarUrl: z.string().url().optional().nullable(),
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
                    select: { id: true, email: true, name: true, role: true, isActive: true, phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true },
                }),
            ]);
            return { total, page: q.page, limit: q.limit, items };
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
                    phone: body.phone,
                    passwordHash,
                },
                select: { id: true, email: true, name: true, role: true, isActive: true, phone: true },
            });
            return reply.code(201).send(user);
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        // Self or admin/manager
        if (req.user!.sub !== id && !['INSTANCE_ADMIN', 'MANAGER'].includes(req.user!.role)) {
            return reply.code(403).send({ error: 'Forbidden' });
        }
        const u = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true, isActive: true, phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true },
        });
        if (!u) return reply.code(404).send({ error: 'NotFound' });
        return u;
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = UpdateUser.parse(req.body);
            const u = await prisma.user.update({
                where: { id },
                data: body,
                select: { id: true, email: true, name: true, role: true, isActive: true, phone: true, avatarUrl: true },
            });
            return u;
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.user.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
