'use client';

/**
 * Small dismissible banner shown to users who signed in WITHOUT ticking
 * "Remember me" on the login page. Their session is stored in sessionStorage
 * and will vanish on the next browser-restart; this banner offers a one-click
 * upgrade to a persistent session.
 *
 * Dismissal is kept in sessionStorage so it does not pop up again in the same
 * tab session, but reappears next time the user signs in without remember-me.
 */

import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { isRemembered, rememberCurrentSession } from '@/lib/auth';

const DISMISS_KEY = 'akdmi:remember-banner-dismissed';

export function RememberMeBanner() {
    // Render nothing on the server / first client paint to avoid a hydration
    // mismatch — we only know the storage state once mounted.
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let dismissed = false;
        try { dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
        if (!dismissed && !isRemembered()) setShow(true);
    }, []);

    if (!show) return null;

    function dismiss() {
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
        setShow(false);
    }

    function rememberNow() {
        rememberCurrentSession();
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
        setShow(false);
    }

    return (
        <div className="border-b border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
                <ShieldCheck className="size-4 shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                    You’re signed in for this session only. Want to stay signed in on this device?
                </span>
                <button
                    onClick={rememberNow}
                    className="shrink-0 px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                >
                    Remember me
                </button>
                <button
                    onClick={dismiss}
                    className="shrink-0 p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/60"
                    aria-label="Dismiss"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
