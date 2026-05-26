import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

/**
 * Activity feed — a merged, time-sorted stream of recent platform events
 * synthesized from the latest rows of the main entities. There is no
 * dedicated activity table yet; this is a pragmatic "what happened" view
 * for the admin dashboard / activity page.
 */

export type ActivityItem = {
    id: string;            // stable per source row, prefixed by kind
    kind: 'student' | 'teacher' | 'course' | 'enrollment' | 'grade' | 'media' | 'status' | 'deletion' | 'settings';
    title: string;         // short headline
    subtitle: string;      // 1-line context
    at: string;            // ISO timestamp
    href?: string;         // optional deep link
};

const Query = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function activityRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    app.get(
        '/',
        { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') },
        async (req, reply) => {
            try {
                const { limit } = Query.parse(req.query);
                const perKind = Math.max(5, Math.ceil(limit * 0.8));

                const [students, teachers, courses, enrollments, grades, media, audits] = await Promise.all([
                    prisma.student.findMany({
                        orderBy: { createdAt: 'desc' },
                        take: perKind,
                        select: {
                            id: true, createdAt: true, studentNumber: true,
                            user: { select: { name: true } },
                            program: { select: { name: true } },
                        },
                    }),
                    prisma.teacher.findMany({
                        orderBy: { createdAt: 'desc' },
                        take: perKind,
                        select: {
                            id: true, createdAt: true, title: true,
                            user: { select: { name: true } },
                        },
                    }),
                    prisma.course.findMany({
                        orderBy: { updatedAt: 'desc' },
                        take: perKind,
                        select: { id: true, code: true, title: true, createdAt: true, updatedAt: true },
                    }),
                    prisma.enrollment.findMany({
                        orderBy: { createdAt: 'desc' },
                        take: perKind,
                        select: {
                            id: true, createdAt: true, academicYear: true,
                            student: { select: { user: { select: { name: true } } } },
                            course:  { select: { code: true, title: true } },
                        },
                    }),
                    prisma.grade.findMany({
                        orderBy: { gradedAt: 'desc' },
                        take: perKind,
                        select: {
                            id: true, gradedAt: true, assessment: true, score: true, maxScore: true,
                            student: { select: { user: { select: { name: true } } } },
                            enrollment: { select: { course: { select: { code: true, title: true } } } },
                        },
                    }),
                    prisma.institutionMedia.findMany({
                        orderBy: { createdAt: 'desc' },
                        take: perKind,
                        select: { id: true, createdAt: true, kind: true, title: true, filename: true },
                    }),
                    prisma.auditLog.findMany({
                        orderBy: { createdAt: 'desc' },
                        take: perKind * 2,
                        select: { id: true, createdAt: true, action: true, entity: true, entityId: true, payload: true },
                    }),
                ]);

                const items: ActivityItem[] = [];

                for (const s of students) {
                    items.push({
                        id: `student:${s.id}`,
                        kind: 'student',
                        title: 'New student enrolled',
                        subtitle: `${s.user?.name ?? 'Student'} ${s.program?.name ? `· ${s.program.name}` : ''}`.trim(),
                        at: s.createdAt.toISOString(),
                        href: `/admin/students/${s.id}`,
                    });
                }

                for (const t of teachers) {
                    items.push({
                        id: `teacher:${t.id}`,
                        kind: 'teacher',
                        title: 'Teacher added',
                        subtitle: `${t.user?.name ?? 'Teacher'}${t.title ? ` (${t.title})` : ''}`,
                        at: t.createdAt.toISOString(),
                        href: '/admin/teachers',
                    });
                }

                for (const c of courses) {
                    const isNew = c.createdAt.getTime() === c.updatedAt.getTime();
                    items.push({
                        id: `course:${c.id}:${c.updatedAt.toISOString()}`,
                        kind: 'course',
                        title: isNew ? 'Course created' : 'Course updated',
                        subtitle: `${c.code} — ${c.title}`,
                        at: c.updatedAt.toISOString(),
                        href: '/admin/courses',
                    });
                }

                for (const e of enrollments) {
                    items.push({
                        id: `enrollment:${e.id}`,
                        kind: 'enrollment',
                        title: 'Enrollment',
                        subtitle: `${e.student?.user?.name ?? 'Student'} → ${e.course?.code ?? ''} ${e.course?.title ?? ''} (${e.academicYear})`.trim(),
                        at: e.createdAt.toISOString(),
                        href: '/admin/enrollments',
                    });
                }

                for (const g of grades) {
                    items.push({
                        id: `grade:${g.id}`,
                        kind: 'grade',
                        title: 'Grade published',
                        subtitle: `${g.enrollment?.course?.code ?? ''} — ${g.assessment} · ${g.student?.user?.name ?? 'Student'} (${g.score}/${g.maxScore})`.trim(),
                        at: g.gradedAt.toISOString(),
                    });
                }

                for (const m of media) {
                    const label = m.title?.trim() || m.filename || m.kind;
                    items.push({
                        id: `media:${m.id}`,
                        kind: 'media',
                        title: 'Media added',
                        subtitle: `${m.kind} · ${label}`,
                        at: m.createdAt.toISOString(),
                        href: '/admin/branding',
                    });
                }

                for (const a of audits) {
                    const meta = describeAudit(a.action, a.entity, a.payload as any);
                    if (!meta) continue;
                    items.push({
                        id: `audit:${a.id}`,
                        kind: meta.kind ?? 'status',
                        title: meta.title,
                        subtitle: meta.subtitle,
                        at: a.createdAt.toISOString(),
                        href: meta.href,
                    });
                }

                items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
                return { items: items.slice(0, limit) };
            } catch (err) { return handleError(reply, err); }
        },
    );
}

/* ---------------------------------------------------------------- *
 * Map an AuditLog row to a human-friendly activity entry.
 * Returns null to skip rows we don't want to surface (yet).
 * ---------------------------------------------------------------- */
type AuditMeta = { title: string; subtitle: string; href?: string; kind?: ActivityItem['kind'] };
function describeAudit(action: string, entity: string, payload: any): AuditMeta | null {
    const p = (payload || {}) as Record<string, any>;
    const name = p.name as string | undefined;
    switch (action) {
        // ── status changes ──
        case 'user.activated':
            return { title: 'User activated', subtitle: name ?? 'User account', href: '/admin/users' };
        case 'user.deactivated':
            return { title: 'User deactivated', subtitle: name ?? 'User account', href: '/admin/users' };
        case 'student.approved':
            return { title: 'Student application approved', subtitle: name ?? 'Student', href: '/admin/students' };
        case 'student.rejected':
            return { title: 'Student application rejected', subtitle: name ?? 'Student', href: '/admin/students' };
        case 'student.activated':
            return { title: 'Student activated', subtitle: name ?? 'Student', href: '/admin/students' };
        case 'student.deactivated':
            return { title: 'Student deactivated', subtitle: name ?? 'Student', href: '/admin/students' };
        case 'student.status.changed':
            return {
                title: 'Student status changed',
                subtitle: `${name ?? 'Student'} · ${p.from ?? '?'} → ${p.to ?? '?'}`,
                href: '/admin/students',
            };
        case 'enrollment.status.changed':
            return {
                title: 'Enrollment status changed',
                subtitle: `${p.student ?? 'Student'}${p.course ? ` · ${p.course}` : ''} · ${p.from ?? '?'} → ${p.to ?? '?'}`,
                href: '/admin/enrollments',
            };
        case 'course.activated':
            return { title: 'Course activated', subtitle: `${p.code ?? ''} — ${p.title ?? ''}`.trim(), href: '/admin/courses' };
        case 'course.deactivated':
            return { title: 'Course deactivated', subtitle: `${p.code ?? ''} — ${p.title ?? ''}`.trim(), href: '/admin/courses' };
        case 'module.enabled':
            return { title: 'Module enabled', subtitle: String(p.moduleKey ?? ''), href: '/admin/modules' };
        case 'module.disabled':
            return { title: 'Module disabled', subtitle: String(p.moduleKey ?? ''), href: '/admin/modules' };

        // ── account changes ──
        case 'user.account.updated':
            return {
                title: 'Account updated',
                subtitle: `${name ?? 'User'}${p.keys?.length ? ` · ${p.keys.join(', ')}` : ''}`,
                href: '/admin/users',
            };
        case 'password_reset.requested':
            return { title: 'Password reset requested', subtitle: 'User submitted a reset request', href: '/admin/password-resets' };
        case 'password_reset.fulfilled':
            return { title: 'Password reset fulfilled', subtitle: 'User account', href: '/admin/password-resets' };
        case 'password_reset.rejected':
            return { title: 'Password reset rejected', subtitle: 'User account', href: '/admin/password-resets' };
        case 'password_reset.admin_regenerated':
            return { title: 'Password regenerated by admin', subtitle: 'User account', href: '/admin/password-resets' };

        // ── institution settings / theme ──
        case 'institution.settings.updated':
            return { kind: 'settings', title: 'Institution settings updated', subtitle: p.keys?.join(', ') ?? '', href: '/admin/institution' };
        case 'institution.theme.updated':
            return { kind: 'settings', title: 'Branding / theme updated', subtitle: p.keys?.join(', ') ?? '', href: '/admin/branding' };
        case 'institution.address.created':
            return { kind: 'settings', title: 'Address added', subtitle: [p.city, p.country].filter(Boolean).join(', '), href: '/admin/institution' };
        case 'institution.address.updated':
            return { kind: 'settings', title: 'Address updated', subtitle: p.keys?.join(', ') ?? '', href: '/admin/institution' };
        case 'institution.address.deleted':
            return { kind: 'deletion', title: 'Address removed', subtitle: [p.city, p.country].filter(Boolean).join(', '), href: '/admin/institution' };
        case 'institution.contact.created':
            return { kind: 'settings', title: 'Contact added', subtitle: `${p.type ?? ''}: ${p.value ?? ''}`, href: '/admin/institution' };
        case 'institution.contact.deleted':
            return { kind: 'deletion', title: 'Contact removed', subtitle: `${p.type ?? ''}: ${p.value ?? ''}`, href: '/admin/institution' };

        // ── media ──
        // media.uploaded is intentionally NOT surfaced here because the
        // dedicated `media` source already emits a row per upload.
        case 'media.uploaded':
        case 'media.updated':
            return null;
        case 'media.deleted':
            return { kind: 'deletion', title: 'Media deleted', subtitle: `${p.kind ?? 'media'} · ${p.title || p.filename || ''}`, href: '/admin/branding' };

        // ── deletions ──
        case 'user.deleted':
            return { kind: 'deletion', title: 'User deleted', subtitle: `${name ?? p.email ?? 'User'}${p.role ? ` · ${p.role}` : ''}`, href: '/admin/users' };
        case 'student.deleted':
            return { kind: 'deletion', title: 'Student deleted', subtitle: `${name ?? 'Student'}${p.studentNumber ? ` · ${p.studentNumber}` : ''}`, href: '/admin/students' };
        case 'teacher.deleted':
            return { kind: 'deletion', title: 'Teacher deleted', subtitle: name ?? 'Teacher', href: '/admin/teachers' };
        case 'course.deleted':
            return { kind: 'deletion', title: 'Course deleted', subtitle: `${p.code ?? ''} — ${p.title ?? ''}`.trim(), href: '/admin/courses' };
        case 'enrollment.deleted':
            return {
                kind: 'deletion',
                title: 'Enrollment deleted',
                subtitle: `${p.student ?? 'Student'}${p.course ? ` · ${p.course}` : ''}${p.academicYear ? ` · ${p.academicYear}` : ''}`,
                href: '/admin/enrollments',
            };
        case 'assessment.deleted':
            return { kind: 'deletion', title: 'Assessment deleted', subtitle: p.name ?? 'Assessment' };
        case 'grade.deleted':
            return { kind: 'deletion', title: 'Grade deleted', subtitle: `${p.assessment ?? ''} (${p.score ?? '?'}/${p.maxScore ?? '?'})` };

        default:
            return null;
    }
}
