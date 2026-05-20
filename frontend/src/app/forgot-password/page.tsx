'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await api.post('/auth/forgot-password', { email });
            setDone(true);
        } catch (e: any) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    return (
        <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 px-4">
            <div className="w-full max-w-md bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-xl p-8">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400 hover:text-brand-700 mb-4">
                    <ArrowLeft className="size-4" /> Back to sign in
                </Link>

                <div className="size-12 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 grid place-items-center mb-3">
                    <KeyRound className="size-6" />
                </div>
                <h1 className="text-2xl font-bold">Request a password reset</h1>
                <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                    Enter your email and an administrator will issue you a new password.
                </p>

                {done ? (
                    <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 flex gap-3">
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-emerald-800 dark:text-emerald-200">
                            Your request has been recorded. An administrator will review it and provide your new password directly — please contact them to receive it.
                        </div>
                    </div>
                ) : (
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Email</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 transition"
                            />
                        </label>

                        {error && (
                            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 bg-grad-brand text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 disabled:opacity-60 transition"
                        >
                            {loading ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : 'Send request'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
