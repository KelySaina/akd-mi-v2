'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';

/**
 * Mobile-only top bar + slide-in drawer that wraps an arbitrary sidebar body.
 * The drawer is shown only at `<lg`; on `lg+` it's invisible.
 * Pair it with a `hidden lg:flex` desktop aside in the same component.
 */
export function MobileSidebarShell({
    accent = 'brand',
    title,
    subtitle,
    children,
}: {
    accent?: 'brand' | 'amber';
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const ringCls = accent === 'amber'
        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
        : 'bg-grad-brand';

    return (
        <div className="lg:hidden">
            {/* sticky topbar */}
            <div className="sticky top-0 z-30 flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-sm">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center justify-center size-10 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-700 transition shadow-sm"
                    aria-label="Open menu"
                    aria-expanded={open}
                    aria-controls="role-mobile-drawer"
                >
                    <Menu className="size-5" strokeWidth={2.25} />
                </button>
                <div className={`size-9 rounded-xl grid place-items-center text-white shadow-lg shadow-brand-500/30 ${ringCls} shrink-0`}>
                    <GraduationCap className="size-5" />
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight truncate">{title}</div>
                    <div className="text-[11px] text-ink-500 dark:text-ink-400 truncate">{subtitle}</div>
                </div>
            </div>

            {/* drawer */}
            {open && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        id="role-mobile-drawer"
                        role="dialog"
                        aria-modal="true"
                        className="absolute top-0 left-0 h-full w-[82%] max-w-xs bg-white dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 dark:border-ink-800">
                            <span className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400">Navigation</span>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 dark:text-ink-400"
                                aria-label="Close menu"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div onClick={(e) => {
                            // close drawer when a nav link is clicked
                            const t = e.target as HTMLElement;
                            if (t.closest('a')) setOpen(false);
                        }} className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
