import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@prisma/client';

export type AuthUser = {
    sub: string;
    role: Role;            // primary role (drives landing page)
    roles: Role[];         // effective set: primary ∪ extraRoles
    email: string;
};

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: AuthUser;
        user:    AuthUser;
    }
}

export function effectiveRoles(role: Role, extraRoles: Role[] | null | undefined): Role[] {
    const set = new Set<Role>([role, ...(extraRoles ?? [])]);
    return Array.from(set);
}

export function hasRole(user: AuthUser | undefined, ...roles: Role[]): boolean {
    if (!user) return false;
    const userRoles = user.roles?.length ? user.roles : [user.role];
    return roles.some((r) => userRoles.includes(r));
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    try {
        const payload = await req.jwtVerify<AuthUser>();
        // Backward-compat for old tokens without roles[]
        if (!payload.roles) payload.roles = [payload.role];
        req.user = payload;
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

export function requireRole(...roles: Role[]) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
        if (!hasRole(req.user, ...roles)) {
            return reply.code(403).send({ error: 'Forbidden', requiredRoles: roles });
        }
    };
}
