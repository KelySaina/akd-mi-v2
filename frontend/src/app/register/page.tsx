'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    GraduationCap, Mail, User, Phone, ArrowRight, Loader2,
    CheckCircle2, Sparkles, Heart, BookOpen, Compass, PartyPopper, Quote,
    Users, ShieldCheck, Send,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen grid place-items-center text-ink-500"><Loader2 className="size-5 animate-spin" /></div>}>
            <RegisterInner />
        </Suspense>
    );
}

const STORIES = [
    { quote: "I walked in shy and left with a family. Best decision I ever made.", who: "Amina, class of 2024" },
    { quote: "Professors actually know my name. That changes everything.",        who: "Léo, second year" },
    { quote: "The community here pushed me to dream bigger.",                     who: "Priya, alumni" },
    { quote: "From day one it felt like coming home.",                            who: "Marcus, first year" },
];

function RegisterInner() {
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [story, setStory] = useState(0);

    const name = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';

    useEffect(() => {
        const t = setInterval(() => setStory((s) => (s + 1) % STORIES.length), 5500);
        return () => clearInterval(t);
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await api.post('/auth/register', {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
            });
            setDone(true);
        } catch (err: any) {
            const msg = err?.message ?? '';
            if (msg.includes('EmailAlreadyRegistered') || /409/.test(msg)) {
                setError('That email is already on file. Try signing in instead — or use a different address.');
            } else {
                setError(msg || 'Something went wrong. Please try again.');
            }
        } finally { setLoading(false); }
    }

    if (done) {
        return (
            <main className="min-h-screen relative overflow-hidden bg-white dark:bg-ink-900">
                <BackdropArt />
                <div className="relative min-h-screen grid place-items-center px-5 py-12">
                    <div className="max-w-lg w-full text-center">
                        <div className="mx-auto size-20 rounded-3xl bg-grad-brand text-white grid place-items-center shadow-2xl shadow-brand-500/40 rotate-3">
                            <PartyPopper className="size-9" />
                        </div>
                        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                            <Sparkles className="size-3.5" /> You&apos;re almost in
                        </div>
                        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                            Welcome to <span className="text-brand-700 dark:text-brand-300">{name}</span>.
                        </h1>
                        <p className="mt-4 text-ink-600 dark:text-ink-300 leading-relaxed">
                            Your request is in good hands. An administrator will review it and
                            send your sign-in details by email — usually within a day.
                        </p>

                        <div className="mt-8 rounded-2xl border border-ink-200 dark:border-ink-800 bg-white/70 dark:bg-ink-800/40 backdrop-blur p-5 text-left">
                            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">What happens next</div>
                            <ol className="space-y-3 text-sm">
                                <Step n={1} title="Request received" sub="We&apos;ve got everything we need." done />
                                <Step n={2} title="Administrator review" sub="A real person reads your request — no bots." />
                                <Step n={3} title="Welcome email" sub="You&apos;ll get your student number and sign-in link." />
                            </ol>
                        </div>

                        <Link
                            href="/"
                            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-grad-brand text-white font-semibold shadow-xl shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] transition"
                        >
                            Back to homepage <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen relative overflow-hidden bg-white dark:bg-ink-900">
            {/* Top nav */}
            <header className="relative z-20">
                <nav className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
                        <div className="size-9 rounded-xl bg-grad-brand grid place-items-center text-white shadow-lg shadow-brand-500/30">
                            <GraduationCap className="size-5" />
                        </div>
                        <span className="truncate">{name}</span>
                    </Link>
                    <Link href="/login" className="text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 inline-flex items-center gap-1">
                        Already a student? <span className="text-brand-700 dark:text-brand-300 font-semibold">Sign in →</span>
                    </Link>
                </nav>
            </header>

            {/* HERO */}
            <section className="relative">
                <HeroArt />
                <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-12 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur border border-ink-200/60 dark:border-white/10 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-sm">
                        <Heart className="size-3.5 fill-current text-rose-500" /> Welcome home
                    </div>
                    <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                        Your seat at <span className="bg-grad-brand bg-clip-text text-transparent">{name}</span><br className="hidden sm:block" />
                        <span className="text-ink-700 dark:text-ink-200">is waiting.</span>
                    </h1>
                    <p className="mt-5 max-w-2xl mx-auto text-lg text-ink-600 dark:text-ink-300 leading-relaxed">
                        Tell us who you are. We&apos;ll take care of the rest — an admin will set up
                        your student number and credentials, then send everything to your inbox.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs text-ink-500 dark:text-ink-400">
                        <Quick icon={<ShieldCheck className="size-3.5" />} label="Reviewed by a person" />
                        <span className="size-1 rounded-full bg-ink-300 dark:bg-ink-700" />
                        <Quick icon={<Send className="size-3.5" />} label="Reply within a day" />
                        <span className="hidden sm:inline size-1 rounded-full bg-ink-300 dark:bg-ink-700" />
                        <Quick icon={<Sparkles className="size-3.5" />} label="60-second form" />
                    </div>
                </div>
            </section>

            {/* FORM CARD */}
            <section className="relative px-5 sm:px-8 pb-16">
                <form
                    onSubmit={onSubmit}
                    className="relative max-w-2xl mx-auto rounded-3xl border border-ink-200/70 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-2xl shadow-brand-500/10 dark:shadow-black/40 overflow-hidden"
                >
                    {/* Card top accent */}
                    <div className="h-1.5 bg-grad-brand" />

                    <div className="p-6 sm:p-10">
                        <div className="flex items-start gap-3 mb-7">
                            <div className="size-10 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 grid place-items-center">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Let&apos;s get to know you</h2>
                                <p className="text-sm text-ink-500 dark:text-ink-400">Just three things — that&apos;s all we need.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Field label="Your name" icon={<User className="size-4" />}>
                                <input
                                    type="text" required value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="The name you go by"
                                    autoComplete="name"
                                    className="w-full bg-transparent outline-none placeholder:text-ink-400"
                                />
                            </Field>

                            <Field label="Email" icon={<Mail className="size-4" />}>
                                <input
                                    type="email" required value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className="w-full bg-transparent outline-none placeholder:text-ink-400"
                                />
                            </Field>

                            <Field label="Phone" hint="optional" icon={<Phone className="size-4" />}>
                                <input
                                    type="tel" value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="So we can reach you"
                                    autoComplete="tel"
                                    className="w-full bg-transparent outline-none placeholder:text-ink-400"
                                />
                            </Field>
                        </div>

                        {error && (
                            <div className="mt-4 text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl px-3.5 py-2.5">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-grad-brand text-white font-semibold py-4 rounded-2xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <><Loader2 className="size-4 animate-spin" /> Sending your request…</>
                            ) : (
                                <>Take my seat <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></>
                            )}
                        </button>

                        <p className="text-[11px] text-ink-400 text-center mt-3">
                            No password needed yet. Once an admin approves your request,
                            we&apos;ll email you everything you need to sign in.
                        </p>
                    </div>
                </form>
            </section>

            {/* STUDENT VOICES */}
            <section className="relative px-5 sm:px-8 pb-12">
                <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-4">
                    <Pillar icon={<BookOpen className="size-5" />} label="Learn"  sub="with mentors who care" />
                    <Pillar icon={<Heart className="size-5" />}    label="Belong" sub="from day one" />
                    <Pillar icon={<Compass className="size-5" />}  label="Grow"   sub="beyond the classroom" />
                </div>
            </section>

            <section className="relative px-5 sm:px-8 pb-20">
                <figure key={story} className="relative max-w-2xl mx-auto rounded-3xl bg-grad-brand text-white p-7 sm:p-10 shadow-2xl shadow-brand-500/25 overflow-hidden animate-[fadeIn_500ms_ease]">
                    <div className="absolute inset-0 [background-image:radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />
                    <Quote className="size-8 text-white/40" />
                    <blockquote className="mt-3 text-lg sm:text-xl font-medium leading-relaxed">
                        &ldquo;{STORIES[story].quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4 text-sm text-white/80">— {STORIES[story].who}</figcaption>
                </figure>
            </section>

            {/* FOOTER */}
            <footer className="relative px-5 sm:px-8 pb-10">
                <div className="max-w-4xl mx-auto text-center text-sm text-ink-500 dark:text-ink-400">
                    Made for students, by educators.{' '}
                    <Link href="/" className="text-brand-700 dark:text-brand-300 font-medium hover:underline">
                        ← Back to {name}
                    </Link>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes blob {
                    0%, 100% { transform: translate(0,0) scale(1); }
                    33%      { transform: translate(20px,-30px) scale(1.05); }
                    66%      { transform: translate(-15px,15px) scale(0.97); }
                }
            `}</style>
        </main>
    );
}

function Field({
    label, icon, children, hint,
}: { label: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
    return (
        <label className="block">
            <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-ink-700 dark:text-ink-200">{label}</span>
                {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
            </div>
            <div className="mt-1.5 flex items-center gap-2.5 border border-ink-200 dark:border-ink-700 rounded-2xl px-4 py-3.5 bg-white dark:bg-ink-800 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-200/60 dark:focus-within:ring-brand-500/20 transition">
                <span className="text-ink-400">{icon}</span>
                {children}
            </div>
        </label>
    );
}

function Quick({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="text-brand-600 dark:text-brand-400">{icon}</span> {label}
        </span>
    );
}

function Pillar({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
    return (
        <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 text-center hover:border-brand-300 dark:hover:border-brand-500/50 transition">
            <div className="mx-auto size-10 grid place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {icon}
            </div>
            <div className="mt-3 text-base font-semibold">{label}</div>
            <div className="text-xs text-ink-500 dark:text-ink-400">{sub}</div>
        </div>
    );
}

function Step({ n, title, sub, done }: { n: number; title: string; sub: string; done?: boolean }) {
    return (
        <li className="flex items-start gap-3">
            <span className={`shrink-0 size-7 rounded-full grid place-items-center text-xs font-bold ${done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'}`}>
                {done ? <CheckCircle2 className="size-4" /> : n}
            </span>
            <div>
                <div className="font-medium text-ink-800 dark:text-ink-100">{title}</div>
                <div className="text-xs text-ink-500 dark:text-ink-400">{sub}</div>
            </div>
        </li>
    );
}

function HeroArt() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 size-[34rem] rounded-full bg-brand-200/40 dark:bg-brand-500/10 blur-3xl" style={{ animation: 'blob 22s ease-in-out infinite' }} />
            <div className="absolute top-1/4 -left-24 size-[26rem] rounded-full bg-accent-400/30 dark:bg-accent-500/10 blur-3xl" style={{ animation: 'blob 28s ease-in-out infinite reverse' }} />
            <div className="absolute inset-0 [background-image:radial-gradient(var(--color-brand-200,#bfdbfe)_1px,transparent_1px)] [background-size:24px_24px] opacity-25 dark:opacity-[0.06]" />
        </div>
    );
}

function BackdropArt() {
    return (
        <>
            <div className="absolute inset-0 pointer-events-none [background-image:radial-gradient(var(--color-brand-100,#dbeafe)_1px,transparent_1px)] [background-size:22px_22px] opacity-30 dark:opacity-[0.08]" />
            <div className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-brand-200/40 dark:bg-brand-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-20 size-[24rem] rounded-full bg-accent-400/30 dark:bg-accent-500/10 blur-3xl pointer-events-none" />
        </>
    );
}
