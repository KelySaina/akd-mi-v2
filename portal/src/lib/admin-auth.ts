import { NextResponse } from 'next/server';

/**
 * Minimal bearer-token guard for the admin API. Set PORTAL_ADMIN_TOKEN in the env.
 * Returns null on success or a NextResponse(401/500) on failure.
 */
export function requireAdmin(req: Request): NextResponse | null {
    const expected = process.env.PORTAL_ADMIN_TOKEN;
    if (!expected) {
        return NextResponse.json({ error: 'PORTAL_ADMIN_TOKEN not configured' }, { status: 500 });
    }
    const header = req.headers.get('authorization') || '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (presented !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}
