import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runAkdmi, SLUG_RE } from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    const res = await runAkdmi(['migrate', slug], { timeoutMs: 10 * 60 * 1000 });
    if (!res.ok) return NextResponse.json({ error: 'migrate failed', cli: res }, { status: 500 });
    return NextResponse.json({ ok: true, cli: res });
}
