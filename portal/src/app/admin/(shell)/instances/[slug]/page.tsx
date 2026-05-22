'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusBadge, Button } from '@/components/AdminShell';
import { JobRunner, type JobSnapshot } from '@/components/JobRunner';
import { useConfirm, useNotify } from '@/components/Dialogs';
import { resolvePublicUrl } from '@/lib/public-url';
import {
    ArrowLeft, Play, Square, RefreshCw, Database, Sprout, HardDriveDownload, Trash2,
    Pencil, ExternalLink, ScrollText, Pause, FileTerminal, X, Save,
    KeyRound, Eye, EyeOff, Copy, Check,
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
    const confirm = useConfirm();
    const notify = useNotify();
    const [slug, setSlug] = useState<string>('');
    const [instance, setInstance] = useState<Instance | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);
    /** Currently-active background job (running OR most-recent completed). */
    const [job, setJob] = useState<{ id: string; kind: string } | null>(null);
    /** When a job is running we lock all op buttons. */
    const [jobRunning, setJobRunning] = useState(false);

    useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

    const refresh = useCallback(async () => {
        if (!slug) return;
        setRefreshing(true);
        try {
            const r = await fetch(`/api/admin/instances/${slug}`, { cache: 'no-store' });
            if (r.status === 401) { router.replace('/admin/login'); return; }
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            setInstance(j.instance);
            setError(null);
        } catch (e: any) { setError(e.message); }
        finally { setRefreshing(false); }
    }, [slug, router]);

    useEffect(() => { refresh(); }, [refresh]);

    // On mount / slug change, reattach to any in-flight job for this instance
    // (e.g. user reloaded the page while `up` was still running).
    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        (async () => {
            try {
                const r = await fetch(`/api/admin/jobs?slug=${slug}&active=1&limit=1`, { cache: 'no-store' });
                const j = await r.json();
                if (cancelled) return;
                const it = j.items?.[0];
                if (it) { setJob({ id: it.id, kind: it.kind }); setJobRunning(true); }
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [slug]);

    function showToast(t: { kind: 'ok' | 'err'; msg: string }) {
        notify(t.kind === 'ok' ? 'success' : 'error', t.msg);
    }

    /** Fire-and-forget an async op: POST/DELETE, capture jobId, show JobRunner. */
    async function startJob(label: string, url: string, method: 'POST' | 'DELETE' = 'POST') {
        setError(null);
        try {
            const r = await fetch(url, { method });
            const j = await r.json().catch(() => ({}));
            if (r.status === 409 && j.jobId) {
                // Another job is already running — attach to it instead of erroring out.
                setJob({ id: j.jobId, kind: label });
                setJobRunning(true);
                showToast({ kind: 'err', msg: `Already running — attached to existing job.` });
                return;
            }
            if (!r.ok || !j.jobId) throw new Error(j.error ?? r.statusText);
            setJob({ id: j.jobId, kind: j.kind ?? label });
            setJobRunning(true);
        } catch (e: any) {
            showToast({ kind: 'err', msg: `${label} failed to start: ${e.message}` });
        }
    }

    /** Called by JobRunner when the job reaches a terminal state. */
    const onJobDone = useCallback(async (snap: JobSnapshot) => {
        setJobRunning(false);
        const label = snap.kind;
        if (snap.status === 'succeeded') {
            showToast({ kind: 'ok', msg: `${label} succeeded` });
            if (label === 'destroy') {
                router.push('/admin/instances');
                return;
            }
            await refresh();
        } else if (snap.status === 'failed') {
            showToast({ kind: 'err', msg: `${label} failed${snap.exitCode != null ? ` (exit ${snap.exitCode})` : ''}` });
            await refresh();
        } else if (snap.status === 'canceled') {
            showToast({ kind: 'err', msg: `${label} canceled` });
            await refresh();
        }
    }, [refresh, router]);

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
                        <Button variant="outline" onClick={refresh} disabled={refreshing}>
                            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                }
            />

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
                                {jobRunning && <span className="text-[11px] muted">a job is running — buttons disabled</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {instance.status === 'RUNNING' ? (
                                    <Button variant="outline" onClick={() => startJob('down', `/api/admin/instances/${slug}/down`)} disabled={jobRunning}>
                                        <Square className="size-4" /> Stop
                                    </Button>
                                ) : (
                                    <Button onClick={() => startJob('up', `/api/admin/instances/${slug}/up`)} disabled={jobRunning}>
                                        <Play className="size-4" /> Start
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => startJob('restart', `/api/admin/instances/${slug}/restart`)} disabled={jobRunning}>
                                    <RefreshCw className="size-4" /> Restart
                                </Button>
                                <Button variant="outline" onClick={() => startJob('migrate', `/api/admin/instances/${slug}/migrate`)} disabled={jobRunning}>
                                    <Database className="size-4" /> Migrate
                                </Button>
                                <Button variant="outline" onClick={() => startJob('seed', `/api/admin/instances/${slug}/seed`)} disabled={jobRunning}>
                                    <Sprout className="size-4" /> Seed
                                </Button>
                                <Button variant="outline" onClick={() => startJob('backup', `/api/admin/instances/${slug}/backup`)} disabled={jobRunning}>
                                    <HardDriveDownload className="size-4" /> Backup
                                </Button>
                                <div className="flex-1" />
                                <Button
                                    variant="danger"
                                    onClick={async () => {
                                        const ok = await confirm({
                                            title: `Destroy ${slug}?`,
                                            message: 'This wipes containers, volumes and the on-disk directory. The operation cannot be undone.',
                                            confirmText: 'Destroy',
                                            variant: 'danger',
                                            typeToConfirm: slug,
                                        });
                                        if (ok) startJob('destroy', `/api/admin/instances/${slug}`, 'DELETE');
                                    }}
                                    disabled={jobRunning}
                                >
                                    <Trash2 className="size-4" /> Destroy
                                </Button>
                            </div>
                        </div>

                        {job && (
                            <JobRunner
                                jobId={job.id}
                                onClose={jobRunning ? undefined : () => setJob(null)}
                                onDone={onJobDone}
                            />
                        )}

                        <CredentialsCard slug={slug} />
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
    const [resolved, setResolved] = useState<string | null>(url ?? null);
    useEffect(() => { setResolved(resolvePublicUrl(url)); }, [url]);
    return (
        <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider muted">{label}</div>
            {resolved ? (
                <a href={resolved} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline truncate max-w-full">
                    <span className="truncate">{resolved}</span> <ExternalLink className="size-3 shrink-0" />
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
    const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                const r = await fetch('/api/categories', { cache: 'no-store' });
                const j = await r.json();
                if (!cancel) setCategories(j.items ?? []);
            } catch { /* ignore */ }
        })();
        return () => { cancel = true; };
    }, []);

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
                    <label className="block">
                        <span className="block text-xs muted mb-1">Category</span>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                        >
                            {/* always include the current value so legacy free-text categories don't disappear */}
                            {!categories.some((c) => c.code === form.category) && (
                                <option value={form.category}>{form.category}</option>
                            )}
                            {categories.map((c) => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </label>
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

type Creds = {
    admin: { email: string | null; password: string | null; name: string | null };
    urls: { publicWeb: string | null; publicApi: string | null; s3Public: string | null };
    ports: Record<string, string | null>;
    database: { name: string | null; user: string | null; password: string | null; url: string | null };
    redis: { password: string | null; url: string | null };
    minio: { rootUser: string | null; rootPassword: string | null; bucket: string | null };
    secrets: { jwt: string | null; jwtRefresh: string | null; session: string | null };
};

function CredentialsCard({ slug }: { slug: string }) {
    const [data, setData] = useState<Creds | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [revealAll, setRevealAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setErr(null);
        try {
            const r = await fetch(`/api/admin/instances/${slug}/credentials`, { cache: 'no-store' });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            setData(j);
        } catch (e: any) { setErr(e.message); }
        finally { setLoading(false); }
    }, [slug]);

    useEffect(() => { if (open && !data && !loading) load(); }, [open, data, loading, load]);

    return (
        <div className="card p-5">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-2"
            >
                <KeyRound className="size-4" />
                <h3 className="font-semibold">Credentials</h3>
                <span className="text-xs muted ml-2">read from <code>instances/{slug}/.env</code></span>
                <div className="flex-1" />
                {open && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setRevealAll((v) => !v); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setRevealAll((v) => !v); } }}
                        className="inline-flex items-center gap-1.5 rounded-lg font-medium transition px-2.5 py-1 text-xs border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                        {revealAll ? <><EyeOff className="size-3" /> Hide all</> : <><Eye className="size-3" /> Reveal all</>}
                    </span>
                )}
                <span className="text-xs muted">{open ? 'hide' : 'show'}</span>
            </button>

            {open && (
                <div className="mt-4 space-y-5">
                    {loading && <div className="text-sm muted">Loading…</div>}
                    {err && <div className="text-sm text-rose-600">{err}</div>}
                    {data && (
                        <>
                            <SecretGroup title="Admin login">
                                <SecretRow label="Email" value={data.admin.email} secret={false} forceReveal={revealAll} />
                                <SecretRow label="Password" value={data.admin.password} forceReveal={revealAll} />
                            </SecretGroup>
                            <SecretGroup title="Database">
                                <SecretRow label="Name" value={data.database.name} secret={false} forceReveal={revealAll} />
                                <SecretRow label="User" value={data.database.user} secret={false} forceReveal={revealAll} />
                                <SecretRow label="Password" value={data.database.password} forceReveal={revealAll} />
                                <SecretRow label="URL" value={data.database.url} forceReveal={revealAll} />
                            </SecretGroup>
                            <SecretGroup title="MinIO / S3">
                                <SecretRow label="Root user" value={data.minio.rootUser} secret={false} forceReveal={revealAll} />
                                <SecretRow label="Root password" value={data.minio.rootPassword} forceReveal={revealAll} />
                                <SecretRow label="Bucket" value={data.minio.bucket} secret={false} forceReveal={revealAll} />
                                <SecretRow label="Public endpoint" value={data.urls.s3Public} secret={false} forceReveal={revealAll} />
                            </SecretGroup>
                            <SecretGroup title="Redis">
                                <SecretRow label="Password" value={data.redis.password} forceReveal={revealAll} />
                                <SecretRow label="URL" value={data.redis.url} forceReveal={revealAll} />
                            </SecretGroup>
                            <SecretGroup title="Secrets">
                                <SecretRow label="JWT" value={data.secrets.jwt} forceReveal={revealAll} />
                                <SecretRow label="JWT refresh" value={data.secrets.jwtRefresh} forceReveal={revealAll} />
                                <SecretRow label="Session" value={data.secrets.session} forceReveal={revealAll} />
                            </SecretGroup>
                            <SecretGroup title="Ports">
                                {Object.entries(data.ports).map(([k, v]) => (
                                    <SecretRow key={k} label={k} value={v} secret={false} forceReveal={revealAll} />
                                ))}
                            </SecretGroup>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function SecretGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-wider muted mb-2">{title}</div>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function SecretRow({ label, value, secret = true, forceReveal = false }: { label: string; value: string | null; secret?: boolean; forceReveal?: boolean }) {
    const [shown, setShown] = useState(false);
    const [copied, setCopied] = useState(false);
    const reveal = !secret || shown || forceReveal;

    async function copy() {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { /* ignore */ }
    }

    return (
        <div className="grid grid-cols-[8rem_1fr_auto] items-center gap-2 text-sm">
            <div className="text-xs muted truncate">{label}</div>
            <div className="font-mono text-xs truncate select-all">
                {value == null ? <span className="muted">—</span> : reveal ? value : '•'.repeat(Math.min(value.length, 24))}
            </div>
            <div className="flex items-center gap-1">
                {secret && (
                    <button
                        type="button"
                        onClick={() => setShown((s) => !s)}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 muted"
                        aria-label={shown ? 'Hide' : 'Reveal'}
                    >
                        {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                )}
                <button
                    type="button"
                    onClick={copy}
                    disabled={!value}
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 muted disabled:opacity-30"
                    aria-label="Copy"
                >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
            </div>
        </div>
    );
}
