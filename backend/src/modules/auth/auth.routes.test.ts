import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { buildTestApp, prismaMock, resetMocks } from '../../tests/setup.js';
import { hashPassword } from './auth.service.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildTestApp();
});

beforeEach(() => {
    resetMocks();
});

describe('POST /api/v1/auth/login', () => {
    const loginUrl = '/api/v1/auth/login';

    it('returns 400 for invalid body (missing fields)', async () => {
        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: {},
        });
        expect(res.statusCode).toBe(400);
        expect(res.json().error).toBe('ValidationError');
    });

    it('returns 400 for invalid email format', async () => {
        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: { email: 'not-an-email', password: 'test' },
        });
        expect(res.statusCode).toBe(400);
    });

    it('returns 401 when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: { email: 'nobody@test.com', password: 'password123' },
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('InvalidCredentials');
    });

    it('returns 401 when user is inactive', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: '1',
            email: 'inactive@test.com',
            name: 'Inactive',
            passwordHash: await hashPassword('password123'),
            role: 'STUDENT',
            extraRoles: [],
            isActive: false,
            emailVerified: false,
            avatarUrl: null,
            phone: null,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: { email: 'inactive@test.com', password: 'password123' },
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('InvalidCredentials');
    });

    it('returns 401 for wrong password', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: '1',
            email: 'user@test.com',
            name: 'User',
            passwordHash: await hashPassword('correctPassword'),
            role: 'STUDENT',
            extraRoles: [],
            isActive: true,
            emailVerified: true,
            avatarUrl: null,
            phone: null,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: { email: 'user@test.com', password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('InvalidCredentials');
    });

    it('returns 200 with accessToken on valid login', async () => {
        const hash = await hashPassword('password123');
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'student@test.com',
            name: 'Student',
            passwordHash: hash,
            role: 'STUDENT',
            extraRoles: [],
            isActive: true,
            emailVerified: true,
            avatarUrl: null,
            phone: null,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);
        prismaMock.session.create.mockResolvedValue({} as any);
        prismaMock.user.update.mockResolvedValue({} as any);

        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: { email: 'student@test.com', password: 'password123' },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.accessToken).toBeDefined();
        expect(body.user.id).toBe('user-1');
        expect(body.user.email).toBe('student@test.com');
        expect(body.user.roles).toContain('STUDENT');
    });

    it('sets refresh_token cookie on successful login', async () => {
        const hash = await hashPassword('password123');
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'student@test.com',
            name: 'Student',
            passwordHash: hash,
            role: 'STUDENT',
            extraRoles: [],
            isActive: true,
            emailVerified: true,
            avatarUrl: null,
            phone: null,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);
        prismaMock.session.create.mockResolvedValue({} as any);
        prismaMock.user.update.mockResolvedValue({} as any);

        const res = await app.inject({
            method: 'POST',
            url: loginUrl,
            payload: { email: 'student@test.com', password: 'password123' },
        });

        const cookies = res.cookies;
        const refreshCookie = cookies.find((c: any) => c.name === 'refresh_token');
        expect(refreshCookie).toBeDefined();
        expect(refreshCookie!.httpOnly).toBe(true);
    });
});

describe('POST /api/v1/auth/register', () => {
    const registerUrl = '/api/v1/auth/register';

    it('returns 400 for invalid body', async () => {
        const res = await app.inject({
            method: 'POST',
            url: registerUrl,
            payload: {},
        });
        expect(res.statusCode).toBe(400);
    });

    it('returns 409 when email already exists', async () => {
        prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

        const res = await app.inject({
            method: 'POST',
            url: registerUrl,
            payload: { name: 'Test', email: 'existing@test.com', password: 'password123' },
        });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('EmailAlreadyRegistered');
    });

    it('returns 201 for valid registration', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn: any) => {
            return fn({
                user: { create: vi.fn().mockResolvedValue({ id: 'new-user' }) },
                student: { create: vi.fn().mockResolvedValue({}) },
            });
        });

        const res = await app.inject({
            method: 'POST',
            url: registerUrl,
            payload: { name: 'New Student', email: 'new@test.com', password: 'password123' },
        });
        expect(res.statusCode).toBe(201);
        expect(res.json().ok).toBe(true);
        expect(res.json().status).toBe('pending');
    });
});

describe('POST /api/v1/auth/refresh', () => {
    it('returns 401 when no refresh cookie', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('NoRefreshToken');
    });

    it('returns 401 when session is invalid/expired', async () => {
        prismaMock.session.findFirst.mockResolvedValue(null);

        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            cookies: { refresh_token: 'invalid-token' },
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('InvalidSession');
    });

    it('returns new accessToken for valid session', async () => {
        prismaMock.session.findFirst.mockResolvedValue({
            id: 'session-1',
            userId: 'user-1',
            refreshToken: 'valid-token',
            user: {
                id: 'user-1',
                email: 'user@test.com',
                role: 'STUDENT',
                extraRoles: [],
            },
        } as any);

        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            cookies: { refresh_token: 'valid-token' },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().accessToken).toBeDefined();
    });
});

describe('POST /api/v1/auth/logout', () => {
    it('returns ok and clears cookie', async () => {
        prismaMock.session.updateMany.mockResolvedValue({ count: 1 } as any);

        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/logout',
            cookies: { refresh_token: 'some-token' },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().ok).toBe(true);
    });
});

describe('GET /api/v1/auth/me', () => {
    it('returns 401 without auth token', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
        });
        expect(res.statusCode).toBe(401);
    });

    it('returns user profile with valid token', async () => {
        // First login to get a token
        const hash = await hashPassword('password123');
        prismaMock.user.findUnique.mockResolvedValueOnce({
            id: 'user-1',
            email: 'me@test.com',
            name: 'Me',
            passwordHash: hash,
            role: 'STUDENT',
            extraRoles: [],
            isActive: true,
            emailVerified: true,
            avatarUrl: null,
            phone: null,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);
        prismaMock.session.create.mockResolvedValue({} as any);
        prismaMock.user.update.mockResolvedValue({} as any);

        const loginRes = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: 'me@test.com', password: 'password123' },
        });
        const { accessToken } = loginRes.json();

        // Now call /me
        prismaMock.user.findUnique.mockResolvedValueOnce({
            id: 'user-1',
            email: 'me@test.com',
            name: 'Me',
            role: 'STUDENT',
            extraRoles: [],
            avatarUrl: null,
            phone: null,
            lastLoginAt: new Date(),
        } as any);

        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
            headers: { authorization: `Bearer ${accessToken}` },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().email).toBe('me@test.com');
        expect(res.json().roles).toContain('STUDENT');
    });
});

// Need vi in scope for mocks in $transaction
import { vi } from 'vitest';
