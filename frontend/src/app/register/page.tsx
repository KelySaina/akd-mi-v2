'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, User, Phone, IdCard, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-ink-500"><Loader2 className="size-5 animate-spin" /></div>}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    studentNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const name = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        studentNumber: form.studentNumber.trim() || undefined,
      });
      setDone(true);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('EmailAlreadyRegistered') || /409/.test(msg)) {
        setError('That email address is already registered. Try signing in instead.');
      } else {
        setError(msg || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen grid place-items-center px-5 py-10 bg-white dark:bg-ink-900">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto size-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 grid place-items-center">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Request received</h1>
          <p className="mt-3 text-ink-500">
            Thanks for signing up to <span className="font-medium">{name}</span>. An administrator will review
            your account shortly — you&apos;ll be able to sign in once it&apos;s approved.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-grad-brand text-white font-medium shadow-lg shadow-brand-500/30"
          >
            Back to sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* left: form */}
      <div className="flex flex-col justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-8 sm:py-12 bg-white dark:bg-ink-900">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold mb-8 sm:mb-12">
          <div className="size-9 rounded-xl bg-grad-brand grid place-items-center text-white shadow-lg shadow-brand-500/30">
            <GraduationCap className="size-5" />
          </div>
          <span className="truncate">{name}</span>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create your student account</h1>
          <p className="mt-2 text-sm sm:text-base text-ink-500">
            Submit a request to join {name}. An administrator will approve your account before you can sign in.
          </p>

          <form onSubmit={onSubmit} className="mt-6 sm:mt-8 space-y-4">
            <Field label="Full name" icon={<User className="size-4" />}>
              <input
                type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe" autoComplete="name"
                className="w-full bg-transparent outline-none placeholder:text-ink-400"
              />
            </Field>

            <Field label="Email" icon={<Mail className="size-4" />}>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" autoComplete="email"
                className="w-full bg-transparent outline-none placeholder:text-ink-400"
              />
            </Field>

            <Field label="Phone (optional)" icon={<Phone className="size-4" />}>
              <input
                type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 0123" autoComplete="tel"
                className="w-full bg-transparent outline-none placeholder:text-ink-400"
              />
            </Field>

            <Field label="Student number (if known)" icon={<IdCard className="size-4" />}>
              <input
                type="text" value={form.studentNumber}
                onChange={(e) => setForm({ ...form, studentNumber: e.target.value })}
                placeholder="Leave blank to receive one"
                className="w-full bg-transparent outline-none placeholder:text-ink-400"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Password" icon={<Lock className="size-4" />}>
                <input
                  type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 chars" autoComplete="new-password"
                  className="w-full bg-transparent outline-none placeholder:text-ink-400"
                />
              </Field>
              <Field label="Confirm" icon={<Lock className="size-4" />}>
                <input
                  type="password" required value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat password" autoComplete="new-password"
                  className="w-full bg-transparent outline-none placeholder:text-ink-400"
                />
              </Field>
            </div>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-grad-brand text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-[0.99] transition disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="size-4 animate-spin" /> Creating…</>) : (<>Create account <ArrowRight className="size-4" /></>)}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* right: art */}
      <div className="hidden lg:block relative bg-mesh text-white p-8 xl:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="relative h-full flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Join {name}
            </div>
            <h2 className="mt-6 text-3xl xl:text-4xl font-bold tracking-tight leading-tight max-w-md">
              Start your journey at {name}.
            </h2>
            <p className="mt-4 text-white/70 max-w-md">
              Create an account and we&apos;ll get you set up. An administrator will activate your access once
              your request is reviewed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Bullet label="Personal dashboard" />
            <Bullet label="Course catalog" />
            <Bullet label="Grades & transcripts" />
            <Bullet label="Notifications" />
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

function Bullet({ label }: { label: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}
