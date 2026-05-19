import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

const EnrollmentBody = z.object({
    studentId: z.string(),
    courseId: z.string(),
    teacherId: z.string().optional().nullable(),
    academicYear: z.string().min(4),
    semester: z.string().optional().nullable(),
    status: z.string().default('enrolled'),
});

export async function enrollmentRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/', async (req) => {
        const { studentId, courseId, academicYear } = req.query as Record<string, string | undefined>;
        const role = req.user!.role;
        let scopedStudentId = studentId;
        let scopedTeacherId: string | undefined;
        if (role === 'STUDENT') {
            const s = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            scopedStudentId = s?.id ?? '__none__';
        } else if (role === 'TEACHER') {
            const t = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            scopedTeacherId = t?.id ?? '__none__';
        }
        return prisma.enrollment.findMany({
            where: { studentId: scopedStudentId, courseId, academicYear, teacherId: scopedTeacherId },
            include: { student: { include: { user: true } }, course: true, teacher: { include: { user: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = EnrollmentBody.parse(req.body);
            const e = await prisma.enrollment.create({ data: body });
            return reply.code(201).send(e);
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.enrollment.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
