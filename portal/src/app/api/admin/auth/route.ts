import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const expected = process.env.PORTAL_ADMIN_TOKEN;
    if (!expected) return NextResponse.json({ error: 'PORTAL_ADMIN_TOKEN not configured' }, { status: 500 });

    let token = '';
    try { token = (await req.json())?.token ?? ''; } catch { /* form post fallback */ }
    if (!token) {
        try {
            const form = await req.formData();
            token = String(form.get('token') ?? '');
        } catch { /* ignore */ }
    }
    if (token !== expected) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, expected, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
}

export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
}
