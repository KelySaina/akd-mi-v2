'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

type Props = { hasGallery: boolean };

const LINKS: { href: string; label: string; key: 'about' | 'contact' | 'gallery' }[] = [
    { href: '#about',   label: 'About',   key: 'about' },
    { href: '#contact', label: 'Contact', key: 'contact' },
    { href: '#gallery', label: 'Gallery', key: 'gallery' },
];

export default function LandingNav({ hasGallery }: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Lock scroll while the sheet is open and close on Escape
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

    const links = LINKS.filter((l) => l.key !== 'gallery' || hasGallery);

    const handleNav = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setOpen(false);
        // Wait one frame for scroll-lock cleanup before scrolling.
        requestAnimationFrame(() => {
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.location.hash = href;
        });
    };

    return (
        <>
            {/* desktop links */}
            <nav className="hidden lg:flex items-center gap-7 xl:gap-8 text-sm text-white/80">
                {links.map((l) => (
                    <a key={l.key} href={l.href} className="hover:text-white transition">{l.label}</a>
                ))}
            </nav>

            {/* mobile toggle */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="lg:hidden inline-flex items-center justify-center size-10 rounded-lg bg-white/15 border border-white/25 text-white hover:bg-white/25 active:scale-95 transition shadow-lg"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="landing-mobile-menu"
            >
                <Menu className="size-5" strokeWidth={2.25} />
            </button>

            {/* mobile sheet (top drawer) — portaled to body to escape header stacking context */}
            {open && mounted && createPortal(
                <div className="lg:hidden fixed inset-0 z-[100]">
                    <div
                        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        id="landing-mobile-menu"
                        role="dialog"
                        aria-modal="true"
                        className="absolute top-0 inset-x-0 max-h-[90vh] overflow-y-auto bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 shadow-2xl flex flex-col text-ink-900 dark:text-ink-100 animate-[slideDown_180ms_ease-out]"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 dark:border-ink-800">
                            <span className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400">Menu</span>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 dark:text-ink-400 transition"
                                aria-label="Close menu"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <nav className="px-3 py-3 space-y-1">
                            {links.map((l) => (
                                <a
                                    key={l.key}
                                    href={l.href}
                                    onClick={handleNav(l.href)}
                                    className="block px-4 py-3 rounded-lg text-base font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white transition"
                                >
                                    {l.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
