import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { PaginationQuery, skipTake } from '../../common/pagination.js';
import { handleError } from '../../common/errors.js';

const CourseBody = z.object({
    code: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    credits: z.number().int().nonnegative().default(0),
    programId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export async function courseRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', async (req, reply) => {
        try {
            const q = PaginationQuery.parse(req.query);
            const where = q.q
                ? { OR: [{ code: { contains: q.q, mode: 'insensitive' as const } }, { title: { contains: q.q, mode: 'insensitive' as const } }] }
                : {};
            const [total, items] = await Promise.all([
                prisma.course.count({ where }),
                prisma.course.findMany({ where, ...skipTake(q), orderBy: { code: 'asc' }, include: { program: true } }),
            ]);
            return { total, page: q.page, limit: q.limit, items };
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = CourseBody.parse(req.body);
            const c = await prisma.course.create({ data: body });
            return reply.code(201).send(c);
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const c = await prisma.course.findUnique({ where: { id }, include: { program: true } });
        if (!c) return reply.code(404).send({ error: 'NotFound' });
        return c;
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = CourseBody.partial().parse(req.body);
            return await prisma.course.update({ where: { id }, data: body });
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.course.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
