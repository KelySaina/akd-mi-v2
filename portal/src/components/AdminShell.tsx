'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Server, Globe2, LogOut, Plus, ListChecks } from 'lucide-react';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/instances', label: 'Instances', icon: Server },
    { href: '/admin/instances/new', label: 'New instance', icon: Plus },
    { href: '/admin/jobs', label: 'Jobs', icon: ListChecks },
    { href: '/', label: 'Public directory', icon: Globe2, exact: true },
];

/** Score a nav entry against the current pathname; -1 means "no match",
 *  otherwise return href.length so the longest-matching entry wins. This
 *  prevents `/admin/instances` from highlighting while on `/admin/instances/new`
 *  or `/admin/instances/[slug]`, and keeps `/` from matching every route. */
function navMatchScore(href: string, exact: boolean, pathname: string): number {
    if (exact) return pathname === href ? href.length : -1;
    if (pathname === href || pathname.startsWith(href + '/')) return href.length;
    return -1;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    async function logout() {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.replace('/admin/login');
        router.refresh();
    }
    const scores = NAV.map((n) => navMatchScore(n.href, !!n.exact, pathname));
    const bestScore = Math.max(...scores);
    const activeIdx = bestScore >= 0 ? scores.indexOf(bestScore) : -1;
    return (
        <div className="min-h-screen flex">
            <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--border)] bg-[var(--panel)]">
                <div className="px-5 py-5 flex items-center gap-3">
                    <div className="size-9 rounded-xl gradient-brand grid place-items-center text-white font-bold">A</div>
                    <div>
                        <div className="font-semibold leading-none">AKD-MI</div>
                        <div className="text-[11px] muted">Portal admin</div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-2 space-y-1">
                    {NAV.map((n, i) => {
                        const active = i === activeIdx;
                        const Icon = n.icon;
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={[
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                                    active
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-medium'
                                        : 'muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--ink)]',
                                ].join(' ')}
                            >
                                <Icon className="size-4" />
                                <span>{n.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-3 border-t border-[var(--border)]">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm muted hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600"
                    >
                        <LogOut className="size-4" /> Sign out
                    </button>
                </div>
            </aside>
            <main className="flex-1 min-w-0">{children}</main>
        </div>
    );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <header className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur border-b border-[var(--border)] px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-xl font-semibold truncate">{title}</h1>
                {subtitle && <div className="text-xs muted truncate">{subtitle}</div>}
            </div>
            {action}
        </header>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        RUNNING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        STOPPED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        PROVISIONING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
        ERROR: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
        ARCHIVED: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
    };
    const cls = map[status] ?? 'bg-slate-100 text-slate-600';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>{status}</span>;
}

export function Button({
    children, variant = 'primary', size = 'md', ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline'; size?: 'sm' | 'md' }) {
    const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
    const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-2 text-sm' };
    const variants = {
        primary: 'gradient-brand text-white hover:opacity-90',
        ghost:   'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5',
        danger:  'bg-rose-600 text-white hover:bg-rose-700',
        outline: 'border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5',
    };
    return <button className={`${base} ${sizes[size]} ${variants[variant]}`} {...rest}>{children}</button>;
}
