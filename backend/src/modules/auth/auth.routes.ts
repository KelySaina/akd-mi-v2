import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { loadEnv } from '../../config/env.js';
import { authenticate, effectiveRoles } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';
import {
    createRefreshSession,
    findValidSession,
    hashPassword,
    revokeSession,
    verifyPassword,
} from './auth.service.js';
import crypto from 'node:crypto';

const env = loadEnv();

const LoginBody = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const UpdateMeBody = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
});

const ChangePasswordBody = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
});

const RegisterBody = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(200),
    phone: z.string().trim().max(40).optional(),
    studentNumber: z.string().trim().min(1).max(40).optional(),
});

function newRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

export async function authRoutes(app: FastifyInstance) {
    app.post('/login', async (req, reply) => {
        try {
            const body = LoginBody.parse(req.body);
            const user = await prisma.user.findUnique({ where: { email: body.email } });
            if (!user || !user.isActive) return reply.code(401).send({ error: 'InvalidCredentials' });
            const ok = await verifyPassword(user.passwordHash, body.password);
            if (!ok) return reply.code(401).send({ error: 'InvalidCredentials' });

            const roles = effectiveRoles(user.role, user.extraRoles);
            const accessToken = await reply.jwtSign(
                { sub: user.id, role: user.role, roles, email: user.email },
            );
            const refreshToken = newRefreshToken();
            await createRefreshSession(user.id, refreshToken, req.ip, req.headers['user-agent']);

            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });

            reply.setCookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/v1/auth',
                maxAge: 7 * 24 * 60 * 60,
            });

            return {
                accessToken,
                user: { id: user.id, email: user.email, name: user.name, role: user.role, roles, avatarUrl: user.avatarUrl },
            };
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // Public self-registration for prospective students. Creates an inactive
    // STUDENT account that must be approved by an INSTANCE_ADMIN/MANAGER before
    // it can sign in. Returns a generic 201 even if the email is taken to avoid
    // user enumeration is intentionally NOT done here — we return 409 so the
    // UI can show a helpful "already used" message; flip if you need stricter.
    app.post('/register', async (req, reply) => {
        try {
            const body = RegisterBody.parse(req.body);
            const existing = await prisma.user.findUnique({ where: { email: body.email } });
            if (existing) {
                return reply.code(409).send({ error: 'EmailAlreadyRegistered' });
            }
            const passwordHash = await hashPassword(body.password);
            const studentNumber = body.studentNumber
                ?? `PEND-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

            await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: body.email,
                        name: body.name,
                        phone: body.phone ?? null,
                        passwordHash,
                        role: 'STUDENT',
                        isActive: false,        // pending admin approval
                        emailVerified: false,
                    },
                });
                await tx.student.create({
                    data: {
                        userId: user.id,
                        studentNumber,
                        status: 'pending',
                    },
                });
            });

            return reply.code(201).send({
                ok: true,
                status: 'pending',
                message: 'Account created. An administrator will review your request.',
            });
        } catch (err) {
            return handleError(reply, err);
        }
    });

    app.post('/refresh', async (req, reply) => {
        try {
            const token = req.cookies['refresh_token'];
            if (!token) return reply.code(401).send({ error: 'NoRefreshToken' });
            const session = await findValidSession(token);
            if (!session) return reply.code(401).send({ error: 'InvalidSession' });

            const accessToken = await reply.jwtSign({
                sub: session.user.id,
                role: session.user.role,
                roles: effectiveRoles(session.user.role, session.user.extraRoles),
                email: session.user.email,
            });
            return { accessToken };
        } catch (err) {
            return handleError(reply, err);
        }
    });

    app.post('/logout', async (req, reply) => {
        const token = req.cookies['refresh_token'];
        if (token) await revokeSession(token);
        reply.clearCookie('refresh_token', { path: '/api/v1/auth' });
        return { ok: true };
    });

    app.get('/me', { preHandler: authenticate }, async (req, reply) => {
        const u = await prisma.user.findUnique({
            where: { id: req.user!.sub },
            select: { id: true, email: true, name: true, role: true, extraRoles: true, avatarUrl: true, phone: true, lastLoginAt: true },
        });
        if (!u) return reply.code(404).send({ error: 'NotFound' });
        return { ...u, roles: effectiveRoles(u.role, u.extraRoles) };
    });

    app.patch('/me', { preHandler: authenticate }, async (req, reply) => {
        try {
            const body = UpdateMeBody.parse(req.body);
            const data: Record<string, unknown> = {};
            if (body.name !== undefined)      data.name = body.name;
            if (body.phone !== undefined)     data.phone = body.phone;
            if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
            const u = await prisma.user.update({
                where: { id: req.user!.sub },
                data,
                select: { id: true, email: true, name: true, role: true, avatarUrl: true, phone: true },
            });
            return u;
        } catch (err) { return handleError(reply, err); }
    });

    app.post('/change-password', { preHandler: authenticate }, async (req, reply) => {
        try {
            const body = ChangePasswordBody.parse(req.body);
            const u = await prisma.user.findUnique({ where: { id: req.user!.sub } });
            if (!u) return reply.code(404).send({ error: 'NotFound' });
            const ok = await verifyPassword(u.passwordHash, body.currentPassword);
            if (!ok) return reply.code(400).send({ error: 'InvalidCurrentPassword' });
            const passwordHash = await hashPassword(body.newPassword);
            await prisma.user.update({ where: { id: u.id }, data: { passwordHash } });
            return { ok: true };
        } catch (err) { return handleError(reply, err); }
    });
}
