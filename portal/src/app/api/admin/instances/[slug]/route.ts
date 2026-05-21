import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { SLUG_RE } from '@/lib/akdmi';
import { createJob, JobConflictError } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

// GET /api/admin/instances/:slug — read row
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const inst = await prisma.instance.findUnique({ where: { slug } });
    if (!inst) return NextResponse.json({ error: 'NotFound' }, { status: 404 });
    return NextResponse.json({ instance: inst });
}

// PATCH /api/admin/instances/:slug — update directory metadata only (not infra)
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const inst = await prisma.instance.update({
        where: { slug },
        data: {
            name: body.name ?? undefined,
            category: body.category ?? undefined,
            description: body.description ?? undefined,
            city: body.city ?? undefined,
            country: body.country ?? undefined,
            logoUrl: body.logoUrl ?? undefined,
            isPublished: typeof body.isPublished === 'boolean' ? body.isPublished : undefined,
        },
    }).catch(() => null);
    if (!inst) return NextResponse.json({ error: 'NotFound' }, { status: 404 });
    return NextResponse.json(inst);
}

// DELETE /api/admin/instances/:slug — destroy stack + on-disk dir, then drop row.
// Runs `akd-mi destroy <slug>` as an async job; the DB row is removed in the
// job's onSuccess hook. Poll the returned jobId for progress.
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    try {
        const job = createJob({
            slug,
            kind: 'destroy',
            steps: [['destroy', slug, '--yes']],
            timeoutMs: 10 * 60 * 1000,
            onSuccess: async () => {
                await prisma.instance.delete({ where: { slug } }).catch(() => null);
            },
        });
        return NextResponse.json({ jobId: job.id, kind: job.kind, status: job.status }, { status: 202 });
    } catch (e: any) {
        if (e instanceof JobConflictError) {
            return NextResponse.json({ error: e.message, jobId: e.existingJobId }, { status: 409 });
        }
        return NextResponse.json({ error: e?.message ?? 'failed to start job' }, { status: 500 });
    }
}
