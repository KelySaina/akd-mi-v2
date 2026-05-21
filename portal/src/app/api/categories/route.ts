import { NextResponse } from 'next/server';
import { listActiveCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

// Public read: used by the new-instance form and (optionally) the public directory.
export async function GET() {
    const items = await listActiveCategories();
    return NextResponse.json({ items });
}
