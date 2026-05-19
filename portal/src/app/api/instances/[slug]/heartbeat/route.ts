import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/instances/<slug>/heartbeat — orchestrator pings this periodically
export async function POST(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    try {
        const inst = await prisma.instance.update({
            where: { slug },
            data: { status: 'RUNNING', lastHealthAt: new Date() },
        });
        return NextResponse.json(inst);
    } catch {
        return NextResponse.json({ error: 'NotFound' }, { status: 404 });
    }
}
