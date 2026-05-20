import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole, hasRole } from '../../common/auth.js';
import { PaginationQuery, skipTake } from '../../common/pagination.js';
import { handleError } from '../../common/errors.js';

const CourseBody = z.object({
    code: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    credits: z.number().int().nonnegative().default(0),
    programId: z.string().optional().nullable(),
    teacherId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

const AttachBody = z.object({
    mediaId: z.string().optional(),
    mediaIds: z.array(z.string()).optional(),
}).refine((b) => !!b.mediaId || (b.mediaIds && b.mediaIds.length > 0), {
    message: 'mediaId or mediaIds is required',
});

const includeCourse = {
    program: true,
    teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
} as const;

async function teacherIdOfUser(req: FastifyRequest): Promise<string | null> {
    if (req.user?.role !== 'TEACHER') return null;
    const t = await prisma.teacher.findUnique({
        where: { userId: req.user!.sub },
        select: { id: true },
    });
    return t?.id ?? null;
}

/** Write access to course attachments: admin/manager or the assigned teacher. */
async function canManageCourse(req: FastifyRequest, courseId: string): Promise<boolean> {
    if (hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER')) return true;
    if (!hasRole(req.user, 'TEACHER')) return false;
    const tid = await teacherIdOfUser(req);
    if (!tid) return false;
    const c = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
    return !!c && c.teacherId === tid;
}

/** Read access: admin/manager, assigned teacher, enrolled teachers, enrolled students. */
async function canReadCourse(req: FastifyRequest, courseId: string): Promise<boolean> {
    if (hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER')) return true;
    if (hasRole(req.user, 'TEACHER')) {
        const tid = await teacherIdOfUser(req);
        if (tid) {
            const c = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
            if (c?.teacherId === tid) return true;
            const cnt = await prisma.enrollment.count({ where: { courseId, teacherId: tid } });
            if (cnt > 0) return true;
        }
    }
    if (hasRole(req.user, 'STUDENT')) {
        const s = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
        if (!s) return false;
        const cnt = await prisma.enrollment.count({ where: { courseId, studentId: s.id } });
        return cnt > 0;
    }
    return false;
}

export async function courseRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', async (req, reply) => {
        try {
            const q = PaginationQuery.parse(req.query);

            let where: any = q.q
                ? { OR: [{ code: { contains: q.q, mode: 'insensitive' as const } }, { title: { contains: q.q, mode: 'insensitive' as const } }] }
                : {};

            // Admins & managers see everything; otherwise scope to teacher's own courses
            if (!hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER') && hasRole(req.user, 'TEACHER')) {
                const tid = await teacherIdOfUser(req);
                if (!tid) return { total: 0, page: q.page, limit: q.limit, items: [] };
                where = {
                    ...where,
                    OR: [
                        { teacherId: tid },
                        { enrollments: { some: { teacherId: tid } } },
                    ],
                };
            }

            const [total, items] = await Promise.all([
                prisma.course.count({ where }),
                prisma.course.findMany({ where, ...skipTake(q), orderBy: { code: 'asc' }, include: includeCourse }),
            ]);
            return { total, page: q.page, limit: q.limit, items };
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = CourseBody.parse(req.body);
            const c = await prisma.course.create({ data: body, include: includeCourse });
            return reply.code(201).send(c);
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const c = await prisma.course.findUnique({
            where: { id },
            include: {
                ...includeCourse,
                attachments: {
                    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                    include: { media: true },
                },
            },
        });
        if (!c) return reply.code(404).send({ error: 'NotFound' });
        if (!(await canReadCourse(req, id))) return reply.code(403).send({ error: 'Forbidden' });
        return c;
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = CourseBody.partial().parse(req.body);
            return await prisma.course.update({ where: { id }, data: body, include: includeCourse });
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.course.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });

    // ── Attachments (link InstitutionMedia rows to a course) ──
    app.get('/:id/attachments', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            if (!(await canReadCourse(req, id))) return reply.code(403).send({ error: 'Forbidden' });
            return prisma.courseAttachment.findMany({
                where: { courseId: id },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                include: { media: true },
            });
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/:id/attachments', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            if (!(await canManageCourse(req, id))) return reply.code(403).send({ error: 'Forbidden' });
            const body = AttachBody.parse(req.body);
            const ids = body.mediaIds ?? (body.mediaId ? [body.mediaId] : []);
            const created = await prisma.$transaction(
                ids.map((mediaId) => prisma.courseAttachment.upsert({
                    where: { courseId_mediaId: { courseId: id, mediaId } },
                    create: { courseId: id, mediaId },
                    update: {},
                    include: { media: true },
                })),
            );
            return reply.code(201).send(created);
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id/attachments/:mediaId', async (req, reply) => {
        try {
            const { id, mediaId } = req.params as { id: string; mediaId: string };
            if (!(await canManageCourse(req, id))) return reply.code(403).send({ error: 'Forbidden' });
            await prisma.courseAttachment.delete({
                where: { courseId_mediaId: { courseId: id, mediaId } },
            });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
