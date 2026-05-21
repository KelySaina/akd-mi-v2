import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getJob, cancelJob } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

// GET /api/admin/jobs/:id?since=N — return job snapshot. `since` is the index
// returned as `nextCursor` from the previous poll; only lines after that index
// are returned, so the UI can stream incrementally.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { id } = await params;
    const url = new URL(req.url);
    const since = parseInt(url.searchParams.get('since') ?? '0', 10) || 0;
    const snap = getJob(id, since);
    if (!snap) return NextResponse.json({ error: 'NotFound' }, { status: 404 });
    return NextResponse.json(snap);
}

// DELETE /api/admin/jobs/:id — best-effort cancel.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { id } = await params;
    const ok = cancelJob(id);
    if (!ok) return NextResponse.json({ error: 'NotCancellable' }, { status: 409 });
    return NextResponse.json({ ok: true });
}
