import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';
import { logAudit } from '../../common/audit.js';

/**
 * Canonical enrollment status values. Stored as string in DB (no enum yet).
 *   pending   — student-requested, awaiting approval
 *   enrolled  — active enrollment
 *   rejected  — request denied by staff
 *   dropped   — student left the course
 *   withdrawn — staff removed the student
 *   completed — finished (term end)
 */
const ENROLL_STATUS = ['pending', 'enrolled', 'rejected', 'dropped', 'withdrawn', 'completed'] as const;
const StatusEnum = z.enum(ENROLL_STATUS);

const EnrollmentBody = z.object({
    studentId: z.string(),
    courseId: z.string(),
    teacherId: z.string().optional().nullable(),
    academicYear: z.string().min(4),
    semester: z.string().optional().nullable(),
    status: StatusEnum.default('enrolled'),
});

const BulkBody = z.object({
    studentIds: z.array(z.string().min(1)).min(1),
    courseIds: z.array(z.string().min(1)).min(1),
    academicYear: z.string().min(4),
    semester: z.string().optional().nullable(),
    teacherId: z.string().optional().nullable(),
    status: StatusEnum.default('enrolled'),
});

const RequestBody = z.object({
    courseId: z.string(),
    academicYear: z.string().min(4),
    semester: z.string().optional().nullable(),
});

const PatchBody = z.object({
    status: StatusEnum.optional(),
    teacherId: z.string().nullable().optional(),
    semester: z.string().nullable().optional(),
});

const ListQuery = z.object({
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    academicYear: z.string().optional(),
    status: StatusEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

const includeFull = {
    student: { include: { user: true } },
    course: true,
    teacher: { include: { user: true } },
} as const;

export async function enrollmentRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    /* GET / — paginated list, role-scoped */
    app.get('/', async (req, reply) => {
        try {
            const q = ListQuery.parse(req.query);
            const role = req.user!.role;
            const where: any = {};
            if (q.studentId) where.studentId = q.studentId;
            if (q.courseId) where.courseId = q.courseId;
            if (q.academicYear) where.academicYear = q.academicYear;
            if (q.status) where.status = q.status;

            if (role === 'STUDENT') {
                const s = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
                where.studentId = s?.id ?? '__none__';
            } else if (role === 'TEACHER') {
                const t = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
                // teacher sees enrollments they're assigned to OR in courses they teach
                where.OR = [
                    { teacherId: t?.id ?? '__none__' },
                    { course: { teacherId: t?.id ?? '__none__' } },
                ];
            }

            const [items, total] = await Promise.all([
                prisma.enrollment.findMany({
                    where,
                    include: includeFull,
                    orderBy: { createdAt: 'desc' },
                    skip: (q.page - 1) * q.limit,
                    take: q.limit,
                }),
                prisma.enrollment.count({ where }),
            ]);
            return { items, total, page: q.page, limit: q.limit };
        } catch (err) { return handleError(reply, err); }
    });

    /* POST / — create one (staff only) */
    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = EnrollmentBody.parse(req.body);
            const e = await prisma.enrollment.create({ data: body, include: includeFull });
            return reply.code(201).send(e);
        } catch (err) { return handleError(reply, err); }
    });

    /* POST /bulk — N students × M courses (staff or assigned teacher) */
    app.post('/bulk', async (req, reply) => {
        try {
            const role = req.user!.role;
            const body = BulkBody.parse(req.body);

            // Permission: staff anywhere; teacher only for courses they're assigned to
            if (role === 'STUDENT') return reply.code(403).send({ message: 'Forbidden' });
            if (role === 'TEACHER') {
                const t = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
                if (!t) return reply.code(403).send({ message: 'Teacher profile missing' });
                const owned = await prisma.course.count({
                    where: { id: { in: body.courseIds }, teacherId: t.id },
                });
                if (owned !== body.courseIds.length) {
                    return reply.code(403).send({ message: 'You can only enroll into courses you teach' });
                }
                // force teacherId to themselves
                body.teacherId = t.id;
            }

            // Build the cross product (N × M)
            const pairs: { studentId: string; courseId: string }[] = [];
            for (const sId of body.studentIds) for (const cId of body.courseIds) pairs.push({ studentId: sId, courseId: cId });

            // Find which already exist for that academic year (unique = student+course+year)
            const existing = await prisma.enrollment.findMany({
                where: {
                    academicYear: body.academicYear,
                    studentId: { in: body.studentIds },
                    courseId: { in: body.courseIds },
                },
                select: { studentId: true, courseId: true },
            });
            const existingKey = new Set(existing.map((e) => `${e.studentId}::${e.courseId}`));

            const toCreate = pairs.filter((p) => !existingKey.has(`${p.studentId}::${p.courseId}`));
            const skipped = pairs
                .filter((p) => existingKey.has(`${p.studentId}::${p.courseId}`))
                .map((p) => ({ ...p, reason: 'already_enrolled' as const }));

            if (toCreate.length === 0) {
                return reply.send({ created: [], skipped, createdCount: 0, skippedCount: skipped.length });
            }

            // Resolve teacherId per course when not explicitly provided
            let courseTeacherMap = new Map<string, string | null>();
            if (!body.teacherId) {
                const courses = await prisma.course.findMany({
                    where: { id: { in: body.courseIds } },
                    select: { id: true, teacherId: true },
                });
                courseTeacherMap = new Map(courses.map((c) => [c.id, c.teacherId]));
            }

            const data = toCreate.map((p) => ({
                studentId: p.studentId,
                courseId: p.courseId,
                teacherId: body.teacherId ?? courseTeacherMap.get(p.courseId) ?? null,
                academicYear: body.academicYear,
                semester: body.semester ?? null,
                status: body.status,
            }));

            await prisma.enrollment.createMany({ data, skipDuplicates: true });

            const created = await prisma.enrollment.findMany({
                where: {
                    academicYear: body.academicYear,
                    OR: toCreate.map((p) => ({ studentId: p.studentId, courseId: p.courseId })),
                },
                include: includeFull,
            });

            return reply.code(201).send({
                created,
                skipped,
                createdCount: created.length,
                skippedCount: skipped.length,
            });
        } catch (err) { return handleError(reply, err); }
    });

    /* POST /request — student self-requests an enrollment */
    app.post('/request', async (req, reply) => {
        try {
            if (req.user!.role !== 'STUDENT') return reply.code(403).send({ message: 'Only students can request enrollment' });
            const body = RequestBody.parse(req.body);
            const student = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            if (!student) return reply.code(403).send({ message: 'No student profile linked to your account' });

            const course = await prisma.course.findUnique({ where: { id: body.courseId }, select: { id: true, teacherId: true } });
            if (!course) return reply.code(404).send({ message: 'Course not found' });

            const existing = await prisma.enrollment.findFirst({
                where: { studentId: student.id, courseId: body.courseId, academicYear: body.academicYear },
            });
            if (existing) {
                return reply.code(409).send({
                    message: `You already have a ${existing.status} record for this course in ${body.academicYear}`,
                    existing,
                });
            }

            const created = await prisma.enrollment.create({
                data: {
                    studentId: student.id,
                    courseId: body.courseId,
                    teacherId: course.teacherId,
                    academicYear: body.academicYear,
                    semester: body.semester ?? null,
                    status: 'pending',
                },
                include: includeFull,
            });
            return reply.code(201).send(created);
        } catch (err) { return handleError(reply, err); }
    });

    /* PATCH /:id — status / teacher / semester updates */
    app.patch('/:id', async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = PatchBody.parse(req.body);
            const role = req.user!.role;

            const current = await prisma.enrollment.findUnique({
                where: { id },
                include: {
                    course: { select: { teacherId: true, code: true, title: true } },
                    student: { select: { user: { select: { name: true } } } },
                },
            });
            if (!current) return reply.code(404).send({ message: 'Enrollment not found' });

            if (role === 'STUDENT') {
                const s = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
                if (current.studentId !== s?.id) return reply.code(403).send({ message: 'Forbidden' });
                // student can only self-drop or cancel pending
                if (body.status && !['dropped'].includes(body.status)) {
                    return reply.code(403).send({ message: 'Students can only drop their own enrollment' });
                }
                if (body.teacherId !== undefined || body.semester !== undefined) {
                    return reply.code(403).send({ message: 'Students cannot change teacher or semester' });
                }
            } else if (role === 'TEACHER') {
                const t = await prisma.teacher.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
                const ownsCourse = current.course?.teacherId === t?.id;
                const ownsEnrollment = current.teacherId === t?.id;
                if (!ownsCourse && !ownsEnrollment) return reply.code(403).send({ message: 'Forbidden' });
            }
            // INSTANCE_ADMIN / MANAGER: no extra check

            const updated = await prisma.enrollment.update({
                where: { id },
                data: {
                    ...(body.status !== undefined ? { status: body.status } : {}),
                    ...(body.teacherId !== undefined ? { teacherId: body.teacherId } : {}),
                    ...(body.semester !== undefined ? { semester: body.semester } : {}),
                },
                include: includeFull,
            });
            if (body.status !== undefined && body.status !== current.status) {
                logAudit(req, 'enrollment.status.changed', 'enrollment', id, {
                    student: current.student?.user?.name,
                    course: current.course ? `${current.course.code} — ${current.course.title}` : undefined,
                    from: current.status,
                    to: body.status,
                });
            }
            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    /* DELETE /:id — hard delete (staff only) */
    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.enrollment.findUnique({
                where: { id },
                select: {
                    status: true, academicYear: true,
                    student: { select: { user: { select: { name: true } } } },
                    course: { select: { code: true, title: true } },
                },
            });
            await prisma.enrollment.delete({ where: { id } });
            logAudit(req, 'enrollment.deleted', 'enrollment', id, {
                student: existing?.student?.user?.name,
                course: existing?.course ? `${existing.course.code} — ${existing.course.title}` : undefined,
                academicYear: existing?.academicYear,
                status: existing?.status,
            });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
