import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runAkdmi, SLUG_RE } from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

// GET /api/admin/instances/:slug/logs?service=api&tail=200
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });

    const url = new URL(req.url);
    const service = (url.searchParams.get('service') ?? '').trim();
    const tailRaw = url.searchParams.get('tail') ?? '200';
    const tail = Math.max(1, Math.min(2000, parseInt(tailRaw, 10) || 200));

    // Only allow safe service names — the CLI forwards these as-is to docker compose.
    if (service && !/^[a-z][a-z0-9-]{0,40}$/.test(service)) {
        return NextResponse.json({ error: 'invalid service' }, { status: 400 });
    }

    const args = ['logs', slug, '--no-follow', `--tail=${tail}`];
    if (service) args.push(service);

    const res = await runAkdmi(args, { timeoutMs: 60_000 });
    return NextResponse.json({ ok: res.ok, stdout: res.stdout, stderr: res.stderr, code: res.code });
}
