import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { ensureDefaultCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

const CodeRe = /^[A-Z][A-Z0-9_]{1,40}$/;

const CreateBody = z.object({
    code:        z.string().regex(CodeRe, 'code must be UPPER_SNAKE_CASE'),
    label:       z.string().min(1).max(80),
    description: z.string().max(500).optional(),
    sortOrder:   z.number().int().optional(),
    isActive:    z.boolean().optional(),
});

const PatchBody = z.object({
    label:       z.string().min(1).max(80).optional(),
    description: z.string().max(500).optional(),
    sortOrder:   z.number().int().optional(),
    isActive:    z.boolean().optional(),
});

// GET /api/admin/categories — list everything (active + inactive)
export async function GET(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    await ensureDefaultCategories();
    const items = await prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return NextResponse.json({ items });
}

// POST /api/admin/categories — create one
export async function POST(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    let body: z.infer<typeof CreateBody>;
    try { body = CreateBody.parse(await req.json()); }
    catch (e: any) { return NextResponse.json({ error: e?.message ?? 'BadRequest' }, { status: 400 }); }

    try {
        const cat = await prisma.category.create({ data: body });
        return NextResponse.json({ category: cat }, { status: 201 });
    } catch (e: any) {
        if (e?.code === 'P2002') return NextResponse.json({ error: 'code already exists' }, { status: 409 });
        return NextResponse.json({ error: e?.message ?? 'create failed' }, { status: 500 });
    }
}

// PATCH /api/admin/categories?code=XYZ — update label/sort/active
export async function PATCH(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    const code = new URL(req.url).searchParams.get('code');
    if (!code || !CodeRe.test(code)) return NextResponse.json({ error: 'invalid code' }, { status: 400 });
    let body: z.infer<typeof PatchBody>;
    try { body = PatchBody.parse(await req.json()); }
    catch (e: any) { return NextResponse.json({ error: e?.message ?? 'BadRequest' }, { status: 400 }); }
    const cat = await prisma.category.update({ where: { code }, data: body });
    return NextResponse.json({ category: cat });
}

// DELETE /api/admin/categories?code=XYZ — soft delete by setting isActive=false
// (we never hard-delete because Instance.category references the code as a free string).
export async function DELETE(req: Request) {
    const guard = requireAdmin(req); if (guard) return guard;
    const code = new URL(req.url).searchParams.get('code');
    if (!code || !CodeRe.test(code)) return NextResponse.json({ error: 'invalid code' }, { status: 400 });
    const cat = await prisma.category.update({ where: { code }, data: { isActive: false } });
    return NextResponse.json({ category: cat });
}
