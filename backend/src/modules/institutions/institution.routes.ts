import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticate, requireRole } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

const InstitutionUpdate = z.object({
    name: z.string().min(1).optional(),
    legalName: z.string().optional().nullable(),
    category: z.enum(['UNIVERSITY','SCHOOL','TRAINING_CENTER','COLLEGE','HIGH_SCHOOL','OTHER']).optional(),
    description: z.string().optional().nullable(),
    foundedYear: z.number().int().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    websiteUrl: z.string().url().optional().nullable(),
    isPublished: z.boolean().optional(),
    settings: z.record(z.any()).optional(),
});

const AddressBody = z.object({
    label: z.string().optional().nullable(),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    region: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().min(1),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    isPrimary: z.boolean().optional(),
});

const ContactBody = z.object({
    type: z.string().min(1),
    value: z.string().min(1),
    label: z.string().optional().nullable(),
    isPrimary: z.boolean().optional(),
});

const MediaBody = z.object({
    kind: z.string().min(1),
    url: z.string().url(),
    title: z.string().optional().nullable(),
    caption: z.string().optional().nullable(),
    filename: z.string().optional().nullable(),
    mimeType: z.string().optional().nullable(),
    size: z.number().int().nonnegative().optional().nullable(),
    sortOrder: z.number().int().optional(),
});

async function getOrCreateInstitution() {
    let inst = await prisma.institution.findFirst();
    if (!inst) {
        inst = await prisma.institution.create({
            data: {
                name: process.env.INSTANCE_NAME ?? 'New Institution',
                slug: process.env.INSTANCE_SLUG ?? 'default',
            },
        });
    }
    return inst;
}

export async function institutionRoutes(app: FastifyInstance) {
    // Public read
    app.get('/', async () => {
        const inst = await prisma.institution.findFirst({
            include: { addresses: true, contacts: true, media: true, documents: true },
        });
        return inst;
    });

    // Authenticated routes in an isolated child scope so the hook above
    // does NOT apply to the public GET / route declared in the parent scope.
    await app.register(async (priv) => {
        priv.addHook('preHandler', authenticate);

        priv.patch('/', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = InstitutionUpdate.parse(req.body);
            const inst = await getOrCreateInstitution();
            const updated = await prisma.institution.update({ where: { id: inst.id }, data: body });
            return updated;
        } catch (err) { return handleError(reply, err); }
    });

    // Addresses
    priv.post('/addresses', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = AddressBody.parse(req.body);
            const inst = await getOrCreateInstitution();
            const a = await prisma.institutionAddress.create({ data: { ...body, institutionId: inst.id } });
            return reply.code(201).send(a);
        } catch (err) { return handleError(reply, err); }
    });

    priv.patch('/addresses/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = AddressBody.partial().parse(req.body);
            return await prisma.institutionAddress.update({ where: { id }, data: body });
        } catch (err) { return handleError(reply, err); }
    });

    priv.delete('/addresses/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.institutionAddress.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });

    // Contacts
    priv.post('/contacts', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const body = ContactBody.parse(req.body);
            const inst = await getOrCreateInstitution();
            const c = await prisma.institutionContact.create({ data: { ...body, institutionId: inst.id } });
            return reply.code(201).send(c);
        } catch (err) { return handleError(reply, err); }
    });

    priv.delete('/contacts/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.institutionContact.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });

    // Media library
    priv.get('/media', async () => {
        const inst = await getOrCreateInstitution();
        return await prisma.institutionMedia.findMany({
            where: { institutionId: inst.id },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
    });

    // Media library: teachers can contribute uploads (used by CourseMediaManager
    // when attaching syllabus/material to their own courses). Curation (patch/delete)
    // stays restricted to admin/manager.
    priv.post('/media', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER', 'TEACHER') }, async (req, reply) => {
        try {
            const body = MediaBody.parse(req.body);
            const inst = await getOrCreateInstitution();
            const m = await prisma.institutionMedia.create({ data: { ...body, institutionId: inst.id } });
            return reply.code(201).send(m);
        } catch (err) { return handleError(reply, err); }
    });

    priv.patch('/media/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            const body = MediaBody.partial().parse(req.body);
            return await prisma.institutionMedia.update({ where: { id }, data: body });
        } catch (err) { return handleError(reply, err); }
    });

    priv.delete('/media/:id', { preHandler: requireRole('INSTANCE_ADMIN', 'MANAGER') }, async (req, reply) => {
        try {
            const { id } = req.params as { id: string };
            await prisma.institutionMedia.delete({ where: { id } });
            return reply.code(204).send();
        } catch (err) { return handleError(reply, err); }
    });
    });
}
