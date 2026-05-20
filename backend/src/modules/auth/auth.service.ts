import argon2 from 'argon2';
import { prisma } from '../../config/prisma.js';
import { loadEnv } from '../../config/env.js';
import type { Role } from '@prisma/client';

const env = loadEnv();

export async function hashPassword(plain: string) {
    return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string) {
    try {
        return await argon2.verify(hash, plain);
    } catch {
        return false;
    }
}

export async function createRefreshSession(
    userId: string,
    refreshToken: string,
    ip?: string,
    userAgent?: string,
) {
    // Convert TTL like "7d" → ms. Quick parser:
    const ttlMs = parseDurationToMs(env.JWT_REFRESH_TTL);
    return prisma.session.create({
        data: {
            userId,
            refreshToken,
            ip,
            userAgent,
            expiresAt: new Date(Date.now() + ttlMs),
        },
    });
}

export async function revokeSession(refreshToken: string) {
    await prisma.session.updateMany({
        where: { refreshToken, revokedAt: null },
        data:  { revokedAt: new Date() },
    });
}

export async function findValidSession(refreshToken: string) {
    return prisma.session.findFirst({
        where: {
            refreshToken,
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
    });
}

function parseDurationToMs(s: string): number {
    const m = /^(\d+)(ms|s|m|h|d)$/.exec(s.trim());
    if (!m) return 7 * 24 * 60 * 60 * 1000;
    const n = Number(m[1]);
    switch (m[2]) {
        case 'ms': return n;
        case 's':  return n * 1000;
        case 'm':  return n * 60_000;
        case 'h':  return n * 3_600_000;
        case 'd':  return n * 86_400_000;
        default:   return 0;
    }
}

export type JwtPayload = { sub: string; role: Role; roles?: Role[]; email: string };
