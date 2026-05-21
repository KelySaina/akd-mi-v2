import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

// GET /api/admin/jobs?slug=foo&active=1&limit=20
export async function GET(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const active = url.searchParams.get('active') === '1';
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 200);
    const items = listJobs({
        slug: slug ?? undefined,
        activeOnly: active,
        limit,
    });
    return NextResponse.json({ items });
}
