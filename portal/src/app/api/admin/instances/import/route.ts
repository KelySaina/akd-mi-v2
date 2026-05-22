import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import {
    listInstanceDirs,
    readInstanceEnv,
    isInstanceRunning,
    instanceDirExists,
    SLUG_RE,
} from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

const Body = z.object({
    /** If provided, import only this slug; otherwise scan every instance dir. */
    slug: z.string().regex(SLUG_RE).optional(),
    /** If true, overwrite name/category/URLs from the .env on existing rows. Default true. */
    overwrite: z.boolean().optional().default(true),
});

type ImportResult = {
    slug: string;
    action: 'created' | 'updated' | 'skipped';
    status: 'RUNNING' | 'STOPPED';
    name: string;
};
type ImportError = { slug: string; error: string };

// GET /api/admin/instances/import — preview: list on-disk instances and whether they exist in DB.
export async function GET(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    const slugs = await listInstanceDirs();
    const rows = await prisma.instance.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
    });
    const known = new Set(rows.map((r) => r.slug));
    return NextResponse.json({
        items: slugs.map((slug) => ({ slug, inDb: known.has(slug) })),
    });
}

// POST /api/admin/instances/import — upsert DB rows for every (or one) on-disk instance.
export async function POST(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;

    let body: z.infer<typeof Body>;
    try {
        body = Body.parse(await req.json().catch(() => ({})));
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'BadRequest' }, { status: 400 });
    }

    let slugs: string[];
    if (body.slug) {
        if (!(await instanceDirExists(body.slug))) {
            return NextResponse.json({ error: `instance '${body.slug}' not found on disk` }, { status: 404 });
        }
        slugs = [body.slug];
    } else {
        slugs = await listInstanceDirs();
    }

    const imported: ImportResult[] = [];
    const errors: ImportError[] = [];

    for (const slug of slugs) {
        try {
            const env = await readInstanceEnv(slug);
            const name      = env.INSTANCE_NAME || slug;
            const category  = env.INSTANCE_CATEGORY || 'SCHOOL';
            const publicUrl = env.PUBLIC_WEB_URL || null;
            const apiUrl    = env.PUBLIC_API_URL || null;
            const running   = await isInstanceRunning(slug);
            const status: 'RUNNING' | 'STOPPED' = running ? 'RUNNING' : 'STOPPED';

            const existing = await prisma.instance.findUnique({ where: { slug }, select: { id: true } });

            if (existing && !body.overwrite) {
                imported.push({ slug, action: 'skipped', status, name });
                continue;
            }

            await prisma.instance.upsert({
                where: { slug },
                update: {
                    // Only refresh fields we can confidently derive from the .env / docker state.
                    publicUrl: publicUrl ?? undefined,
                    apiUrl: apiUrl ?? undefined,
                    status,
                    ...(running ? { lastHealthAt: new Date() } : {}),
                },
                create: {
                    slug,
                    name,
                    category,
                    publicUrl: publicUrl ?? undefined,
                    apiUrl: apiUrl ?? undefined,
                    status,
                    isPublished: false,
                    ...(running ? { lastHealthAt: new Date() } : {}),
                },
            });

            imported.push({ slug, action: existing ? 'updated' : 'created', status, name });
        } catch (e: any) {
            errors.push({ slug, error: e?.message ?? String(e) });
        }
    }

    return NextResponse.json({ imported, errors });
}
