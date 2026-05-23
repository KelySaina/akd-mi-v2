import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('loadEnv', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('exits with error when required vars are missing', async () => {
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Clear all env vars for a clean test
        const originalEnv = process.env;
        process.env = {} as any;

        const { loadEnv } = await import('./env.js');
        loadEnv();

        expect(mockExit).toHaveBeenCalledWith(1);

        process.env = originalEnv;
        mockExit.mockRestore();
        mockError.mockRestore();
    });

    it('parses valid environment variables', async () => {
        const validEnv = {
            NODE_ENV: 'test',
            PORT: '4000',
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            REDIS_URL: 'redis://localhost:6379',
            JWT_SECRET: 'a'.repeat(32),
            JWT_REFRESH_SECRET: 'b'.repeat(32),
            JWT_ACCESS_TTL: '15m',
            JWT_REFRESH_TTL: '7d',
            SESSION_SECRET: 'c'.repeat(32),
            S3_ENDPOINT: 'http://localhost:9000',
            S3_PUBLIC_ENDPOINT: 'http://localhost:9000',
            S3_REGION: 'us-east-1',
            S3_BUCKET: 'test-bucket',
            S3_ACCESS_KEY: 'minioadmin',
            S3_SECRET_KEY: 'minioadmin',
            ADMIN_EMAIL: 'admin@test.com',
            ADMIN_PASSWORD: 'password123',
            ADMIN_NAME: 'Admin',
            INSTANCE_SLUG: 'test',
            INSTANCE_NAME: 'Test Instance',
            PUBLIC_WEB_URL: 'http://localhost:3000',
        };

        const originalEnv = process.env;
        process.env = { ...validEnv } as any;

        const { loadEnv } = await import('./env.js');
        const env = loadEnv();

        expect(env.NODE_ENV).toBe('test');
        expect(env.PORT).toBe(4000);
        expect(env.INSTANCE_SLUG).toBe('test');

        process.env = originalEnv;
    });
});
