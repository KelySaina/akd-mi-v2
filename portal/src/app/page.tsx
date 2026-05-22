import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { listActiveCategories } from '@/lib/categories';
import { DirectoryClient, type PublicInstance, type CategoryItem } from '@/components/DirectoryClient';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicDirectory() {
    const [instances, categories] = await Promise.all([
        prisma.instance.findMany({
            where: { isPublished: true, status: { in: ['RUNNING'] } },
            orderBy: { name: 'asc' },
            take: 200,
            select: {
                id: true, slug: true, name: true, category: true,
                description: true, city: true, country: true,
                logoUrl: true, publicUrl: true,
            },
        }).catch(() => [] as PublicInstance[]),
        listActiveCategories().catch(() => [] as CategoryItem[]),
    ]);

    return (
        <div className="min-h-screen">
            {/* ── Public top bar ───────────────────────────────────────── */}
            <header className="border-b border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 font-semibold">
                        <span className="size-7 rounded-lg gradient-brand grid place-items-center text-white text-xs font-bold">AK</span>
                        AKD-MI
                    </Link>
                    <nav className="flex items-center gap-1 text-sm">
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] muted hover:text-[var(--ink)]"
                        >
                            Platform admin <ArrowRight className="size-3.5" />
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                <DirectoryClient instances={instances as PublicInstance[]} categories={categories} />
            </main>

            <footer className="border-t border-[var(--border)] mt-10">
                <div className="max-w-6xl mx-auto px-6 py-8 text-sm muted flex flex-wrap items-center justify-between gap-3">
                    <p>© {new Date().getFullYear()} AKD-MI Platform</p>
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="hover:text-[var(--ink)]">Admin</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
