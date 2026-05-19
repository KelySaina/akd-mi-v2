// Lightweight API client. Pulls token from localStorage and auto-redirects to /login on 401.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function isSafeReturnTo(path: string) {
    return path.startsWith('/') && !path.startsWith('//');
}

function redirectToLogin() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    } catch { /* ignore */ }
    // Avoid loop when already on /login
    if (window.location.pathname.startsWith('/login')) return;
    const returnTo = window.location.pathname + window.location.search;
    const target = isSafeReturnTo(returnTo) ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';
    window.location.replace(target);
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE}/api/v1${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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
        const token = localStorage.getItem('access_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const fd = new FormData();
    fd.append('file', file, file.name);
    const res = await fetch(`${BASE}/api/v1/storage/upload`, { method: 'POST', headers, body: fd, credentials: 'include' });
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
