import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authenticate } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

/**
 * Computed notification feed — no separate Notification table.
 * Returns counts and a small list of recent items relevant to the current role.
 */
export async function notificationRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get('/summary', async (req, reply) => {
        try {
            const role = req.user!.role;
            const items: Array<{
                kind: 'enrollment_request' | 'password_reset_request' | 'student_application' | 'enrollment_status' | 'password_reset_status';
                id: string;
                title: string;
                subtitle?: string;
                createdAt: Date;
                href?: string;
            }> = [];
            let pendingEnrollments = 0;
            let pendingPasswordResets = 0;
            let pendingStudentApplications = 0;

            if (role === 'INSTANCE_ADMIN' || role === 'MANAGER') {
                // staff: pending enrollments + password resets + student applications, system-wide
                const [enrolls, resets, apps] = await Promise.all([
                    prisma.enrollment.findMany({
                        where: { status: 'pending' },
                        include: { student: { include: { user: true } }, course: true },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    }),
                    prisma.passwordResetRequest.findMany({
                        where: { status: 'pending' },
                        include: { user: { select: { name: true, email: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    }),
                    prisma.student.findMany({
                        where: { status: 'pending' },
                        include: { user: { select: { name: true, email: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    }),
                ]);
                pendingEnrollments = await prisma.enrollment.count({ where: { status: 'pending' } });
                pendingPasswordResets = await prisma.passwordResetRequest.count({ where: { status: 'pending' } });
                pendingStudentApplications = await prisma.student.count({ where: { status: 'pending' } });

                for (const e of enrolls) {
                    items.push({
                        kind: 'enrollment_request',
                        id: e.id,
                        title: `${e.student.user.name} requested to enroll`,
                        subtitle: `${e.course.code} · ${e.course.title}`,
                        createdAt: e.createdAt,
                        href: '/admin/enrollments?status=pending',
                    });
                }
                for (const r of resets) {
                    items.push({
                        kind: 'password_reset_request',
                        id: r.id,
                        title: `${r.user.name} requested a password reset`,
                        subtitle: r.reason ?? r.user.email,
                        createdAt: r.createdAt,
                        href: '/admin/requests',
                    });
                }
                for (const a of apps) {
                    items.push({
                        kind: 'student_application',
                        id: a.id,
                        title: `${a.user.name} applied to join`,
                        subtitle: a.user.email,
                        createdAt: a.createdAt,
                        href: '/admin/requests',
                    });
                }
            } else if (role === 'TEACHER') {
                // teacher: pending enrollments in courses they teach
                const t = await prisma.teacher.findUnique({
                    where: { userId: req.user!.sub },
                    select: { id: true },
                });
                if (t) {
                    const enrolls = await prisma.enrollment.findMany({
                        where: {
                            status: 'pending',
                            OR: [{ teacherId: t.id }, { course: { teacherId: t.id } }],
                        },
                        include: { student: { include: { user: true } }, course: true },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    });
                    pendingEnrollments = enrolls.length;
                    for (const e of enrolls) {
                        items.push({
                            kind: 'enrollment_request',
                            id: e.id,
                            title: `${e.student.user.name} requested to enroll`,
                            subtitle: `${e.course.code} · ${e.course.title}`,
                            createdAt: e.createdAt,
                            href: `/teacher/courses/${e.course.id}`,
                        });
                    }
                }
            } else if (role === 'STUDENT') {
                // student: status updates on their own requests
                const s = await prisma.student.findUnique({
                    where: { userId: req.user!.sub },
                    select: { id: true },
                });
                if (s) {
                    const recent = await prisma.enrollment.findMany({
                        where: { studentId: s.id, status: { in: ['enrolled', 'rejected'] } },
                        include: { course: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    });
                    for (const e of recent) {
                        items.push({
                            kind: 'enrollment_status',
                            id: e.id,
                            title: e.status === 'enrolled' ? `Enrolled in ${e.course.code}` : `Request rejected for ${e.course.code}`,
                            subtitle: e.course.title,
                            createdAt: e.createdAt,
                            href: '/student/enrollments',
                        });
                    }
                }
                const myResets = await prisma.passwordResetRequest.findMany({
                    where: { userId: req.user!.sub, status: { in: ['fulfilled', 'rejected'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                });
                for (const r of myResets) {
                    items.push({
                        kind: 'password_reset_status',
                        id: r.id,
                        title: r.status === 'fulfilled' ? 'Your password reset is ready' : 'Your password reset was rejected',
                        createdAt: r.fulfilledAt ?? r.createdAt,
                        href: '/profile',
                    });
                }
            }

            // sort and cap
            items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
            return {
                total: pendingEnrollments + pendingPasswordResets + pendingStudentApplications,
                pendingEnrollments,
                pendingPasswordResets,
                pendingStudentApplications,
                items: items.slice(0, 15),
            };
        } catch (err) { return handleError(reply, err); }
    });
}
