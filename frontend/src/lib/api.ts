// Lightweight API client. Pulls token from localStorage and auto-redirects to /login on 401.
const ENV_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// The access token lives in either localStorage (remember-me) or sessionStorage
// (session-only). Check both so callers don't have to care which is active.
function readStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const t = localStorage.getItem('access_token');
        if (t) return t;
    } catch { /* ignore */ }
    try { return sessionStorage.getItem('access_token'); } catch { return null; }
}

function clearStoredAuth() {
    if (typeof window === 'undefined') return;
    for (const key of ['access_token', 'user']) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
        try { sessionStorage.removeItem(key); } catch { /* ignore */ }
    }
}

// Resolve API base at call time. In the browser, if the configured URL points at
// `localhost` but the page is being served from a different host (e.g. the WSL IP
// or a LAN address), swap the hostname so fetch targets the same host the user
// is actually on. Server-side rendering keeps the env value as-is.
function resolveBase(): string {
    if (typeof window === 'undefined') return ENV_BASE;
    if (!ENV_BASE) return '';
    try {
        const u = new URL(ENV_BASE);
        const pageHost = window.location.hostname;
        if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && pageHost && pageHost !== u.hostname) {
            u.hostname = pageHost;
            return u.toString().replace(/\/$/, '');
        }
        return ENV_BASE;
    } catch {
        return ENV_BASE;
    }
}

function isSafeReturnTo(path: string) {
    return path.startsWith('/') && !path.startsWith('//');
}

function redirectToLogin() {
    if (typeof window === 'undefined') return;
    clearStoredAuth();
    // Avoid loop when already on /login
    if (window.location.pathname.startsWith('/login')) return;
    const returnTo = window.location.pathname + window.location.search;
    const target = isSafeReturnTo(returnTo) ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';
    window.location.replace(target);
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const hasBody = body !== undefined && body !== null;
    const headers: Record<string, string> = {};
    if (hasBody) headers['Content-Type'] = 'application/json';
    if (typeof window !== 'undefined') {
        const token = readStoredToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${resolveBase()}/api/v1${path}`, {
        method,
        headers,
        body: hasBody ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });

    // Auth expired / not signed in → bounce to /login (except for the login call itself)
    if (res.status === 401 && !path.startsWith('/auth/login')) {
        redirectToLogin();
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            message = data?.error ?? data?.message ?? message;
        } catch { /* ignore */ }
        throw new Error(message);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export const api = {
    get:    <T = any>(p: string)                => request<T>('GET', p),
    post:   <T = any>(p: string, body?: unknown) => request<T>('POST', p, body),
    patch:  <T = any>(p: string, body?: unknown) => request<T>('PATCH', p, body),
    delete: <T = any>(p: string)                => request<T>('DELETE', p),
};

// Upload a file via the backend storage proxy (POST /api/v1/storage/upload).
// Returns { key, url, size, mimeType }.
export async function uploadFile(file: File): Promise<{ key: string; url: string; size: number; mimeType: string }> {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
        const token = readStoredToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const fd = new FormData();
    fd.append('file', file, file.name);
    const res = await fetch(`${resolveBase()}/api/v1/storage/upload`, { method: 'POST', headers, body: fd, credentials: 'include' });
    if (res.status === 401) {
        redirectToLogin();
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try { const d = await res.json(); message = d?.error ?? d?.message ?? message; } catch { /* ignore */ }
        throw new Error(message);
    }
    return res.json();
}
