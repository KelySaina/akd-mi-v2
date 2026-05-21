import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth';

// Server-side guard for /admin pages. /api/admin/* is guarded inside each route.
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (!pathname.startsWith('/admin')) return NextResponse.next();
    if (pathname === '/admin/login') return NextResponse.next();

    const expected = process.env.PORTAL_ADMIN_TOKEN;
    const presented = req.cookies.get(ADMIN_COOKIE)?.value ?? '';
    if (!expected || presented !== expected) {
        const url = req.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
