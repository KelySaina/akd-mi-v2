import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

const AVAILABLE = [
    'courses', 'students', 'teachers', 'grades',
    'schedule', 'library', 'messaging', 'reports',
] as const;

const ToggleBody = z.object({
    moduleKey: z.enum(AVAILABLE),
    enabled: z.boolean(),
    config: z.record(z.any()).optional(),
});

export async function moduleRoutes(app: FastifyInstance) {
    app.get('/available', async () => ({ modules: AVAILABLE }));

    app.addHook('preHandler', authenticate);

    app.get('/', async () => {
        const inst = await prisma.institution.findFirst();
        if (!inst) return { items: [] };
        const items = await prisma.institutionModule.findMany({ where: { institutionId: inst.id } });
        return { items };
    });

    app.post('/', { preHandler: requireRole('INSTANCE_ADMIN') }, async (req, reply) => {
        try {
            const body = ToggleBody.parse(req.body);
            const inst = await prisma.institution.findFirst();
            if (!inst) return reply.code(400).send({ error: 'NoInstitution' });
            const m = await prisma.institutionModule.upsert({
                where: { institutionId_moduleKey: { institutionId: inst.id, moduleKey: body.moduleKey } },
                update: { enabled: body.enabled, config: body.config ?? {} },
                create: { institutionId: inst.id, moduleKey: body.moduleKey, enabled: body.enabled, config: body.config ?? {} },
            });
            return m;
        } catch (err) { return handleError(reply, err); }
    });
}
