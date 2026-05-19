import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { PaginationQuery, skipTake } from '../../common/pagination.js';
import { handleError } from '../../common/errors.js';
import { hashPassword } from '../auth/auth.service.js';

const CreateTeacher = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8).optional(),
    staffNumber: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    specialties: z.array(z.string()).default([]),
});

const UpdateTeacher = z.object({
    staffNumber: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    specialties: z.array(z.string()).optional(),
    // mirrored to User
    name: z.string().min(1).optional(),
    phone: z.string().optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
});

export async function teacherRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const q = PaginationQuery.parse(req.query);
            const where = q.q
                ? {
                    OR: [
                        { staffNumber: { contains: q.q, mode: 'insensitive' as const } },
                        { user: { name: { contains: q.q, mode: 'insensitive' as const } } },
                        { user: { email: { contains: q.q, mode: 'insensitive' as const } } },
                    ],
                }
                : {};
            const [total, items] = await Promise.all([
                prisma.teacher.count({ where }),
                prisma.teacher.findMany({ where, ...skipTake(q), orderBy: { createdAt: 'desc' }, include: { user: true } }),
            ]);
            return { total, page: q.page, limit: q.limit, items };
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = CreateTeacher.parse(req.body);
            const password = body.password ?? Math.random().toString(36).slice(-12) + 'A!';
            const passwordHash = await hashPassword(password);

            const teacher = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: { email: body.email, name: body.name, role: 'TEACHER', passwordHash },
                });
                return tx.teacher.create({
                    data: {
                        userId: user.id,
                        staffNumber: body.staffNumber ?? null,
                        title: body.title ?? null,
                        bio: body.bio ?? null,
                        specialties: body.specialties,
                    },
                    include: { user: true },
                });
            });
            return reply.code(201).send({ teacher, generatedPassword: body.password ? undefined : password });
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/me', { preHandler: requireRole('TEACHER') }, async (req, reply) => {
        const t = await prisma.teacher.findUnique({
            where: { userId: req.user!.sub },
            include: { user: true },
        });
        if (!t) return reply.code(404).send({ error: 'NoTeacherProfile' });
        return t;
    });

    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        if (req.user!.role === 'TEACHER') {
            const self = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            if (!self || self.id !== id) return reply.code(403).send({ error: 'Forbidden' });
        }
        const t = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
        if (!t) return reply.code(404).send({ error: 'NotFound' });
        return t;
    });

    app.patch('/:id', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const role = req.user!.role;
            if (role === 'TEACHER') {
                const self = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
                if (!self || self.id !== id) return reply.code(403).send({ error: 'Forbidden' });
            } else if (role !== 'INSTANCE_ADMIN' && role !== 'MANAGER') {
                return reply.code(403).send({ error: 'Forbidden' });
            }
            const body = UpdateTeacher.parse(req.body);
            const teacher = await prisma.teacher.findUnique({ where: { id } });
            if (!teacher) return reply.code(404).send({ error: 'NotFound' });

            const updated = await prisma.$transaction(async (tx) => {
                const userData: Record<string, unknown> = {};
                if (body.name !== undefined)      userData.name = body.name;
                if (body.phone !== undefined)     userData.phone = body.phone;
                if (body.avatarUrl !== undefined) userData.avatarUrl = body.avatarUrl;
                if (Object.keys(userData).length) {
                    await tx.user.update({ where: { id: teacher.userId }, data: userData });
                }
                const tData: Record<string, unknown> = {};
                if (body.staffNumber !== undefined) tData.staffNumber = body.staffNumber;
                if (body.title !== undefined)       tData.title = body.title;
                if (body.bio !== undefined)         tData.bio = body.bio;
                if (body.specialties !== undefined) tData.specialties = body.specialties;
                if (Object.keys(tData).length) {
                    await tx.teacher.update({ where: { id }, data: tData });
                }
                return tx.teacher.findUnique({ where: { id }, include: { user: true } });
            });
            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.teacher.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
