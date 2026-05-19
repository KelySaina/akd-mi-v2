import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PublicDirectory() {
    const instances = await prisma.instance.findMany({
        where: { isPublished: true, status: { in: ['RUNNING'] } },
        orderBy: { name: 'asc' },
        take: 100,
    }).catch(() => [] as Awaited<ReturnType<typeof prisma.instance.findMany>>);

    return (
        <main className="min-h-screen max-w-5xl mx-auto p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold">AKD-MI Directory</h1>
                <p className="opacity-70 mt-2">Discover educational institutions on the AKD-MI platform.</p>
            </header>

            {instances.length === 0 ? (
                <p className="opacity-60">No published institutions yet.</p>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instances.map((i) => (
                        <li key={i.id} className="border border-current/15 rounded-lg p-4">
                            <h2 className="font-semibold">{i.name}</h2>
                            <p className="text-sm opacity-70">
                                {[i.city, i.country].filter(Boolean).join(', ') || '—'}
                            </p>
                            <p className="text-xs opacity-50 mt-1">{i.category}</p>
                            {i.publicUrl && (
                                <Link href={i.publicUrl} className="inline-block mt-3 underline text-sm">
                                    Visit →
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <footer className="mt-12 text-sm opacity-50">
                <Link href="/admin" className="underline">Platform admin</Link>
            </footer>
        </main>
    );
}
