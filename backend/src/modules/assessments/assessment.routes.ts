import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole, hasRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';
import { logAudit } from '../../common/audit.js';

const CreateBody = z.object({
    courseId: z.string(),
    name: z.string().min(1).max(120),
    maxScore: z.number().positive().default(100),
    weight: z.number().nonnegative().default(1),
    sortOrder: z.number().int().default(0),
});

const PatchBody = z.object({
    name: z.string().min(1).max(120).optional(),
    maxScore: z.number().positive().optional(),
    weight: z.number().nonnegative().optional(),
    sortOrder: z.number().int().optional(),
});

async function teacherIdOfUser(req: FastifyRequest): Promise<string | null> {
    if (!hasRole(req.user, 'TEACHER')) return null;
    const t = await prisma.teacher.findUnique({
        where: { userId: req.user!.sub },
        select: { id: true },
    });
    return t?.id ?? null;
}

async function canManageCourse(req: FastifyRequest, courseId: string): Promise<boolean> {
    if (hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER')) return true;
    if (!hasRole(req.user, 'TEACHER')) return false;
    const tid = await teacherIdOfUser(req);
    if (!tid) return false;
    const c = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
    if (c?.teacherId === tid) return true;
    const cnt = await prisma.enrollment.count({ where: { courseId, teacherId: tid } });
    return cnt > 0;
}

async function canReadCourse(req: FastifyRequest, courseId: string): Promise<boolean> {
    if (hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER')) return true;
    if (hasRole(req.user, 'TEACHER')) {
        const tid = await teacherIdOfUser(req);
        if (!tid) return false;
        const c = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
        if (c?.teacherId === tid) return true;
        const cnt = await prisma.enrollment.count({ where: { courseId, teacherId: tid } });
        return cnt > 0;
    }
    if (hasRole(req.user, 'STUDENT')) {
        const s = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
        if (!s) return false;
        const cnt = await prisma.enrollment.count({ where: { courseId, studentId: s.id } });
        return cnt > 0;
    }
    return false;
}

export async function assessmentRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', async (req, reply) => {
        try {
            const { courseId } = req.query as { courseId?: string };
            if (!courseId) return reply.code(400).send({ error: 'courseId required' });
            if (!(await canReadCourse(req, courseId))) return reply.code(403).send({ error: 'Forbidden' });
            return await prisma.assessment.findMany({
                where: { courseId },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const body = CreateBody.parse(req.body);
            if (!(await canManageCourse(req, body.courseId))) return reply.code(403).send({ error: 'Forbidden' });
            const created = await prisma.assessment.create({ data: body });
            return reply.code(201).send(created);
        } catch (err) { return handleError(reply, err); }
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.assessment.findUnique({ where: { id }, select: { courseId: true } });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });
            if (!(await canManageCourse(req, existing.courseId))) return reply.code(403).send({ error: 'Forbidden' });
            const body = PatchBody.parse(req.body);
            const updated = await prisma.assessment.update({ where: { id }, data: body });
            // keep grade label snapshots in sync if name changed
            if (body.name) {
                await prisma.grade.updateMany({ where: { assessmentId: id }, data: { assessment: body.name } });
            }
            if (body.maxScore) {
                await prisma.grade.updateMany({ where: { assessmentId: id }, data: { maxScore: body.maxScore } });
            }
            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.assessment.findUnique({ where: { id }, select: { courseId: true, name: true } });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });
            if (!(await canManageCourse(req, existing.courseId))) return reply.code(403).send({ error: 'Forbidden' });
            // cascade delete grades tied to this assessment
            await prisma.grade.deleteMany({ where: { assessmentId: id } });
            await prisma.assessment.delete({ where: { id } });
            logAudit(req, 'assessment.deleted', 'assessment', id, { name: existing.name, courseId: existing.courseId });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
