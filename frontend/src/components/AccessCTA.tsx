'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { type AuthUser, getStoredUser, getToken, homeForRole, signOut } from '@/lib/auth';

type Variant = 'hero' | 'nav';

/**
 * Role-aware access call-to-action.
 * - Not signed-in → "Sign in" → /login
 * - Signed-in    → "Go to your space" → /admin | /student | /teacher
 *
 * Renders a stable skeleton during SSR / first paint so server and client
 * markup match before localStorage is read.
 */
export default function AccessCTA({ variant = 'hero' }: { variant?: Variant }) {
    const [user, setUser]     = useState<AuthUser | null>(null);
    const [ready, setReady]   = useState(false);

    useEffect(() => {
        const refresh = () => {
            const u = getStoredUser();
            setUser(getToken() ? u : null);
        };
        refresh();
        setReady(true);
        window.addEventListener('akdmi:auth', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('akdmi:auth', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    if (variant === 'nav') {
        if (!ready) {
            return <span className="inline-block h-9 w-20 sm:w-24 rounded-lg bg-white/10 animate-pulse" />;
        }
        if (user) {
            return (
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                        href={homeForRole(user.role)}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-ink-900 font-medium text-xs sm:text-sm hover:bg-white/90 transition shadow-lg"
                    >
                        <LayoutDashboard className="size-4" />
                        <span className="hidden xs:inline sm:inline">My space</span>
                    </Link>
                    <button
                        type="button"
                        onClick={signOut}
                        className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                        title="Sign out"
                        aria-label="Sign out"
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            );
        }
        return (
            <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-ink-900 font-medium text-xs sm:text-sm hover:bg-white/90 transition shadow-lg"
            >
                <LogIn className="size-4" />
                Sign in
            </Link>
        );
    }

    // hero variant
    if (!ready) {
        return <span className="inline-block h-10 sm:h-12 w-40 sm:w-56 rounded-xl bg-white/10 animate-pulse" />;
    }
    if (user) {
        return (
            <Link
                href={homeForRole(user.role)}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-grad-brand font-semibold shadow-xl shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.99] transition text-xs sm:text-base"
            >
                <LayoutDashboard className="size-4" />
                <span className="hidden xs:inline">Go to your space</span><span className="xs:hidden">My space</span>
                <ArrowRight className="size-4" />
            </Link>
        );
    }
    return (
        <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-grad-brand font-semibold shadow-xl shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.99] transition text-xs sm:text-base"
        >
            <LogIn className="size-4" />
            <span className="hidden xs:inline">Sign in to your space</span><span className="xs:hidden">Sign in</span>
            <ArrowRight className="size-4" />
        </Link>
    );
}
