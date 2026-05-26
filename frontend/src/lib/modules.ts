'use client';
import { useEffect, useState } from 'react';
import { api } from './api';
import { getToken } from './auth';

/**
 * Hook returning which feature modules are enabled for the current institution.
 *
 * Semantic: a module is **enabled by default**. It is only considered disabled
 * when the DB contains an explicit row with `enabled=false`. This way fresh
 * institutions work out-of-the-box and the sidebar is never empty.
 */
export type ModulesState = {
    ready: boolean;
    /** Returns true if a module is enabled (or if no explicit row exists). */
    isEnabled: (key: string | undefined | null) => boolean;
    /** Reload from server (e.g. after toggling on the Modules page). */
    refresh: () => void;
};

type ModuleRow = { moduleKey: string; enabled: boolean };

const CACHE_KEY = 'akdmi:enabledModules';
const REFRESH_EVENT = 'akdmi:modules:refresh';

function readCache(): Record<string, boolean> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? (JSON.parse(raw) as Record<string, boolean>) : null;
    } catch { return null; }
}

function writeCache(map: Record<string, boolean>) {
    if (typeof window === 'undefined') return;
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

/** Notify all mounted `useEnabledModules` hooks to refetch. */
export function refreshEnabledModules() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function useEnabledModules(): ModulesState {
    const [map, setMap] = useState<Record<string, boolean>>(() => readCache() ?? {});
    const [ready, setReady] = useState<boolean>(() => readCache() != null);

    function load() {
        if (typeof window === 'undefined') return;
        if (!getToken()) { setReady(true); return; }
        api.get<{ items: ModuleRow[] }>('/modules')
            .then((res) => {
                const next: Record<string, boolean> = {};
                for (const row of res.items ?? []) next[row.moduleKey] = row.enabled;
                setMap(next);
                writeCache(next);
            })
            .catch(() => { /* keep cache / defaults */ })
            .finally(() => setReady(true));
    }

    useEffect(() => {
        load();
        const handler = () => load();
        window.addEventListener(REFRESH_EVENT, handler);
        return () => window.removeEventListener(REFRESH_EVENT, handler);
    }, []);

    return {
        ready,
        refresh: load,
        isEnabled: (key) => {
            if (!key) return true;            // untagged items are always shown
            const v = map[key];
            return v === undefined ? true : v; // default = enabled
        },
    };
}
