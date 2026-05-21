import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { runAkdmi, SLUG_RE } from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

// POST /api/admin/instances/:slug/down
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const res = await runAkdmi(['down', slug], { timeoutMs: 5 * 60 * 1000 });
    if (!res.ok) return NextResponse.json({ error: 'down failed', cli: res }, { status: 500 });
    await prisma.instance.update({
        where: { slug },
        data: { status: 'STOPPED' },
    }).catch(() => null);
    return NextResponse.json({ ok: true, cli: res });
}
