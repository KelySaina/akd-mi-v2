import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { runAkdmi, readInstanceEnv, instanceDirExists, SLUG_RE } from '@/lib/akdmi';

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

// POST /api/admin/instances — init + up, register in DB, return admin credentials once
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

    const initRes = await runAkdmi(['init', body.slug]);
    if (!initRes.ok) {
        return NextResponse.json({ error: 'init failed', cli: initRes }, { status: 500 });
    }

    const upRes = await runAkdmi(['up', body.slug], { timeoutMs: 10 * 60 * 1000 });
    if (!upRes.ok) {
        return NextResponse.json({ error: 'up failed', cli: upRes }, { status: 500 });
    }

    // Seed the initial admin user inside the new instance.
    const seedRes = await runAkdmi(['seed', body.slug], { timeoutMs: 5 * 60 * 1000 });

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

    return NextResponse.json({
        instance: inst,
        admin: {
            email: env.ADMIN_EMAIL ?? null,
            // Returned once. The plaintext password also lives in instances/<slug>/.env on disk.
            password: env.ADMIN_PASSWORD ?? null,
        },
        seedOk: seedRes.ok,
    }, { status: 201 });
}
