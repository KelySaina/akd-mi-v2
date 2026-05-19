import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export function handleError(reply: FastifyReply, err: unknown) {
    if (err instanceof ZodError) {
        return reply.code(400).send({ error: 'ValidationError', issues: err.flatten() });
    }
    const e = err as { code?: string; message?: string; meta?: unknown };
    // Prisma known errors
    if (e?.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'Unique constraint violated', meta: e.meta });
    }
    if (e?.code === 'P2025') {
        return reply.code(404).send({ error: 'NotFound' });
    }
    reply.log?.error(err);
    return reply.code(500).send({ error: 'InternalError', message: e?.message ?? 'unknown' });
}
