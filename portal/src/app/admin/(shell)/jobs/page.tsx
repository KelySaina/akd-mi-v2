'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button } from '@/components/AdminShell';
import { RefreshCw, Loader2, CheckCircle2, XCircle, MinusCircle, ScrollText, Square } from 'lucide-react';

type JobRow = {
    id: string;
    slug: string | null;
    kind: string;
    title: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed' | 'canceled';
    currentStep: number;
    totalSteps: number;
    exitCode: number | null;
    startedAt: number;
    endedAt: number | null;
};

export default function JobsListPage() {
    const router = useRouter();
    const [items, setItems] = useState<JobRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active'>('all');

    const refresh = useCallback(async () => {
        try {
            const url = filter === 'active'
                ? '/api/admin/jobs?active=1&limit=200'
                : '/api/admin/jobs?limit=200';
            const r = await fetch(url, { cache: 'no-store' });
            if (r.status === 401) { router.replace('/admin/login'); return; }
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            setItems(j.items ?? []);
            setError(null);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }, [filter, router]);

    // Poll every 3s so running jobs animate.
    useEffect(() => {
        refresh();
        const t = setInterval(refresh, 3000);
        return () => clearInterval(t);
    }, [refresh]);

    const activeCount = items.filter((i) => i.status === 'running' || i.status === 'pending').length;

    return (
        <>
            <PageHeader
                title="Jobs"
                subtitle={`${items.length} total${activeCount ? ` · ${activeCount} active` : ''}`}
                action={
                    <div className="flex items-center gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as 'all' | 'active')}
                            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-sm"
                        >
                            <option value="all">All jobs</option>
                            <option value="active">Active only</option>
                        </select>
                        <Button variant="outline" onClick={refresh}>
                            <RefreshCw className="size-4" /> Refresh
                        </Button>
                    </div>
                }
            />

            <div className="p-6 space-y-4">
                {error && <div className="card p-3 text-sm text-rose-600 border-rose-300">{error}</div>}

                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center muted text-sm">Loading…</div>
                    ) : items.length === 0 ? (
                        <div className="p-10 text-center muted text-sm">
                            No jobs yet. Background operations (provisioning, restart, backup…) will appear here.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wider muted bg-black/[0.02] dark:bg-white/[0.02]">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Job</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Instance</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Steps</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Started</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Duration</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {items.map((j) => (
                                    <tr key={j.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                        <td className="px-4 py-3"><StatusPill status={j.status} /></td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/jobs/${j.id}`} className="font-medium hover:underline">
                                                {j.kind}
                                            </Link>
                                            <div className="text-[11px] muted truncate max-w-[400px]">{j.title}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {j.slug
                                                ? <Link href={`/admin/instances/${j.slug}`} className="hover:underline"><code>{j.slug}</code></Link>
                                                : <span className="muted">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs muted">
                                            {Math.min(j.currentStep + 1, j.totalSteps)}/{j.totalSteps}
                                        </td>
                                        <td className="px-4 py-3 text-xs muted whitespace-nowrap">
                                            {new Date(j.startedAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs muted whitespace-nowrap">
                                            {formatDuration(j.startedAt, j.endedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/jobs/${j.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <ScrollText className="size-3.5" /> View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

function StatusPill({ status }: { status: JobRow['status'] }) {
    const map = {
        pending:   { cls: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300', icon: <Loader2 className="size-3 animate-spin" />, label: 'Pending' },
        running:   { cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', icon: <Loader2 className="size-3 animate-spin" />, label: 'Running' },
        succeeded: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', icon: <CheckCircle2 className="size-3" />, label: 'Succeeded' },
        failed:    { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: <XCircle className="size-3" />, label: 'Failed' },
        canceled:  { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: <MinusCircle className="size-3" />, label: 'Canceled' },
    } as const;
    const m = map[status];
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${m.cls}`}>{m.icon}{m.label}</span>;
}

function formatDuration(startedAt: number, endedAt: number | null) {
    const ms = (endedAt ?? Date.now()) - startedAt;
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
