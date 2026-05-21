'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<main className="min-h-screen grid place-items-center muted text-sm">Loading…</main>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const [token, setToken] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const sp = useSearchParams();
    const returnTo = sp.get('returnTo') || '/admin';

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setError(null);
        try {
            const r = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j.error || 'Invalid token');
            }
            router.replace(returnTo);
            router.refresh();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    return (
        <main className="min-h-screen grid place-items-center px-4">
            <form onSubmit={submit} className="card p-8 w-full max-w-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl gradient-brand grid place-items-center text-white font-bold">A</div>
                    <div>
                        <div className="text-lg font-semibold">AKD-MI Portal</div>
                        <div className="text-xs muted">Platform administration</div>
                    </div>
                </div>
                <label className="block text-sm">
                    <span className="block muted text-xs mb-1">Admin token</span>
                    <input
                        autoFocus
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="paste PORTAL_ADMIN_TOKEN"
                        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </label>
                {error && <div className="text-sm text-rose-600">{error}</div>}
                <button
                    type="submit"
                    disabled={busy || !token}
                    className="w-full rounded-lg gradient-brand text-white py-2 font-medium disabled:opacity-50"
                >
                    {busy ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="text-xs muted">
                    The token is the value of <code>PORTAL_ADMIN_TOKEN</code> in the portal's <code>.env</code>.
                </p>
            </form>
        </main>
    );
}
