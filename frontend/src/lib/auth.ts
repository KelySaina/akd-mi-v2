'use client';
import { useEffect, useState } from 'react';
import { api } from './api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'INSTANCE_ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT' | 'PLATFORM_ADMIN' | 'INSTITUTION_OWNER';
  avatarUrl?: string | null;
};

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
        // api.ts already handled the 401 redirect; just clear local state
        if (!cancelled) setUser(null);
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
