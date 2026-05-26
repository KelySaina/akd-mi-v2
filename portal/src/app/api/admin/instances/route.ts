import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { readInstanceEnv, instanceDirExists, SLUG_RE } from '@/lib/akdmi';
import { createJob, JobConflictError } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

const CreateBody = z.object({
    slug: z.string().min(3).max(32).regex(SLUG_RE),
    name: z.string().min(1),
    category: z.string().default('SCHOOL'),
    description: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    logoUrl: z.string().url().optional(),
    isPublished: z.boolean().optional(),
});

// GET /api/admin/instances — list every instance (not only published)
export async function GET(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    const items = await prisma.instance.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items });
}

// POST /api/admin/instances — provision a brand new instance.
// Runs init → up → seed as a single background job. The DB row is created /
// upserted in the job's onSuccess hook and the admin credentials are attached
// to job.result. The client polls /api/admin/jobs/:id and reads `result` once
// status is `succeeded`.
export async function POST(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    let body: z.infer<typeof CreateBody>;
    try {
        body = CreateBody.parse(await req.json());
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'BadRequest' }, { status: 400 });
    }

    if (await instanceDirExists(body.slug)) {
        return NextResponse.json({ error: `Instance '${body.slug}' already exists on disk` }, { status: 409 });
    }

    try {
        const job = createJob({
            slug: body.slug,
            kind: 'create',
            title: `provision ${body.slug} (init → up → seed)`,
            steps: [
                ['init', body.slug],
                ['up', body.slug],
                ['seed', body.slug],
            ],
            // Forward category so init.sh bakes it into the instance's .env and the
            // frontend container is built with the right NEXT_PUBLIC_INSTANCE_CATEGORY.
            env: { INSTANCE_CATEGORY: body.category },
            // 30 min cap for the whole pipeline (image pulls + db boot + seed).
            timeoutMs: 30 * 60 * 1000,
            onSuccess: async (j) => {
                const env = await readInstanceEnv(body.slug);
                const publicUrl = env.PUBLIC_WEB_URL || undefined;
                const apiUrl    = env.PUBLIC_API_URL || undefined;
                const inst = await prisma.instance.upsert({
                    where: { slug: body.slug },
                    update: {
                        name: body.name,
                        category: body.category,
                        description: body.description,
                        city: body.city,
                        country: body.country,
                        logoUrl: body.logoUrl,
                        publicUrl,
                        apiUrl,
                        isPublished: body.isPublished ?? false,
                        status: 'RUNNING',
                        lastHealthAt: new Date(),
                    },
                    create: {
                        slug: body.slug,
                        name: body.name,
                        category: body.category,
                        description: body.description,
                        city: body.city,
                        country: body.country,
                        logoUrl: body.logoUrl,
                        publicUrl,
                        apiUrl,
                        isPublished: body.isPublished ?? false,
                        status: 'RUNNING',
                        lastHealthAt: new Date(),
                    },
                });
                j.result = {
                    instance: inst,
                    admin: {
                        email: env.ADMIN_EMAIL ?? null,
                        password: env.ADMIN_PASSWORD ?? null,
                    },
                };
            },
        });
        return NextResponse.json({ jobId: job.id, slug: body.slug, status: job.status }, { status: 202 });
    } catch (e: any) {
        if (e instanceof JobConflictError) {
            return NextResponse.json({ error: e.message, jobId: e.existingJobId }, { status: 409 });
        }
        return NextResponse.json({ error: e?.message ?? 'failed to start job' }, { status: 500 });
    }
}
