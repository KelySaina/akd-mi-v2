import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { listActiveCategories } from '@/lib/categories';
import { DirectoryClient, type PublicInstance, type CategoryItem } from '@/components/DirectoryClient';
import {
    Rocket, ShieldCheck, Layers, Cloud, BarChart3, Users, Workflow,
    Mail, ArrowRight, Check, Server,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicDirectory() {
    const [instances, categories] = await Promise.all([
        prisma.instance.findMany({
            where: { isPublished: true, status: { in: ['RUNNING'] } },
            orderBy: { name: 'asc' },
            take: 200,
            select: {
                id: true, slug: true, name: true, category: true,
                description: true, city: true, country: true,
                logoUrl: true, publicUrl: true,
            },
        }).catch(() => [] as PublicInstance[]),
        listActiveCategories().catch(() => [] as CategoryItem[]),
    ]);

    return (
        <div className="min-h-screen">
            {/* ── Public top bar ───────────────────────────────────────── */}
            <header className="border-b border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 font-semibold">
                        <span className="size-7 rounded-lg gradient-brand grid place-items-center text-white text-xs font-bold">AK</span>
                        AKD-MI
                    </Link>
                    <nav className="flex items-center gap-1 text-sm">
                        <a href="#directory" className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg muted hover:text-[var(--ink)]">Search</a>
                        <a href="#features" className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg muted hover:text-[var(--ink)]">Platform</a>
                        <a href="#how" className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg muted hover:text-[var(--ink)]">How it works</a>
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-1 h-9 px-4 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-medium hover:brightness-110"
                        >
                            For institutions <ArrowRight className="size-3.5" />
                        </a>
                    </nav>
                </div>
            </header>

            <main>
                <section id="directory">
                    <DirectoryClient instances={instances as PublicInstance[]} categories={categories} />
                </section>

                <FeaturesSection />
                <HowItWorksSection />
                <UseCasesSection />
                <CTASection />
            </main>

            <footer className="border-t border-[var(--border)] mt-2">
                <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                    <div>
                        <div className="inline-flex items-center gap-2 font-semibold">
                            <span className="size-7 rounded-lg gradient-brand grid place-items-center text-white text-xs font-bold">AK</span>
                            AKD-MI
                        </div>
                        <p className="muted mt-2 max-w-xs">
                            A modern, multi-tenant platform empowering schools, universities, and training centres.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Explore</h4>
                        <ul className="space-y-1.5 muted">
                            <li><a href="#directory" className="hover:text-[var(--ink)]">Search</a></li>
                            <li><a href="#features" className="hover:text-[var(--ink)]">Platform features</a></li>
                            <li><a href="#how" className="hover:text-[var(--ink)]">How it works</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">For institutions</h4>
                        <ul className="space-y-1.5 muted">
                            <li><a href="#contact" className="hover:text-[var(--ink)]">Request a demo</a></li>
                            <li><a href="mailto:hello@akd-mi.com" className="hover:text-[var(--ink)]">hello@akd-mi.com</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-[var(--border)]">
                    <div className="max-w-6xl mx-auto px-6 py-4 text-xs muted flex flex-wrap items-center justify-between gap-2">
                        <p>© {new Date().getFullYear()} AKD-MI Platform. All rights reserved.</p>
                        <p>Built for modern education.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketing sections
// ─────────────────────────────────────────────────────────────────────────────

function FeaturesSection() {
    const features = [
        { icon: Layers, title: 'Modular by design',
          body: 'Enable only what you need — courses, students, grades, schedules, finance — and grow as your institution does.' },
        { icon: ShieldCheck, title: 'Secure & isolated',
          body: 'Each institution runs in its own isolated environment with dedicated database, storage and credentials.' },
        { icon: Cloud, title: 'Cloud or on-premise',
          body: 'Deploy on our cloud or self-host on your own infrastructure with the same one-command provisioning.' },
        { icon: BarChart3, title: 'Actionable insights',
          body: 'Real-time dashboards on enrolment, performance and operational health, built in from day one.' },
        { icon: Users, title: 'Multi-role access',
          body: 'Tailored experiences for admins, teachers, students, parents and partner organisations.' },
        { icon: Workflow, title: 'Built to integrate',
          body: 'Open APIs, webhooks and standards-based auth make AKD-MI play nicely with the tools you already use.' },
    ];
    return (
        <section id="features" className="border-t border-[var(--border)] bg-[var(--panel)]/40">
            <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
                        Platform
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                        Everything an institution needs, in one place
                    </h2>
                    <p className="mt-3 muted">
                        AKD-MI brings academic, administrative and operational workflows together so your team can
                        focus on what actually matters — teaching and learning.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f) => (
                        <div key={f.title} className="card p-5">
                            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 grid place-items-center">
                                <f.icon className="size-5" />
                            </div>
                            <h3 className="mt-4 font-semibold">{f.title}</h3>
                            <p className="mt-1.5 text-sm muted">{f.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorksSection() {
    const steps = [
        { n: 1, title: 'Tell us about your institution',
          body: 'A short conversation about your size, modules and timeline. No commitment.' },
        { n: 2, title: 'We provision your space',
          body: 'Your dedicated instance is created and configured in minutes — branded, isolated, ready to go.' },
        { n: 3, title: 'Onboard your team',
          body: 'Import your data, invite staff and students. Our team is by your side throughout.' },
        { n: 4, title: 'Go live',
          body: 'Your institution joins the directory. Iterate, scale and stay supported as you grow.' },
    ];
    return (
        <section id="how" className="border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 text-xs font-medium">
                        How it works
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                        From conversation to launch in days, not months
                    </h2>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {steps.map((s) => (
                        <div key={s.n} className="card p-5 relative overflow-hidden">
                            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500/30 to-violet-500/30">
                                {String(s.n).padStart(2, '0')}
                            </div>
                            <h3 className="mt-2 font-semibold">{s.title}</h3>
                            <p className="mt-1.5 text-sm muted">{s.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function UseCasesSection() {
    const items = [
        { icon: Server, title: 'Schools & K-12',
          points: ['Enrolment & attendance', 'Grades & transcripts', 'Parent portal'] },
        { icon: Rocket, title: 'Universities',
          points: ['Course catalog', 'Faculty workflows', 'Research projects'] },
        { icon: Users, title: 'Training centres',
          points: ['Cohort management', 'Skills tracking', 'Certifications'] },
    ];
    return (
        <section className="border-t border-[var(--border)] bg-[var(--panel)]/40">
            <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
                        Built for every kind of institution
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                        One platform, many institutions
                    </h2>
                </div>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {items.map((it) => (
                        <div key={it.title} className="card p-5">
                            <div className="size-10 rounded-xl gradient-brand text-white grid place-items-center">
                                <it.icon className="size-5" />
                            </div>
                            <h3 className="mt-4 font-semibold">{it.title}</h3>
                            <ul className="mt-3 space-y-1.5 text-sm">
                                {it.points.map((p) => (
                                    <li key={p} className="flex items-start gap-2">
                                        <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="muted">{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTASection() {
    return (
        <section id="contact" className="border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 sm:p-12 text-white">
                    <div className="absolute inset-0 [background-image:radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
                    <div className="relative max-w-2xl">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Ready to join the AKD-MI directory?
                        </h2>
                        <p className="mt-3 text-white/90">
                            Tell us about your institution and we&apos;ll set up a personalised demo. Most institutions are
                            up and running within a week.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <a
                                href="mailto:hello@akd-mi.com?subject=AKD-MI%20-%20Institution%20enquiry"
                                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white text-indigo-700 font-medium hover:brightness-95"
                            >
                                <Mail className="size-4" /> Get in touch
                            </a>
                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10"
                            >
                                See what&apos;s included
                            </a>
                        </div>
                        <p className="mt-4 text-xs text-white/70">
                            No credit card required · Free to discuss · Cloud or on-premise
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
