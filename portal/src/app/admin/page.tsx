'use client';
import { useCallback, useEffect, useState } from 'react';

type Instance = {
    id: string;
    slug: string;
    name: string;
    category: string;
    description?: string | null;
    city?: string | null;
    country?: string | null;
    publicUrl?: string | null;
    apiUrl?: string | null;
    status: 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'ARCHIVED';
    isPublished: boolean;
    createdAt: string;
};

const TOKEN_KEY = 'akdmi:portal:adminToken';

export default function PortalAdminPage() {
    const [token, setToken] = useState<string>('');
    const [tokenInput, setTokenInput] = useState<string>('');
    const [items, setItems] = useState<Instance[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [creds, setCreds] = useState<{ slug: string; email: string; password: string } | null>(null);

    // Create form
    const [form, setForm] = useState({
        slug: '', name: '', category: 'SCHOOL',
        city: '', country: '', description: '', isPublished: false,
    });

    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) ?? '' : '';
        setToken(t);
        setTokenInput(t);
    }, []);

    const headers = useCallback((): HeadersInit => ({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }), [token]);

    const refresh = useCallback(async () => {
        if (!token) return;
        setError(null);
        try {
            const r = await fetch('/api/admin/instances', { headers: headers(), cache: 'no-store' });
            if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
            const j = await r.json();
            setItems(j.items ?? []);
        } catch (e: any) { setError(e.message); }
    }, [token, headers]);

    useEffect(() => { refresh(); }, [refresh]);

    function saveToken() {
        localStorage.setItem(TOKEN_KEY, tokenInput);
        setToken(tokenInput);
    }

    async function createInstance(e: React.FormEvent) {
        e.preventDefault();
        if (!form.slug || !form.name) { setError('slug and name are required'); return; }
        setBusy('create'); setError(null); setCreds(null);
        try {
            const r = await fetch('/api/admin/instances', {
                method: 'POST', headers: headers(),
                body: JSON.stringify(form),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            if (j.admin?.email && j.admin?.password) {
                setCreds({ slug: form.slug, email: j.admin.email, password: j.admin.password });
            }
            setForm({ slug: '', name: '', category: 'SCHOOL', city: '', country: '', description: '', isPublished: false });
            await refresh();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(null); }
    }

    async function action(slug: string, verb: 'up' | 'down' | 'destroy') {
        if (verb === 'destroy' && !confirm(`Destroy instance "${slug}"? This removes containers, volumes and the on-disk directory.`)) return;
        setBusy(`${verb}:${slug}`); setError(null);
        try {
            const r = await fetch(
                verb === 'destroy'
                    ? `/api/admin/instances/${slug}`
                    : `/api/admin/instances/${slug}/${verb}`,
                { method: verb === 'destroy' ? 'DELETE' : 'POST', headers: headers() },
            );
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            await refresh();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(null); }
    }

    async function togglePublish(inst: Instance) {
        setBusy(`pub:${inst.slug}`); setError(null);
        try {
            const r = await fetch(`/api/admin/instances/${inst.slug}`, {
                method: 'PATCH', headers: headers(),
                body: JSON.stringify({ isPublished: !inst.isPublished }),
            });
            if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
            await refresh();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(null); }
    }

    if (!token) {
        return (
            <main className="min-h-screen max-w-md mx-auto p-8">
                <h1 className="text-2xl font-bold mb-4">Portal admin</h1>
                <p className="opacity-70 mb-4 text-sm">Enter the value of <code>PORTAL_ADMIN_TOKEN</code> configured on the portal.</p>
                <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Bearer token"
                    className="w-full border border-current/20 rounded px-3 py-2"
                />
                <button onClick={saveToken} className="mt-3 px-4 py-2 rounded bg-black text-white">Sign in</button>
            </main>
        );
    }

    return (
        <main className="min-h-screen max-w-5xl mx-auto p-8 space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Instances</h1>
                <button
                    onClick={() => { localStorage.removeItem(TOKEN_KEY); setToken(''); setTokenInput(''); }}
                    className="text-sm opacity-60 underline"
                >Sign out</button>
            </header>

            {error && (
                <div className="border border-rose-400 bg-rose-50 text-rose-800 rounded p-3 text-sm whitespace-pre-wrap">{error}</div>
            )}

            {creds && (
                <div className="border border-emerald-400 bg-emerald-50 text-emerald-900 rounded p-4 text-sm space-y-1">
                    <div className="font-semibold">Instance <code>{creds.slug}</code> created. Save these credentials now:</div>
                    <div>Email: <code>{creds.email}</code></div>
                    <div>Password: <code>{creds.password}</code></div>
                    <button onClick={() => setCreds(null)} className="mt-2 text-xs underline">dismiss</button>
                </div>
            )}

            <section className="border border-current/15 rounded-lg p-5">
                <h2 className="font-semibold mb-3">Create a new instance</h2>
                <form onSubmit={createInstance} className="grid grid-cols-2 gap-3 text-sm">
                    <label className="col-span-1">
                        <span className="block text-xs opacity-70">Slug *</span>
                        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="paris-tech" className="w-full border border-current/20 rounded px-2 py-1.5" />
                    </label>
                    <label className="col-span-1">
                        <span className="block text-xs opacity-70">Name *</span>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Paris Tech Institute" className="w-full border border-current/20 rounded px-2 py-1.5" />
                    </label>
                    <label className="col-span-1">
                        <span className="block text-xs opacity-70">Category</span>
                        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-current/20 rounded px-2 py-1.5" />
                    </label>
                    <label className="col-span-1 flex items-end gap-2">
                        <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                        <span>Publish in public directory</span>
                    </label>
                    <label className="col-span-1">
                        <span className="block text-xs opacity-70">City</span>
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-current/20 rounded px-2 py-1.5" />
                    </label>
                    <label className="col-span-1">
                        <span className="block text-xs opacity-70">Country</span>
                        <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full border border-current/20 rounded px-2 py-1.5" />
                    </label>
                    <label className="col-span-2">
                        <span className="block text-xs opacity-70">Description</span>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-current/20 rounded px-2 py-1.5" rows={2} />
                    </label>
                    <div className="col-span-2">
                        <button type="submit" disabled={busy === 'create'} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
                            {busy === 'create' ? 'Provisioning… (init + up + seed)' : 'Create & start'}
                        </button>
                        <span className="ml-3 text-xs opacity-60">Runs <code>akd-mi init</code> → <code>up</code> → <code>seed</code>. May take a couple of minutes.</span>
                    </div>
                </form>
            </section>

            <section>
                <h2 className="font-semibold mb-3">All instances</h2>
                {items.length === 0 ? (
                    <p className="opacity-60 text-sm">No instances yet.</p>
                ) : (
                    <table className="w-full text-sm border border-current/15 rounded overflow-hidden">
                        <thead className="bg-current/5">
                            <tr>
                                <th className="text-left px-3 py-2">Slug</th>
                                <th className="text-left px-3 py-2">Name</th>
                                <th className="text-left px-3 py-2">Status</th>
                                <th className="text-left px-3 py-2">URL</th>
                                <th className="text-left px-3 py-2">Published</th>
                                <th className="text-right px-3 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr key={i.id} className="border-t border-current/10">
                                    <td className="px-3 py-2"><code>{i.slug}</code></td>
                                    <td className="px-3 py-2">{i.name}</td>
                                    <td className="px-3 py-2">{i.status}</td>
                                    <td className="px-3 py-2">
                                        {i.publicUrl
                                            ? <a href={i.publicUrl} target="_blank" rel="noreferrer" className="underline">{i.publicUrl}</a>
                                            : <span className="opacity-50">—</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => togglePublish(i)} disabled={busy === `pub:${i.slug}`} className="text-xs underline">
                                            {i.isPublished ? 'yes' : 'no'}
                                        </button>
                                    </td>
                                    <td className="px-3 py-2 text-right space-x-2">
                                        <button onClick={() => action(i.slug, 'up')}      disabled={!!busy} className="px-2 py-1 rounded border border-current/20">{busy === `up:${i.slug}` ? '…' : 'Up'}</button>
                                        <button onClick={() => action(i.slug, 'down')}    disabled={!!busy} className="px-2 py-1 rounded border border-current/20">{busy === `down:${i.slug}` ? '…' : 'Down'}</button>
                                        <button onClick={() => action(i.slug, 'destroy')} disabled={!!busy} className="px-2 py-1 rounded border border-rose-400 text-rose-700">{busy === `destroy:${i.slug}` ? '…' : 'Destroy'}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}
