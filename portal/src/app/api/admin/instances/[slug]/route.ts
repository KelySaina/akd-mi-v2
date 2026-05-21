import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { runAkdmi, SLUG_RE } from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

// GET /api/admin/instances/:slug — read row
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const inst = await prisma.instance.findUnique({ where: { slug } });
    if (!inst) return NextResponse.json({ error: 'NotFound' }, { status: 404 });
    return NextResponse.json(inst);
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

// DELETE /api/admin/instances/:slug — destroy stack + on-disk dir, then drop row
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const res = await runAkdmi(['destroy', slug], { timeoutMs: 10 * 60 * 1000 });
    if (!res.ok) return NextResponse.json({ error: 'destroy failed', cli: res }, { status: 500 });
    await prisma.instance.delete({ where: { slug } }).catch(() => null);
    return NextResponse.json({ ok: true, cli: res });
}
