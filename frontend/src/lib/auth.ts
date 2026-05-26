'use client';
import { useEffect, useState } from 'react';
import { api } from './api';

export type Role = 'INSTANCE_ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT' | 'PLATFORM_ADMIN' | 'INSTITUTION_OWNER';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;          // primary role — drives landing page
  roles?: Role[];      // effective role set (primary ∪ extras). Newer backends include this.
  avatarUrl?: string | null;
};

/** Effective roles — falls back to [role] for older tokens. */
export function rolesOf(u: AuthUser | null | undefined): Role[] {
  if (!u) return [];
  if (u.roles && u.roles.length) return u.roles;
  return [u.role];
}

/** True if the user has any of the given roles in their effective set. */
export function hasRole(u: AuthUser | null | undefined, ...roles: Role[]): boolean {
  const set = rolesOf(u);
  return roles.some((r) => set.includes(r));
}

const AUTH_EVENT = 'akdmi:auth';

/* ───── Storage helpers (safe for SSR) ─────
 * "Remember me" controls WHICH store holds the access token + user object:
 *   - remembered  → localStorage (survives browser restart)
 *   - not         → sessionStorage (cleared when the tab/window closes)
 * Readers fall back from local→session so the rest of the app doesn't have to
 * know which one is active.
 */

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

function readBoth(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal !== null) return fromLocal;
  } catch { /* ignore */ }
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function clearBoth(key: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

export function getToken(): string | null {
  return readBoth(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = readBoth(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

/** True iff the current session is persisted across browser restarts. */
export function isRemembered(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(TOKEN_KEY) !== null; } catch { return false; }
}

export function signIn(token: string, user: AuthUser, remember: boolean = true) {
  if (typeof window === 'undefined') return;
  const store = remember ? localStorage : sessionStorage;
  // Make sure no stale copy lives in the other store.
  clearBoth(TOKEN_KEY);
  clearBoth(USER_KEY);
  try {
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* ignore quota errors */ }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Promote the current (session-only) login to a persistent one. No-op when
 *  the session is already remembered or when there is no live session. */
export function rememberCurrentSession(): void {
  if (typeof window === 'undefined') return;
  if (isRemembered()) return;
  let token: string | null = null;
  let user: string | null = null;
  try {
    token = sessionStorage.getItem(TOKEN_KEY);
    user = sessionStorage.getItem(USER_KEY);
  } catch { /* ignore */ }
  if (!token) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, user);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function signOut() {
  if (typeof window === 'undefined') return;
  clearBoth(TOKEN_KEY);
  clearBoth(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
  // Hard reload so any in-memory state is dropped
  window.location.href = '/login';
}

export function isSafeReturnTo(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

/* ───── Role-aware routing ───── */

export function homeForRole(role: AuthUser['role'] | undefined | null): string {
  switch (role) {
    case 'STUDENT': return '/student';
    case 'TEACHER': return '/teacher';
    default:        return '/admin';
  }
}

export function canAccess(role: AuthUser['role'] | undefined | null, area: 'admin' | 'student' | 'teacher'): boolean {
  if (!role) return false;
  if (area === 'student') return role === 'STUDENT';
  if (area === 'teacher') return role === 'TEACHER';
  // admin area: any non-student, non-teacher role
  return role !== 'STUDENT' && role !== 'TEACHER';
}

/** Multi-role aware area check for UI scopes.
 *  Admin UI is reserved to INSTANCE_ADMIN — MANAGER is an API-only grant
 *  (a teacher with the MANAGER extra gets manager API privileges but stays on /teacher).
 */
export function canAccessArea(user: AuthUser | null | undefined, area: 'admin' | 'student' | 'teacher'): boolean {
  if (!user) return false;
  const set = rolesOf(user);
  if (area === 'admin')   return set.some((r) => r === 'INSTANCE_ADMIN' || r === 'PLATFORM_ADMIN' || r === 'INSTITUTION_OWNER');
  if (area === 'teacher') return set.includes('TEACHER');
  if (area === 'student') return set.includes('STUDENT');
  return false;
}

/* ───── Hook ───── */

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage, then validate against /auth/me
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const stored = getStoredUser();
    if (stored) setUser(stored);

    const token = getToken();
    if (!token) {
      setLoaded(true);
      return;
    }

    (async () => {
      try {
        const fresh = await api.get<AuthUser>('/auth/me');
        if (cancelled) return;
        setUser(fresh);
        // Persist back to whichever store currently holds the session, so we
        // don't accidentally promote a session-only login to a remembered one.
        const store = isRemembered() ? localStorage : sessionStorage;
        try { store.setItem(USER_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
      } catch {
        // On 401, api.ts already cleared storage and navigated to /login.
        // On any other error (429, network blip, server hiccup) we KEEP the
        // hydrated user so guards don't bounce us into a /login ⇄ /admin
        // redirect loop that hammers the API and snowballs into 429s.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // React to login/logout from other parts of the app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setUser(getStoredUser());
    window.addEventListener(AUTH_EVENT, handler);
    window.addEventListener('storage', handler); // cross-tab
    return () => {
      window.removeEventListener(AUTH_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { user, loaded, logout: signOut };
}
