'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusBadge, Button } from '@/components/AdminShell';
import {
    ArrowLeft, Play, Square, RefreshCw, Database, Sprout, HardDriveDownload, Trash2,
    Pencil, ExternalLink, ScrollText, Pause, FileTerminal, X, Save,
} from 'lucide-react';

type Instance = {
    id: string;
    slug: string;
    name: string;
    category: string;
    description?: string | null;
    city?: string | null;
    country?: string | null;
    logoUrl?: string | null;
    publicUrl?: string | null;
    apiUrl?: string | null;
    status: string;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    lastHealthAt?: string | null;
};

export default function InstanceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const [slug, setSlug] = useState<string>('');
    const [instance, setInstance] = useState<Instance | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

    const refresh = useCallback(async () => {
        if (!slug) return;
        try {
            const r = await fetch(`/api/admin/instances/${slug}`, { cache: 'no-store' });
            if (r.status === 401) { router.replace('/admin/login'); return; }
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            setInstance(j.instance);
        } catch (e: any) { setError(e.message); }
    }, [slug, router]);

    useEffect(() => { refresh(); }, [refresh]);

    function showToast(t: { kind: 'ok' | 'err'; msg: string }) {
        setToast(t);
        setTimeout(() => setToast(null), 3500);
    }

    async function runAction(label: string, url: string, method: 'POST' | 'DELETE' = 'POST') {
        setBusy(label); setError(null);
        try {
            const r = await fetch(url, { method });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.error ?? j.cli?.stderr ?? r.statusText);
            showToast({ kind: 'ok', msg: `${label} OK` });
            if (label === 'destroy') router.push('/admin/instances');
            else await refresh();
        } catch (e: any) {
            showToast({ kind: 'err', msg: `${label} failed: ${e.message}` });
        } finally { setBusy(null); }
    }

    if (!slug) return null;
    if (!instance && !error) return <div className="p-8 muted text-sm">Loading…</div>;

    return (
        <>
            <PageHeader
                title={instance?.name ?? slug}
                subtitle={<code>{slug}</code> as any}
                action={
                    <div className="flex items-center gap-2">
                        <Link href="/admin/instances"><Button variant="ghost"><ArrowLeft className="size-4" /> Back</Button></Link>
                        <Button variant="outline" onClick={refresh}><RefreshCw className="size-4" /></Button>
                    </div>
                }
            />

            {toast && (
                <div className={`mx-6 mt-4 card p-3 text-sm flex items-center justify-between ${toast.kind === 'ok' ? 'border-emerald-300 bg-emerald-50/60 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-300 bg-rose-50/60 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)}><X className="size-4" /></button>
                </div>
            )}
            {error && <div className="mx-6 mt-4 card p-3 text-sm text-rose-600 border-rose-300">{error}</div>}

            {instance && (
                <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left column */}
                    <section className="xl:col-span-2 space-y-6">
                        <div className="card p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-12 rounded-xl gradient-brand text-white grid place-items-center font-bold text-lg shrink-0">
                                        {instance.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-lg font-semibold">{instance.name}</h2>
                                            <StatusBadge status={instance.status} />
                                            {instance.isPublished && <span className="text-[10px] uppercase tracking-wider muted">public</span>}
                                        </div>
                                        <div className="text-xs muted truncate">{instance.category}{instance.city || instance.country ? ` · ${[instance.city, instance.country].filter(Boolean).join(', ')}` : ''}</div>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" /> Edit</Button>
                            </div>
                            {instance.description && <p className="text-sm muted mt-4 whitespace-pre-wrap">{instance.description}</p>}

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <UrlField label="Public URL" url={instance.publicUrl} />
                                <UrlField label="API URL" url={instance.apiUrl} />
                                <Meta label="Created"  value={new Date(instance.createdAt).toLocaleString()} />
                                <Meta label="Updated"  value={new Date(instance.updatedAt).toLocaleString()} />
                                <Meta label="Last health" value={instance.lastHealthAt ? new Date(instance.lastHealthAt).toLocaleString() : '—'} />
                                <Meta label="Status"   value={instance.status} />
                            </div>
                        </div>

                        <div className="card p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <FileTerminal className="size-4" />
                                <h3 className="font-semibold">Operations</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {instance.status === 'RUNNING' ? (
                                    <Button variant="outline" onClick={() => runAction('stop', `/api/admin/instances/${slug}/down`)} disabled={!!busy}>
                                        <Square className="size-4" /> {busy === 'stop' ? '…' : 'Stop'}
                                    </Button>
                                ) : (
                                    <Button onClick={() => runAction('start', `/api/admin/instances/${slug}/up`)} disabled={!!busy}>
                                        <Play className="size-4" /> {busy === 'start' ? '…' : 'Start'}
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => runAction('restart', `/api/admin/instances/${slug}/restart`)} disabled={!!busy}>
                                    <RefreshCw className="size-4" /> {busy === 'restart' ? '…' : 'Restart'}
                                </Button>
                                <Button variant="outline" onClick={() => runAction('migrate', `/api/admin/instances/${slug}/migrate`)} disabled={!!busy}>
                                    <Database className="size-4" /> {busy === 'migrate' ? '…' : 'Migrate'}
                                </Button>
                                <Button variant="outline" onClick={() => runAction('seed', `/api/admin/instances/${slug}/seed`)} disabled={!!busy}>
                                    <Sprout className="size-4" /> {busy === 'seed' ? '…' : 'Seed'}
                                </Button>
                                <Button variant="outline" onClick={() => runAction('backup', `/api/admin/instances/${slug}/backup`)} disabled={!!busy}>
                                    <HardDriveDownload className="size-4" /> {busy === 'backup' ? '…' : 'Backup'}
                                </Button>
                                <div className="flex-1" />
                                <Button
                                    variant="danger"
                                    onClick={() => { if (confirm(`Destroy "${slug}"? This wipes containers, volumes and on-disk directory.`)) runAction('destroy', `/api/admin/instances/${slug}`, 'DELETE'); }}
                                    disabled={!!busy}
                                >
                                    <Trash2 className="size-4" /> {busy === 'destroy' ? '…' : 'Destroy'}
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Right column: logs */}
                    <section className="xl:col-span-1 min-w-0">
                        <LogsPanel slug={slug} />
                    </section>
                </div>
            )}

            {editing && instance && (
                <EditModal
                    instance={instance}
                    onClose={() => setEditing(false)}
                    onSaved={async () => { setEditing(false); await refresh(); showToast({ kind: 'ok', msg: 'Saved' }); }}
                />
            )}
        </>
    );
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-wider muted">{label}</div>
            <div className="mt-0.5">{value}</div>
        </div>
    );
}

function UrlField({ label, url }: { label: string; url?: string | null }) {
    return (
        <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider muted">{label}</div>
            {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline truncate max-w-full">
                    <span className="truncate">{url}</span> <ExternalLink className="size-3 shrink-0" />
                </a>
            ) : <div className="muted">—</div>}
        </div>
    );
}

function LogsPanel({ slug }: { slug: string }) {
    const [service, setService] = useState<string>('');
    const [tail, setTail] = useState(200);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [follow, setFollow] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrollRef = useRef<HTMLPreElement>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (service) q.set('service', service);
            q.set('tail', String(tail));
            const r = await fetch(`/api/admin/instances/${slug}/logs?${q.toString()}`, { cache: 'no-store' });
            const j = await r.json();
            const out = [j.stdout, j.stderr].filter(Boolean).join('\n');
            setText(out || '(no output)');
            requestAnimationFrame(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            });
        } finally { setLoading(false); }
    }, [slug, service, tail]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (follow) {
            timerRef.current = setInterval(fetchLogs, 5000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [follow, fetchLogs]);

    return (
        <div className="card p-0 overflow-hidden flex flex-col h-[640px]">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap">
                <ScrollText className="size-4" />
                <h3 className="font-semibold text-sm">Logs</h3>
                <div className="flex-1" />
                <input
                    placeholder="service (api, web, db)"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="px-2 py-1 rounded border border-[var(--border)] bg-transparent text-xs w-36"
                />
                <select value={tail} onChange={(e) => setTail(parseInt(e.target.value, 10))} className="px-2 py-1 rounded border border-[var(--border)] bg-transparent text-xs">
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                </select>
                <Button size="sm" variant="outline" onClick={() => setFollow((f) => !f)}>
                    {follow ? <><Pause className="size-3" /> Stop</> : <><Play className="size-3" /> Follow</>}
                </Button>
                <Button size="sm" variant="outline" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className="size-3" /> {loading ? '…' : 'Refresh'}
                </Button>
            </div>
            <pre ref={scrollRef} className="flex-1 overflow-auto text-[11px] leading-5 p-3 bg-black/90 text-emerald-200 font-mono whitespace-pre-wrap break-all">{text}</pre>
        </div>
    );
}

function EditModal({ instance, onClose, onSaved }: { instance: Instance; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({
        name: instance.name,
        category: instance.category,
        description: instance.description ?? '',
        city: instance.city ?? '',
        country: instance.country ?? '',
        logoUrl: instance.logoUrl ?? '',
        isPublished: instance.isPublished,
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setErr(null);
        try {
            const r = await fetch(`/api/admin/instances/${instance.slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            onSaved();
        } catch (e: any) { setErr(e.message); }
        finally { setBusy(false); }
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
            <form onSubmit={save} className="card w-full max-w-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Edit {instance.slug}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"><X className="size-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Inp label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                    <Inp label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
                    <Inp label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Inp label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                    <Inp label="Logo URL" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} colSpan={2} />
                </div>
                <label className="block text-sm">
                    <span className="block text-xs muted mb-1">Description</span>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                    Published in public directory
                </label>
                {err && <div className="text-sm text-rose-600">{err}</div>}
                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={busy}><Save className="size-4" /> {busy ? 'Saving…' : 'Save'}</Button>
                </div>
            </form>
        </div>
    );
}

function Inp({ label, value, onChange, colSpan }: { label: string; value: string; onChange: (v: string) => void; colSpan?: number }) {
    return (
        <label className={`block ${colSpan === 2 ? 'sm:col-span-2' : ''}`}>
            <span className="block text-xs muted mb-1">{label}</span>
            <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
        </label>
    );
}
