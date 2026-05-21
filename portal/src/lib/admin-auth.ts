import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'akdmi_portal_admin';

/**
 * Bearer-token OR cookie guard for the admin API.
 * - Bearer: legacy/CLI usage (curl etc.)
 * - Cookie: set by /api/admin/auth/login after the user types the token in the UI.
 */
export function requireAdmin(req: Request): NextResponse | null {
    const expected = process.env.PORTAL_ADMIN_TOKEN;
    if (!expected) {
        return NextResponse.json({ error: 'PORTAL_ADMIN_TOKEN not configured' }, { status: 500 });
    }
    const header = req.headers.get('authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
    const cookieToken = readCookie(req, ADMIN_COOKIE);
    if (bearer === expected || cookieToken === expected) return null;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function readCookie(req: Request, name: string): string {
    const raw = req.headers.get('cookie') || '';
    for (const part of raw.split(';')) {
        const [k, ...rest] = part.trim().split('=');
        if (k === name) return decodeURIComponent(rest.join('='));
    }
    return '';
}

/** Server-component helper to check the cookie without a Request object. */
export async function isAdminFromCookies(): Promise<boolean> {
    const expected = process.env.PORTAL_ADMIN_TOKEN;
    if (!expected) return false;
    const jar = await cookies();
    return jar.get(ADMIN_COOKIE)?.value === expected;
}
