'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusBadge, Button } from '@/components/AdminShell';
import { useConfirm, useNotify } from '@/components/Dialogs';
import { Plus, Search, RefreshCw, Trash2, Play, Square, ExternalLink, Globe2, DownloadCloud } from 'lucide-react';

type Instance = {
    id: string;
    slug: string;
    name: string;
    category: string;
    city?: string | null;
    country?: string | null;
    status: 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'ARCHIVED';
    isPublished: boolean;
    publicUrl?: string | null;
    updatedAt: string;
};

export default function InstancesListPage() {
    const router = useRouter();
    const confirm = useConfirm();
    const notify = useNotify();
    const [items, setItems] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeJobIds, setActiveJobIds] = useState<Set<string>>(new Set());
    const prevActiveRef = useRef<Set<string>>(new Set());
    const [importing, setImporting] = useState(false);

    async function importExisting() {
        setImporting(true); setError(null);
        try {
            const r = await fetch('/api/admin/instances/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            const created = (j.imported ?? []).filter((x: any) => x.action === 'created').length;
            const updated = (j.imported ?? []).filter((x: any) => x.action === 'updated').length;
            const errs    = (j.errors ?? []).length;
            notify(errs ? 'error' : 'success',
                `Imported ${created} new, refreshed ${updated}${errs ? `, ${errs} error(s)` : ''}.`,
                { title: 'Import from disk' });
            await refresh();
        } catch (e: any) {
            notify('error', e.message, { title: 'Import failed' });
        } finally { setImporting(false); }
    }

    const refresh = useCallback(async () => {
        setRefreshing(true); setError(null);
        try {
            const r = await fetch('/api/admin/instances', { cache: 'no-store' });
            if (r.status === 401) { router.replace('/admin/login'); return; }
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            setItems(j.items ?? []);
        } catch (e: any) { setError(e.message); }
        finally { setRefreshing(false); }
    }, [router]);

    useEffect(() => { (async () => { setLoading(true); await refresh(); setLoading(false); })(); }, [refresh]);

    // Poll active jobs every 4 s. When a previously-active job disappears (i.e.
    // finished), re-fetch the instance list so the UI reflects the new status.
    useEffect(() => {
        let cancelled = false;
        const tick = async () => {
            if (cancelled) return;
            try {
                const r = await fetch('/api/admin/jobs?active=1&limit=50', { cache: 'no-store' });
                if (!r.ok) return;
                const j = await r.json();
                const ids = new Set<string>((j.items ?? []).map((it: any) => it.id as string));
                const prev = prevActiveRef.current;
                const someFinished = [...prev].some((id) => !ids.has(id));
                prevActiveRef.current = ids;
                if (!cancelled) {
                    setActiveJobIds(ids);
                    if (someFinished) await refresh();
                }
            } catch { /* ignore */ }
        };
        tick();
        const t = setInterval(tick, 4000);
        return () => { cancelled = true; clearInterval(t); };
    }, [refresh]);

    const visible = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return items.filter((i) => {
            if (statusFilter !== 'all' && i.status !== statusFilter) return false;
            if (!needle) return true;
            return (
                i.slug.toLowerCase().includes(needle) ||
                i.name.toLowerCase().includes(needle) ||
                (i.city ?? '').toLowerCase().includes(needle) ||
                (i.country ?? '').toLowerCase().includes(needle)
            );
        });
    }, [items, q, statusFilter]);

    async function action(slug: string, verb: 'up' | 'down' | 'destroy') {
        if (verb === 'destroy') {
            const ok = await confirm({
                title: `Destroy ${slug}?`,
                message: 'Removes containers, volumes and on-disk directory. This cannot be undone.',
                confirmText: 'Destroy',
                variant: 'danger',
                typeToConfirm: slug,
            });
            if (!ok) return;
        }
        setBusy(`${verb}:${slug}`); setError(null);
        try {
            const r = await fetch(
                verb === 'destroy' ? `/api/admin/instances/${slug}` : `/api/admin/instances/${slug}/${verb}`,
                { method: verb === 'destroy' ? 'DELETE' : 'POST' },
            );
            const j = await r.json().catch(() => ({}));
            // 202 = job accepted, 409 = job already running. Both should send the user
            // to the detail page where the JobRunner auto-reattaches and streams logs.
            if (r.status === 202 || r.status === 409) {
                router.push(`/admin/instances/${slug}`);
                return;
            }
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            await refresh();
        } catch (e: any) {
            notify('error', e.message, { title: `${verb} failed` });
        }
        finally { setBusy(null); }
    }

    async function togglePublish(i: Instance) {
        setBusy(`pub:${i.slug}`);
        try {
            await fetch(`/api/admin/instances/${i.slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !i.isPublished }),
            });
            await refresh();
        } finally { setBusy(null); }
    }

    return (
        <>
            <PageHeader
                title="Instances"
                subtitle={`${items.length} total${activeJobIds.size ? ` · ${activeJobIds.size} job${activeJobIds.size > 1 ? 's' : ''} running` : ''}`}
                action={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={refresh} disabled={refreshing}>
                            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </Button>
                        <Button variant="outline" onClick={importExisting} disabled={importing} title="Scan instances/ on disk and register any missing rows in the portal DB">
                            <DownloadCloud className={`size-4 ${importing ? 'animate-pulse' : ''}`} />
                            {importing ? 'Importing…' : 'Import existing'}
                        </Button>
                        <Link href="/admin/instances/new"><Button><Plus className="size-4" /> New</Button></Link>
                    </div>
                }
            />
            <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--panel)]">
                        <Search className="size-4 muted" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by slug, name, city, country…"
                            className="bg-transparent outline-none flex-1 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-sm"
                    >
                        <option value="all">All statuses</option>
                        <option value="RUNNING">Running</option>
                        <option value="STOPPED">Stopped</option>
                        <option value="PROVISIONING">Provisioning</option>
                        <option value="ERROR">Error</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>

                {error && <div className="card p-3 text-sm text-rose-600 border-rose-300">{error}</div>}

                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center muted text-sm">Loading…</div>
                    ) : visible.length === 0 ? (
                        <div className="p-10 text-center muted text-sm">
                            {items.length === 0 ? <>No instances yet. <Link className="underline" href="/admin/instances/new">Create one →</Link></> : 'No instances match the current filter.'}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wider muted bg-black/[0.02] dark:bg-white/[0.02]">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium">Instance</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Location</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Published</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {visible.map((i) => (
                                    <tr key={i.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg gradient-brand text-white grid place-items-center text-xs font-bold shrink-0">
                                                    {i.name.slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/admin/instances/${i.slug}`} className="font-medium hover:underline">{i.name}</Link>
                                                    <div className="text-xs muted truncate"><code>{i.slug}</code> · {i.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs muted">
                                            {[i.city, i.country].filter(Boolean).join(', ') || '—'}
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => togglePublish(i)}
                                                disabled={busy === `pub:${i.slug}`}
                                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition ${i.isPublished ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'}`}
                                            >
                                                <Globe2 className="size-3" /> {i.isPublished ? 'public' : 'private'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {i.publicUrl && (
                                                    <a href={i.publicUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5" title="Open public URL">
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                )}
                                                {i.status === 'RUNNING' ? (
                                                    <Button size="sm" variant="outline" onClick={() => action(i.slug, 'down')} disabled={!!busy}>
                                                        <Square className="size-3" /> {busy === `down:${i.slug}` ? '…' : 'Stop'}
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => action(i.slug, 'up')} disabled={!!busy}>
                                                        <Play className="size-3" /> {busy === `up:${i.slug}` ? '…' : 'Start'}
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="danger" onClick={() => action(i.slug, 'destroy')} disabled={!!busy}>
                                                    <Trash2 className="size-3" /> {busy === `destroy:${i.slug}` ? '…' : ''}
                                                </Button>
                                            </div>
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
