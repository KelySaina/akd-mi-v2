'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Button } from '@/components/AdminShell';
import { JobRunner, type JobSnapshot } from '@/components/JobRunner';
import { ArrowLeft, Sparkles, KeyRound, Copy, Check, Info, ListChecks, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

type Category = { code: string; label: string };

export default function NewInstancePage() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobDone, setJobDone] = useState<JobSnapshot | null>(null);
    const [creds, setCreds] = useState<{ slug: string; email: string; password: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState({
        slug: '', name: '', category: 'SCHOOL',
        city: '', country: '', description: '', isPublished: false,
    });

    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                const r = await fetch('/api/categories', { cache: 'no-store' });
                const j = await r.json();
                if (cancel) return;
                const items: Category[] = j.items ?? [];
                setCategories(items);
                if (items.length && !items.some((c) => c.code === form.category)) {
                    setForm((f) => ({ ...f, category: items[0].code }));
                }
            } catch { /* ignore — select falls back to the seeded default */ }
        })();
        return () => { cancel = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setError(null);
        try {
            const r = await fetch('/api/admin/instances', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            if (!j.jobId) throw new Error('server did not return a jobId');
            setJobId(j.jobId);
        } catch (e: any) { setError(e.message); setBusy(false); }
    }

    function onJobDone(snap: JobSnapshot) {
        setJobDone(snap);
        setBusy(false);
        if (snap.status === 'succeeded' && snap.result?.admin?.email && snap.result?.admin?.password) {
            setCreds({
                slug: form.slug,
                email: snap.result.admin.email,
                password: snap.result.admin.password,
            });
        } else if (snap.status === 'failed' || snap.status === 'canceled') {
            setError(snap.error ?? `provisioning ${snap.status}`);
        }
    }

    async function copyCreds() {
        if (!creds) return;
        const ok = await copyToClipboard(`Email: ${creds.email}\nPassword: ${creds.password}`);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    }

    if (creds) {
        return (
            <>
                <PageHeader title="Instance created" subtitle={creds.slug} />
                <div className="p-6 max-w-2xl space-y-4">
                    <div className="card p-5 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                            <Sparkles className="size-4" /> Provisioned successfully
                        </div>
                        <p className="text-sm muted mt-2">
                            Save the initial administrator credentials below — they are only shown here.
                            They are also stored in <code>instances/{creds.slug}/.env</code> on the host.
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <Field label="Admin email" value={creds.email} />
                            <Field label="Admin password" value={creds.password} mono />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Button onClick={copyCreds} variant="outline">
                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                {copied ? 'Copied' : 'Copy credentials'}
                            </Button>
                            <Link href={`/admin/instances/${creds.slug}`}>
                                <Button><KeyRound className="size-4" /> Open instance</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const canSubmit = !busy && !!form.slug && !!form.name;

    return (
        <>
            <PageHeader
                title="New instance"
                action={<Link href="/admin/instances"><Button variant="ghost"><ArrowLeft className="size-4" /> Back</Button></Link>}
            />

            <div className="page-fit p-4 lg:p-6 gap-4 lg:gap-6 grid grid-cols-1 md:grid-cols-2">
                {/* ── LEFT: Form ──────────────────────────────────────────── */}
                <form onSubmit={submit} className="scroll-card card">
                    <header className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold">Configuration</h2>
                        <span className="text-xs muted">Fill in identity &amp; metadata</span>
                    </header>

                    <div className="scroll-card-body p-5 space-y-6">
                        <section className="space-y-3">
                            <SectionTitle>Identity</SectionTitle>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FieldInput
                                    label="Slug" required value={form.slug}
                                    onChange={(v) => setForm({ ...form, slug: v })}
                                    placeholder="paris-tech"
                                    hint="Lowercase letters, digits, dashes. 3–32 chars."
                                    disabled={!!jobId}
                                />
                                <FieldInput
                                    label="Name" required value={form.name}
                                    onChange={(v) => setForm({ ...form, name: v })}
                                    placeholder="Paris Tech Institute"
                                    disabled={!!jobId}
                                />
                                <label className="block">
                                    <span className="block text-xs muted mb-1">Category</span>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        disabled={!!jobId}
                                        className="w-full h-[38px] rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] px-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-60"
                                    >
                                        {categories.length === 0
                                            ? <option value={form.category}>{form.category}</option>
                                            : categories.map((c) => (
                                                <option key={c.code} value={c.code}>{c.label}</option>
                                            ))}
                                    </select>
                                </label>
                                <div className="block">
                                    <span className="block text-xs muted mb-1">Visibility</span>
                                    <label className="h-[38px] flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 bg-[var(--panel)] cursor-pointer">
                                        <span className="text-sm">Publish in public directory</span>
                                        <Toggle
                                            checked={form.isPublished}
                                            onChange={(v) => setForm({ ...form, isPublished: v })}
                                            disabled={!!jobId}
                                        />
                                    </label>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <SectionTitle>Location &amp; description</SectionTitle>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FieldInput label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} disabled={!!jobId} />
                                <FieldInput label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} disabled={!!jobId} />
                            </div>
                            <label className="block">
                                <span className="block text-xs muted mb-1">Description</span>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    disabled={!!jobId}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-60"
                                />
                            </label>
                        </section>

                        {error && (
                            <div className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 whitespace-pre-wrap">
                                {error}
                            </div>
                        )}
                    </div>

                    <footer className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--panel)]">
                        <span className="text-xs muted">
                            Runs <code className="text-[var(--ink)]">akd-mi init → up → seed</code>
                        </span>
                        <div className="flex items-center gap-2">
                            <Link href="/admin/instances"><Button variant="ghost" type="button">Cancel</Button></Link>
                            {!jobId
                                ? <Button type="submit" disabled={!canSubmit}>{busy ? 'Starting…' : 'Create & start'}</Button>
                                : jobDone && jobDone.status !== 'succeeded'
                                    ? <Button type="button" variant="outline" onClick={() => { setJobId(null); setJobDone(null); setError(null); }}>Try again</Button>
                                    : <Button type="button" disabled>Provisioning…</Button>}
                        </div>
                    </footer>
                </form>

                {/* ── RIGHT: Live progress / hints ─────────────────────────── */}
                <aside className="scroll-card card">
                    <header className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            {jobId
                                ? <><ListChecks className="size-4 text-indigo-500" /> Provisioning {form.slug}</>
                                : <><Info className="size-4 text-indigo-500" /> What will happen</>}
                        </h2>
                        {jobDone && (
                            <span className={[
                                'text-[11px] px-2 py-0.5 rounded-full font-medium',
                                jobDone.status === 'succeeded'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
                            ].join(' ')}>
                                {jobDone.status}
                            </span>
                        )}
                    </header>

                    <div className="scroll-card-body p-0">
                        {jobId ? (
                            <div className="p-4 space-y-3">
                                <Link href={`/admin/jobs/${jobId}`} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-300 hover:underline">
                                    <ExternalLink className="size-3" /> Open in Jobs page (keeps running if you navigate away)
                                </Link>
                                <JobRunner jobId={jobId} onDone={onJobDone} />
                            </div>
                        ) : (
                            <div className="p-5 space-y-4 text-sm">
                                <ol className="space-y-3">
                                    <Step n={1} title="akd-mi init"
                                          body="Creates the instance directory, allocates a port window, and generates a random admin password and JWT secrets." />
                                    <Step n={2} title="akd-mi up"
                                          body="Builds (or reuses) Docker images and starts the database, Redis, MinIO, API and web containers." />
                                    <Step n={3} title="akd-mi seed"
                                          body="Applies the schema and seeds the initial admin account. Credentials will be shown once on the next screen." />
                                </ol>
                                <p className="muted text-xs">
                                    Live progress, logs and an option to cancel will appear here once you click <b className="text-[var(--ink)]">Create &amp; start</b>.
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-xs uppercase tracking-wide muted font-semibold">{children}</h3>;
}

function FieldInput({ label, value, onChange, required, placeholder, hint, disabled }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; hint?: string; disabled?: boolean }) {
    return (
        <label className="block">
            <span className="block text-xs muted mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className="w-full h-[38px] rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] px-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-60"
            />
            {hint && <span className="text-[11px] muted mt-1 block">{hint}</span>}
        </label>
    );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <span className="switch" aria-label="Toggle">
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
            />
            <i />
        </span>
    );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
    return (
        <li className="flex gap-3">
            <span className="size-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 grid place-items-center text-xs font-semibold">{n}</span>
            <div className="min-w-0">
                <div className="font-medium"><code className="text-[var(--ink)]">{title}</code></div>
                <div className="text-xs muted mt-0.5">{body}</div>
            </div>
        </li>
    );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <div className="text-xs muted">{label}</div>
            <div className={`mt-0.5 ${mono ? 'font-mono text-sm' : 'text-sm'} break-all`}>{value}</div>
        </div>
    );
}
