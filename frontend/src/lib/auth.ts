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

/* ───── Storage helpers (safe for SSR) ───── */

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function signIn(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function signOut() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
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
        localStorage.setItem('user', JSON.stringify(fresh));
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
