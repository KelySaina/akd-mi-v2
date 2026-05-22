/**
 * If `url` points at localhost / 127.0.0.1 / 0.0.0.0 / ::1 and we're running
 * in a browser, rewrite the hostname to the current page's hostname. Keeps
 * port, path, query and hash intact.
 *
 * This fixes the case where instances are provisioned on a remote server but
 * their `instances/<slug>/.env` PUBLIC_WEB_URL was generated with `localhost`,
 * so the admin's "open public URL" link would not work from another machine.
 *
 * On the server (no window) the URL is returned unchanged.
 */
export function resolvePublicUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (typeof window === 'undefined') return url;
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
            u.hostname = window.location.hostname;
            return u.toString();
        }
        return url;
    } catch {
        return url;
    }
}
