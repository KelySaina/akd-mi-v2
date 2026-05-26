'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { signIn, getToken, isSafeReturnTo, homeForRole, getStoredUser } from '@/lib/auth';
import { templateBrand } from '@/lib/templateBrand';

export type LoginStats = {
  students: number;
  teachers: number;
  courses: number;
  documents: number;
};

export function LoginForm({ name, template, stats }: { name: string; template: string; stats: LoginStats | null }) {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-ink-500"><Loader2 className="size-5 animate-spin" /></div>}>
      <LoginInner name={name} template={template} stats={stats} />
    </Suspense>
  );
}

function LoginInner({ name, template, stats }: { name: string; template: string; stats: LoginStats | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const rawReturn = params.get('returnTo');
  const returnTo = isSafeReturnTo(rawReturn) ? rawReturn : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const brand = templateBrand(template);
  const BrandIcon = brand.icon;

  // If already signed in, skip login
  useEffect(() => {
    if (getToken()) {
      const u = getStoredUser();
      router.replace(returnTo ?? homeForRole(u?.role));
    }
  }, [router, returnTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, rememberMe: remember });
      signIn(res.accessToken, res.user, remember);
      router.replace(returnTo ?? homeForRole(res.user?.role));
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* left: form */}
      <div className="flex flex-col justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-8 sm:py-12 bg-white dark:bg-ink-900">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold mb-8 sm:mb-12">
          <div className="size-9 rounded-xl bg-grad-brand grid place-items-center text-white shadow-lg shadow-brand-500/30">
            <BrandIcon className="size-5" />
          </div>
          <span className="truncate">{name}</span>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm sm:text-base text-ink-500">Sign in to continue to your dashboard.</p>

          <form onSubmit={onSubmit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
            <Field label="Email" icon={<Mail className="size-4" />}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent outline-none placeholder:text-ink-400"
                autoComplete="email"
              />
            </Field>

            <Field label="Password" icon={<Lock className="size-4" />}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none placeholder:text-ink-400"
                autoComplete="current-password"
              />
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-ink-700 dark:text-ink-300">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-brand-700 font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-grad-brand text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-[0.99] transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* right: art */}
      <div className="hidden lg:block relative bg-mesh text-white p-8 xl:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="relative h-full flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Instance ready
            </div>
            <h2 className="mt-6 text-3xl xl:text-4xl font-bold tracking-tight leading-tight max-w-md">
              {brand.tagline}
            </h2>
            <p className="mt-4 text-white/70 max-w-md">
              {brand.subTagline}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              [brand.learnersLabel, stats?.students],
              ['Active courses',    stats?.courses],
              ['Teachers',          stats?.teachers],
              ['Documents',         stats?.documents],
            ].map(([k, v]) => (
              <div key={k as string} className="glass rounded-xl p-4">
                <div className="text-xl xl:text-2xl font-bold">{formatCount(v as number | undefined)}</div>
                <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 border border-ink-200 dark:border-ink-700 rounded-xl px-3 py-2.5 bg-white dark:bg-ink-800 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 dark:focus-within:ring-brand-500/30 transition">
        <span className="text-ink-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

/** Compact-format a count: 1234 -> "1.2k", 12345 -> "12k", 1234567 -> "1.2M". Falls back to "\u2014" when unavailable. */
function formatCount(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '\u2014';
  if (n < 1000) return n.toLocaleString();
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (n < 1_000_000) return Math.round(n / 1000) + 'k';
  if (n < 10_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  return Math.round(n / 1_000_000) + 'M';
}
