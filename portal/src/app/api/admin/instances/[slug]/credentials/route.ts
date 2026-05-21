import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { readInstanceEnv, SLUG_RE, instanceDirExists } from '@/lib/akdmi';

export const dynamic = 'force-dynamic';

// GET /api/admin/instances/:slug/credentials
// Returns the secrets stored in the instance's generated .env (admin login,
// DB password, MinIO root, JWT secrets, etc.). Admin-only.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const guard = requireAdmin(req); if (guard) return guard;
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    if (!(await instanceDirExists(slug))) {
        return NextResponse.json({ error: 'instance directory not found' }, { status: 404 });
    }
    try {
        const env = await readInstanceEnv(slug);
        return NextResponse.json({
            admin: {
                email: env.ADMIN_EMAIL ?? null,
                password: env.ADMIN_PASSWORD ?? null,
                name: env.ADMIN_NAME ?? null,
            },
            urls: {
                publicWeb: env.PUBLIC_WEB_URL ?? null,
                publicApi: env.PUBLIC_API_URL ?? null,
                s3Public: env.S3_PUBLIC_ENDPOINT ?? null,
            },
            ports: {
                web: env.WEB_PORT ?? null,
                api: env.API_PORT ?? null,
                db: env.DB_PORT ?? null,
                redis: env.REDIS_PORT ?? null,
                minio: env.MINIO_PORT ?? null,
                minioUi: env.MINIO_UI_PORT ?? null,
            },
            database: {
                name: env.DB_NAME ?? null,
                user: env.DB_USER ?? null,
                password: env.DB_PASSWORD ?? null,
                url: env.DATABASE_URL ?? null,
            },
            redis: {
                password: env.REDIS_PASSWORD ?? null,
                url: env.REDIS_URL ?? null,
            },
            minio: {
                rootUser: env.MINIO_ROOT_USER ?? null,
                rootPassword: env.MINIO_ROOT_PASSWORD ?? null,
                bucket: env.S3_BUCKET ?? null,
            },
            secrets: {
                jwt: env.JWT_SECRET ?? null,
                jwtRefresh: env.JWT_REFRESH_SECRET ?? null,
                session: env.SESSION_SECRET ?? null,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'failed to read .env' }, { status: 500 });
    }
}
