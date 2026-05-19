import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@prisma/client';

export type AuthUser = {
    sub: string;
    role: Role;
    email: string;
};

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: AuthUser;
        user:    AuthUser;
    }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    try {
        const payload = await req.jwtVerify<AuthUser>();
        req.user = payload;
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

export function requireRole(...roles: Role[]) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
        if (!roles.includes(req.user.role)) {
            return reply.code(403).send({ error: 'Forbidden', requiredRoles: roles });
        }
    };
}
