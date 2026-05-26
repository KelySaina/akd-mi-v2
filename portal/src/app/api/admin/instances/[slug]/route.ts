import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { SLUG_RE, projectDir } from '@/lib/akdmi';
import { createJob, JobConflictError } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

/** Update or insert a single KEY=VALUE entry in the instance .env (in-place). */
async function setInstanceEnvVar(slug: string, key: string, value: string): Promise<void> {
    const envPath = path.join(projectDir(), 'instances', slug, '.env');
    let txt = '';
    try { txt = await fs.readFile(envPath, 'utf8'); } catch { return; }
    const lineRe = new RegExp(`^${key}=.*$`, 'm');
    const next = lineRe.test(txt) ? txt.replace(lineRe, `${key}=${value}`) : `${txt.replace(/\n?$/, '\n')}${key}=${value}\n`;
    if (next !== txt) await fs.writeFile(envPath, next, 'utf8');
}

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

    // Keep the instance .env in lock-step with the portal DB for visual fields
    // that affect the frontend build. The container still needs a rebuild
    // (`akd-mi up <slug>` or a portal restart action) to actually re-bake the
    // NEXT_PUBLIC_INSTANCE_CATEGORY into the static bundle.
    if (typeof body.category === 'string' && body.category.trim()) {
        await setInstanceEnvVar(slug, 'INSTANCE_CATEGORY', body.category.trim()).catch(() => null);
    }
    if (typeof body.name === 'string' && body.name.trim()) {
        await setInstanceEnvVar(slug, 'INSTANCE_NAME', body.name.trim()).catch(() => null);
    }

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
