'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

type Props = { hasGallery: boolean };

const LINKS: { href: string; label: string; key: 'about' | 'contact' | 'gallery' }[] = [
    { href: '#about',   label: 'About',   key: 'about' },
    { href: '#contact', label: 'Contact', key: 'contact' },
    { href: '#gallery', label: 'Gallery', key: 'gallery' },
];

export default function LandingNav({ hasGallery }: Props) {
    const [open, setOpen] = useState(false);

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

            {/* mobile sheet */}
            {open && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        id="landing-mobile-menu"
                        role="dialog"
                        aria-modal="true"
                        className="absolute top-0 right-0 h-full w-[82%] max-w-sm bg-ink-900/95 border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <span className="text-sm uppercase tracking-wider text-white/60">Menu</span>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white"
                                aria-label="Close menu"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <nav className="flex-1 px-3 py-4 space-y-1">
                            {links.map((l) => (
                                <a
                                    key={l.key}
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition"
                                >
                                    {l.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
