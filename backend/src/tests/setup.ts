/**
 * Test helper: builds a minimal Fastify app with just auth routes + mocked deps.
 */
import { vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';

// Mocked Prisma client
export const prismaMock = mockDeep<PrismaClient>();

// Set required env vars
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-chars';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters!!';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_PUBLIC_ENDPOINT = 'http://localhost:9000';
process.env.S3_REGION = 'us-east-1';
process.env.S3_BUCKET = 'test';
process.env.S3_ACCESS_KEY = 'minioadmin';
process.env.S3_SECRET_KEY = 'minioadmin';
process.env.RESEND_API_KEY = '';
process.env.EMAIL_FROM = 'test@test.com';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'password123';
process.env.ADMIN_NAME = 'Admin';
process.env.INSTANCE_SLUG = 'test';
process.env.INSTANCE_NAME = 'Test';
process.env.PUBLIC_WEB_URL = 'http://localhost:3000';

// Mock prisma and redis before auth routes are imported
vi.mock('../config/prisma.js', () => ({
    prisma: prismaMock,
    connectDb: vi.fn(),
    disconnectDb: vi.fn(),
}));

vi.mock('../config/redis.js', () => ({
    redis: { quit: vi.fn(), on: vi.fn() },
}));

vi.mock('../config/s3.js', () => ({
    ensureBucket: vi.fn(),
    s3: {},
}));

export function resetMocks() {
    mockReset(prismaMock);
}

export async function buildTestApp() {
    const app = Fastify({ logger: false });

    await app.register(cookie, { secret: process.env.SESSION_SECRET! });
    await app.register(jwt, {
        secret: process.env.JWT_SECRET!,
        sign: { expiresIn: process.env.JWT_ACCESS_TTL! },
    });

    const { authRoutes } = await import('../modules/auth/auth.routes.js');
    await app.register(authRoutes, { prefix: '/api/v1/auth' });

    await app.ready();
    return app;
}
