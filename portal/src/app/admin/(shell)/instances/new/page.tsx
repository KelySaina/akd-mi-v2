'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader, Button } from '@/components/AdminShell';
import { ArrowLeft, Sparkles, KeyRound, Copy, Check } from 'lucide-react';

export default function NewInstancePage() {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creds, setCreds] = useState<{ slug: string; email: string; password: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [form, setForm] = useState({
        slug: '', name: '', category: 'SCHOOL',
        city: '', country: '', description: '', isPublished: false,
    });

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
            if (j.admin?.email && j.admin?.password) {
                setCreds({ slug: form.slug, email: j.admin.email, password: j.admin.password });
            } else {
                router.push(`/admin/instances/${form.slug}`);
            }
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    function copyCreds() {
        if (!creds) return;
        navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
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

    return (
        <>
            <PageHeader
                title="New instance"
                action={<Link href="/admin/instances"><Button variant="ghost"><ArrowLeft className="size-4" /> Back</Button></Link>}
            />
            <form onSubmit={submit} className="p-6 max-w-3xl space-y-6">
                <section className="card p-5 space-y-4">
                    <h2 className="font-semibold">Identity</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldInput label="Slug" required value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="paris-tech" hint="Lowercase letters, digits, dashes. 3–32 chars." />
                        <FieldInput label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Paris Tech Institute" />
                        <FieldInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="SCHOOL" />
                        <label className="flex items-end gap-2 text-sm">
                            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                            <span>Publish in public directory</span>
                        </label>
                    </div>
                </section>

                <section className="card p-5 space-y-4">
                    <h2 className="font-semibold">Location & description</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldInput label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                        <FieldInput label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                    </div>
                    <div>
                        <div className="text-xs muted mb-1">Description</div>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </section>

                {error && <div className="card p-3 text-sm text-rose-600 border-rose-300 whitespace-pre-wrap">{error}</div>}

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={busy || !form.slug || !form.name}>
                        {busy ? 'Provisioning… (init + up + seed)' : 'Create & start'}
                    </Button>
                    <Link href="/admin/instances"><Button variant="ghost" type="button">Cancel</Button></Link>
                    <span className="text-xs muted">Runs <code>akd-mi init → up → seed</code>. May take a couple of minutes.</span>
                </div>
            </form>
        </>
    );
}

function FieldInput({ label, value, onChange, required, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; hint?: string }) {
    return (
        <label className="block">
            <span className="block text-xs muted mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {hint && <span className="text-[11px] muted mt-1 block">{hint}</span>}
        </label>
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
