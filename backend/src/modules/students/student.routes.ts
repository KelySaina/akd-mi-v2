import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole, hasRole } from '../../common/auth.js';
import { PaginationQuery, skipTake } from '../../common/pagination.js';
import { handleError } from '../../common/errors.js';
import { logAudit } from '../../common/audit.js';
import { hashPassword } from '../auth/auth.service.js';

const CreateStudent = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8).optional(),
    studentNumber: z.string().min(1),
    programId: z.string().optional().nullable(),
    enrollmentYear: z.number().int().optional().nullable(),
    birthDate: z.string().datetime().optional().nullable(),
    guardianName: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
});

const UpdateStudent = z.object({
    studentNumber: z.string().min(1).optional(),
    programId: z.string().optional().nullable(),
    enrollmentYear: z.number().int().optional().nullable(),
    status: z.enum(['pending', 'active', 'graduated', 'suspended', 'dropped']).optional(),
    birthDate: z.string().datetime().optional().nullable(),
    guardianName: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
    // mirrored to User row
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
});

export async function studentRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    // List pending student applications (created by public self-registration).
    // Must come BEFORE '/:id' so Fastify routes 'pending' as a literal.
    app.get('/pending', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (_req, reply) => {
        try {
            const items = await prisma.student.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, isActive: true, createdAt: true } } },
            });
            return { items };
        } catch (err) { return handleError(reply, err); }
    });

    const ApproveBody = z.object({
        studentNumber: z.string().trim().min(1).max(40).optional(),
        programId: z.string().optional().nullable(),
        enrollmentYear: z.number().int().optional().nullable(),
    });

    // Approve a pending applicant: assign a real student number, activate the
    // user, generate a fresh password to share with them, and return it.
    app.post('/:id/approve', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = ApproveBody.parse(req.body ?? {});
            const existing = await prisma.student.findUnique({ where: { id }, include: { user: true } });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });
            if (existing.status !== 'pending') return reply.code(409).send({ error: 'NotPending' });

            const password = Math.random().toString(36).slice(-12) + 'A!';
            const passwordHash = await hashPassword(password);
            const studentNumber = body.studentNumber?.trim()
                || (existing.studentNumber.startsWith('PEND-')
                    ? `STU-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`
                    : existing.studentNumber);

            const updated = await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: existing.userId },
                    data: { isActive: true, passwordHash },
                });
                return tx.student.update({
                    where: { id },
                    data: {
                        status: 'active',
                        studentNumber,
                        programId: body.programId ?? existing.programId,
                        enrollmentYear: body.enrollmentYear ?? existing.enrollmentYear,
                    },
                    include: { user: true, program: true },
                });
            });

            logAudit(req, 'student.approved', 'student', id, {
                name: existing.user?.name,
                studentNumber,
            });

            return { student: updated, generatedPassword: password };
        } catch (err) { return handleError(reply, err); }
    });

    // Reject a pending applicant: remove the student + user rows entirely.
    app.post('/:id/reject', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.student.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });
            if (existing.status !== 'pending') return reply.code(409).send({ error: 'NotPending' });
            await prisma.$transaction(async (tx) => {
                await tx.student.delete({ where: { id } });
                await tx.user.delete({ where: { id: existing.userId } });
            });
            logAudit(req, 'student.rejected', 'student', id, { name: existing.user?.name });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const q = PaginationQuery.parse(req.query);
            const where = q.q
                ? {
                    OR: [
                        { studentNumber: { contains: q.q, mode: 'insensitive' as const } },
                        { user: { name: { contains: q.q, mode: 'insensitive' as const } } },
                        { user: { email: { contains: q.q, mode: 'insensitive' as const } } },
                    ],
                }
                : {};
            const [total, items] = await Promise.all([
                prisma.student.count({ where }),
                prisma.student.findMany({
                    where, ...skipTake(q), orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, email: true, name: true, avatarUrl: true, isActive: true } }, program: true },
                }),
            ]);
            return { total, page: q.page, limit: q.limit, items };
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = CreateStudent.parse(req.body);
            const password = body.password ?? Math.random().toString(36).slice(-12) + 'A!';
            const passwordHash = await hashPassword(password);

            const created = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: { email: body.email, name: body.name, role: 'STUDENT', passwordHash },
                });
                const student = await tx.student.create({
                    data: {
                        userId: user.id,
                        studentNumber: body.studentNumber,
                        programId: body.programId ?? null,
                        enrollmentYear: body.enrollmentYear ?? null,
                        birthDate: body.birthDate ? new Date(body.birthDate) : null,
                        guardianName: body.guardianName ?? null,
                        guardianPhone: body.guardianPhone ?? null,
                    },
                    include: { user: true, program: true },
                });
                return student;
            });

            return reply.code(201).send({ student: created, generatedPassword: body.password ? undefined : password });
        } catch (err) { return handleError(reply, err); }
    });

    app.get('/me', { preHandler: requireRole('STUDENT') }, async (req, reply) => {
        const s = await prisma.student.findUnique({
            where: { userId: req.user!.sub },
            include: {
                user: true,
                program: true,
                enrollments: {
                    include: {
                        course: true,
                        teacher: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
                        grades: { orderBy: { gradedAt: 'desc' } },
                    },
                    orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }],
                },
            },
        });
        if (!s) return reply.code(404).send({ error: 'NoStudentProfile' });
        return s;
    });

    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        // STUDENTs without admin/manager privileges can only read their own record
        if (!hasRole(req.user, 'INSTANCE_ADMIN', 'MANAGER', 'TEACHER') && hasRole(req.user, 'STUDENT')) {
            const self = await prisma.student.findUnique({ where: { userId: req.user!.sub }, select: { id: true } });
            if (!self || self.id !== id) return reply.code(403).send({ error: 'Forbidden' });
        }
        const s = await prisma.student.findUnique({
            where: { id },
            include: {
                user: true,
                program: true,
                enrollments: {
                    include: {
                        course: true,
                        teacher: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
                        grades: { orderBy: { gradedAt: 'desc' } },
                    },
                    orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }],
                },
            },
        });
        if (!s) return reply.code(404).send({ error: 'NotFound' });
        return s;
    });

    app.patch('/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = UpdateStudent.parse(req.body);
            const existing = await prisma.student.findUnique({
                where: { id },
                include: { user: { select: { isActive: true, name: true } } },
            });
            if (!existing) return reply.code(404).send({ error: 'NotFound' });

            const updated = await prisma.$transaction(async (tx) => {
                // User-side fields
                const userData: Record<string, unknown> = {};
                if (body.name !== undefined)      userData.name = body.name;
                if (body.email !== undefined)     userData.email = body.email;
                if (body.phone !== undefined)     userData.phone = body.phone;
                if (body.avatarUrl !== undefined) userData.avatarUrl = body.avatarUrl;
                if (body.isActive !== undefined)  userData.isActive = body.isActive;
                if (Object.keys(userData).length) {
                    await tx.user.update({ where: { id: existing.userId }, data: userData });
                }
                // Student-side fields
                const studentData: Record<string, unknown> = {};
                if (body.studentNumber !== undefined)  studentData.studentNumber = body.studentNumber;
                if (body.programId !== undefined)      studentData.programId = body.programId;
                if (body.enrollmentYear !== undefined) studentData.enrollmentYear = body.enrollmentYear;
                if (body.status !== undefined)         studentData.status = body.status;
                if (body.birthDate !== undefined)      studentData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
                if (body.guardianName !== undefined)   studentData.guardianName = body.guardianName;
                if (body.guardianPhone !== undefined)  studentData.guardianPhone = body.guardianPhone;
                if (Object.keys(studentData).length) {
                    await tx.student.update({ where: { id }, data: studentData });
                }
                return tx.student.findUnique({
                    where: { id },
                    include: { user: true, program: true },
                });
            });

            const studentName = existing.user?.name ?? body.name ?? 'Student';
            if (body.status !== undefined && body.status !== existing.status) {
                logAudit(req, 'student.status.changed', 'student', id, {
                    name: studentName,
                    from: existing.status,
                    to: body.status,
                });
            }
            if (body.isActive !== undefined && existing.user && existing.user.isActive !== body.isActive) {
                logAudit(req, body.isActive ? 'student.activated' : 'student.deactivated', 'student', id, {
                    name: studentName,
                    isActive: body.isActive,
                });
            }

            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    app.delete('/:id', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const existing = await prisma.student.findUnique({
                where: { id },
                include: { user: { select: { name: true } } },
            });
            await prisma.student.delete({ where: { id } });
            logAudit(req, 'student.deleted', 'student', id, {
                name: existing?.user?.name, studentNumber: existing?.studentNumber,
            });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
}
