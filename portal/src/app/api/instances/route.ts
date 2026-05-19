import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const RegisterBody = z.object({
    slug: z.string().min(3).max(32).regex(/^[a-z][a-z0-9-]+[a-z0-9]$/),
    name: z.string().min(1),
    category: z.string().default('SCHOOL'),
    description: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    logoUrl: z.string().url().optional(),
    publicUrl: z.string().url().optional(),
    apiUrl: z.string().url().optional(),
    isPublished: z.boolean().optional(),
});

// GET /api/instances?q=...&country=...
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? undefined;
    const country = searchParams.get('country') ?? undefined;
    const items = await prisma.instance.findMany({
        where: {
            isPublished: true,
            ...(country ? { country } : {}),
            ...(q ? { OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
            ] } : {}),
        },
        orderBy: { name: 'asc' },
        take: 100,
    });
    return NextResponse.json({ items });
}

// POST /api/instances — register a new instance (called by the orchestrator after `up`)
export async function POST(req: Request) {
    try {
        const body = RegisterBody.parse(await req.json());
        const inst = await prisma.instance.upsert({
            where: { slug: body.slug },
            update: { ...body, status: 'RUNNING', lastHealthAt: new Date() },
            create: { ...body, status: 'RUNNING', lastHealthAt: new Date() },
        });
        return NextResponse.json(inst, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'BadRequest' }, { status: 400 });
    }
}
