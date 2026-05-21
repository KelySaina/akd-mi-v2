import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { SLUG_RE } from '@/lib/akdmi';
import { createJob, JobConflictError, type Job, type JobKind } from '@/lib/jobs';

type OpHandlerOpts = {
    kind: JobKind;
    /** Build the akd-mi argv (typically `[kind, slug]`). */
    args: (slug: string) => string[];
    /** Optional timeout override. Default 10 min, except 30 min for backup. */
    timeoutMs?: number;
    /** Update the DB row after the job succeeds. */
    onSuccess?: (slug: string, job: Job) => Promise<void>;
};

/** Wrap a single-step akd-mi command as an async job and return 202 + jobId. */
export function instanceOpHandler(opts: OpHandlerOpts) {
    return async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
        const guard = requireAdmin(req); if (guard) return guard;
        const { slug } = await ctx.params;
        if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
        try {
            const job = createJob({
                slug,
                kind: opts.kind,
                steps: [opts.args(slug)],
                timeoutMs: opts.timeoutMs,
                onSuccess: opts.onSuccess ? (j) => opts.onSuccess!(slug, j) : undefined,
            });
            return NextResponse.json({ jobId: job.id, kind: job.kind, status: job.status }, { status: 202 });
        } catch (e: any) {
            if (e instanceof JobConflictError) {
                return NextResponse.json({ error: e.message, jobId: e.existingJobId }, { status: 409 });
            }
            return NextResponse.json({ error: e?.message ?? 'failed to start job' }, { status: 500 });
        }
    };
}

export async function setInstanceStatus(slug: string, status: 'RUNNING' | 'STOPPED' | 'ARCHIVED' | 'ERROR') {
    await prisma.instance.update({
        where: { slug },
        data: {
            status,
            ...(status === 'RUNNING' ? { lastHealthAt: new Date() } : {}),
        },
    }).catch(() => null);
}
