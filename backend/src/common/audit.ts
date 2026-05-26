// Fire-and-forget audit logger. Writes a row to the `AuditLog` table.
// Failures are logged but never propagated — auditing must not break HTTP
// responses to clients.

import type { FastifyRequest } from 'fastify';
import { prisma } from '../config/prisma.js';

export type AuditPayload = Record<string, unknown> | null | undefined;

export async function writeAudit(
    req: FastifyRequest | null,
    action: string,
    entity: string,
    entityId?: string | null,
    payload?: AuditPayload,
): Promise<void> {
    try {
        const actorId = req?.user?.sub ?? null;
        const ip = (req?.ip || (req?.headers?.['x-forwarded-for'] as string | undefined) || null) as string | null;
        await prisma.auditLog.create({
            data: {
                actorId,
                action,
                entity,
                entityId: entityId ?? null,
                payload: payload ? (payload as any) : undefined,
                ip,
            },
        });
    } catch (err) {
        // Log but do not throw — auditing is best-effort.
        try { req?.log?.warn?.({ err, action, entity }, 'audit log write failed'); } catch { /* ignore */ }
    }
}

/** Same as writeAudit but doesn't await — useful when caller must not pay the DB latency. */
export function logAudit(
    req: FastifyRequest | null,
    action: string,
    entity: string,
    entityId?: string | null,
    payload?: AuditPayload,
): void {
    void writeAudit(req, action, entity, entityId, payload);
}
