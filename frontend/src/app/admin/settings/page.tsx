import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import {
    Building2, Layers, Palette, Bell, Shield, KeyRound, Plug, ArrowRight,
} from 'lucide-react';

type Card = {
    href: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string; // tailwind gradient classes
    disabled?: boolean;
};

const cards: Card[] = [
    {
        href: '/admin/institution',
        title: 'Institution',
        description: 'Identity, addresses, contact channels, branding and legal info.',
        icon: Building2,
        accent: 'from-brand-500 to-cyan-500',
    },
    {
        href: '/admin/site',
        title: 'Site builder',
        description: 'Choose your public landing page template and preview live changes.',
        icon: Palette,
        accent: 'from-fuchsia-500 to-rose-500',
    },
    {
        href: '/admin/modules',
        title: 'Modules',
        description: 'Activate or deactivate modules available on your instance.',
        icon: Layers,
        accent: 'from-amber-500 to-orange-600',
    },
    {
        href: '#',
        title: 'Security',
        description: 'Sessions, password policy and two-factor authentication.',
        icon: Shield,
        accent: 'from-emerald-500 to-teal-600',
        disabled: true,
    },
    {
        href: '#',
        title: 'API keys',
        description: 'Manage tokens used by integrations and automated clients.',
        icon: KeyRound,
        accent: 'from-violet-500 to-indigo-600',
        disabled: true,
    },
    {
        href: '#',
        title: 'Notifications',
        description: 'Email senders, templates and digest preferences.',
        icon: Bell,
        accent: 'from-pink-500 to-rose-600',
        disabled: true,
    },
    {
        href: '#',
        title: 'Integrations',
        description: 'Connect external services like SSO, storage or analytics.',
        icon: Plug,
        accent: 'from-sky-500 to-blue-600',
        disabled: true,
    },
];

export default function SettingsHubPage() {
    return (
        <>
            <Topbar title="Settings" />
            <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto">
                <div className="mb-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Configure your instance, branding and integrations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        const Inner = (
                            <div className={`group relative h-full rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 transition ${c.disabled ? 'opacity-60' : 'hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-lg hover:-translate-y-0.5'}`}>
                                <div className={`size-10 rounded-xl bg-gradient-to-br ${c.accent} grid place-items-center text-white shadow-md shadow-brand-500/20`}>
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="mt-4 font-semibold flex items-center gap-2">
                                    {c.title}
                                    {c.disabled && (
                                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500">Soon</span>
                                    )}
                                </h3>
                                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{c.description}</p>
                                {!c.disabled && (
                                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                                        Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                                    </div>
                                )}
                            </div>
                        );
                        if (c.disabled) {
                            return <div key={c.title}>{Inner}</div>;
                        }
                        return (
                            <Link key={c.title} href={c.href} className="block">
                                {Inner}
                            </Link>
                        );
                    })}
                </div>
            </main>
        </>
    );
}
