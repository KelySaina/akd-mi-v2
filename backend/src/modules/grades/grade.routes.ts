import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

const GradeBody = z.object({
    enrollmentId: z.string(),
    assessment: z.string().min(1),
    score: z.number(),
    maxScore: z.number().default(100),
    comment: z.string().optional().nullable(),
});

export async function gradeRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', async (req) => {
        const { studentId, enrollmentId } = req.query as Record<string, string | undefined>;
        const role = req.user!.role;
        const where: Record<string, unknown> = { studentId, enrollmentId };
        if (role === 'STUDENT') {
            const s = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            where.studentId = s?.id ?? '__none__';
        } else if (role === 'TEACHER') {
            const t = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            where.enrollment = { teacherId: t?.id ?? '__none__' };
        }
        return prisma.grade.findMany({
            where,
            include: { enrollment: { include: { course: true } } },
            orderBy: { gradedAt: 'desc' },
            take: 500,
        });
    });

    async function ensureTeacherOwnsEnrollment(req: any, reply: any, enrollmentId: string) {
        if (req.user!.role !== 'TEACHER') return true;
        const t = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
        const e = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { teacherId: true } });
        if (!t || !e || e.teacherId !== t.id) { reply.code(403).send({ error: 'Forbidden' }); return false; }
        return true;
    }

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const body = GradeBody.parse(req.body);
            if (!(await ensureTeacherOwnsEnrollment(req, reply, body.enrollmentId))) return;
            const enrollment = await prisma.enrollment.findUnique({ where: { id: body.enrollmentId } });
            if (!enrollment) return reply.code(404).send({ error: 'EnrollmentNotFound' });
            const grade = await prisma.grade.create({
                data: { ...body, studentId: enrollment.studentId },
            });
            return reply.code(201).send(grade);
        } catch (err) { return handleError(reply, err); }
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.grade.findUnique({ where: { id }, select: { enrollmentId: true } });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });
            if (!(await ensureTeacherOwnsEnrollment(req, reply, existing.enrollmentId))) return;
            const body = GradeBody.partial().parse(req.body);
            return await prisma.grade.update({ where: { id }, data: body });
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.grade.findUnique({ where: { id }, select: { enrollmentId: true } });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });
            if (!(await ensureTeacherOwnsEnrollment(req, reply, existing.enrollmentId))) return;
            await prisma.grade.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
