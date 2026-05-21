import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { runAkdmi, SLUG_RE } from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const res = await runAkdmi(['restart', slug], { timeoutMs: 10 * 60 * 1000 });
    if (!res.ok) return NextResponse.json({ error: 'restart failed', cli: res }, { status: 500 });
    await prisma.instance.update({ where: { slug }, data: { status: 'RUNNING', lastHealthAt: new Date() } }).catch(() => null);
    return NextResponse.json({ ok: true, cli: res });
}
