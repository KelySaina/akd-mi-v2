/**
 * Copy text to the clipboard with a fallback for non-secure contexts.
 *
 * `navigator.clipboard` is only available on HTTPS or localhost. When the
 * portal is served over plain HTTP (typical for self-hosted instances on a
 * LAN/server IP), we fall back to the legacy `document.execCommand('copy')`
 * trick using a hidden textarea.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Preferred path: async Clipboard API (secure contexts only).
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fall through to legacy
        }
    }

    // Legacy fallback — works on plain HTTP.
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        ta.style.pointerEvents = 'none';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}
