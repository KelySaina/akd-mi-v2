'use client';
import { useEffect, useState } from 'react';
import { resolvePublicUrl } from '@/lib/public-url';

/**
 * Anchor that rewrites a stored `localhost` URL to the host you're actually
 * viewing the admin from — so links work over LAN / from a remote server.
 *
 * Renders nothing when `url` is falsy. Pre-hydration the original URL is used,
 * after mount it is replaced. The visible label (`children`) is yours to set.
 */
export function PublicLink({
    url,
    children,
    className,
    title,
    target = '_blank',
}: {
    url: string | null | undefined;
    children: React.ReactNode;
    className?: string;
    title?: string;
    target?: string;
}) {
    const [href, setHref] = useState<string | null>(url ?? null);
    useEffect(() => { setHref(resolvePublicUrl(url)); }, [url]);
    if (!href) return null;
    return (
        <a href={href} target={target} rel="noreferrer" className={className} title={title}>
            {children}
        </a>
    );
}
