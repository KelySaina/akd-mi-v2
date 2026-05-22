import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader, StatusBadge, Button } from '@/components/AdminShell';
import { PublicLink } from '@/components/PublicLink';
import { Server, Activity, Globe2, Plus, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const [all, running, stopped, published] = await Promise.all([
        prisma.instance.count(),
        prisma.instance.count({ where: { status: 'RUNNING' } }),
        prisma.instance.count({ where: { status: 'STOPPED' } }),
        prisma.instance.count({ where: { isPublished: true } }),
    ]);
    const recent = await prisma.instance.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 6,
    });

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle="Overview of all institution instances"
                action={
                    <Link href="/admin/instances/new">
                        <Button><Plus className="size-4" /> New instance</Button>
                    </Link>
                }
            />
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Stat label="Total instances" value={all}     icon={<Server className="size-5" />} tint="from-indigo-500 to-violet-600" />
                    <Stat label="Running"        value={running}  icon={<Activity className="size-5" />} tint="from-emerald-500 to-teal-600" />
                    <Stat label="Stopped"        value={stopped}  icon={<Activity className="size-5" />} tint="from-amber-500 to-orange-600" />
                    <Stat label="Published"      value={published} icon={<Globe2 className="size-5" />} tint="from-sky-500 to-cyan-600" />
                </div>

                <section className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Recent activity</h2>
                            <div className="text-xs muted">Latest updated instances</div>
                        </div>
                        <Link href="/admin/instances" className="text-sm text-indigo-600 hover:underline">View all →</Link>
                    </div>
                    {recent.length === 0 ? (
                        <div className="p-10 text-center muted text-sm">
                            No instances yet. <Link className="underline" href="/admin/instances/new">Create one →</Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[var(--border)]">
                            {recent.map((i) => (
                                <li key={i.id} className="px-5 py-3 flex items-center gap-4">
                                    <div className="size-9 rounded-lg gradient-brand text-white grid place-items-center font-bold text-sm shrink-0">
                                        {i.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/instances/${i.slug}`} className="font-medium hover:underline truncate">{i.name}</Link>
                                            <StatusBadge status={i.status} />
                                            {i.isPublished && <span className="text-[10px] uppercase tracking-wider muted">public</span>}
                                        </div>
                                        <div className="text-xs muted truncate">
                                            <code>{i.slug}</code>
                                            {i.city || i.country ? <> · {[i.city, i.country].filter(Boolean).join(', ')}</> : null}
                                            {' · '}updated {new Date(i.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {i.publicUrl && (
                                        <PublicLink url={i.publicUrl} className="text-xs text-indigo-600 inline-flex items-center gap-1 hover:underline">
                                            Open <ExternalLink className="size-3" />
                                        </PublicLink>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

function Stat({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint: string }) {
    return (
        <div className="card p-5 flex items-center gap-4">
            <div className={`size-11 rounded-xl bg-gradient-to-br ${tint} text-white grid place-items-center`}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-2xl font-semibold leading-none">{value}</div>
                <div className="text-xs muted mt-1">{label}</div>
            </div>
        </div>
    );
}
