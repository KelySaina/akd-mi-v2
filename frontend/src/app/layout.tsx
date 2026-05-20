import type { Metadata } from 'next';
import './globals.css';
import { themeBootScript } from '@/lib/theme';
import { DialogProvider } from '@/components/DialogProvider';

async function getInstitution(): Promise<{ name?: string; description?: string | null; logoUrl?: string | null } | null> {
    const base = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    if (!base) return null;
    try {
        const res = await fetch(`${base}/api/v1/institution`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const inst = await getInstitution();
    const name = inst?.name ?? process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';
    const icons = inst?.logoUrl ? { icon: inst.logoUrl, shortcut: inst.logoUrl, apple: inst.logoUrl } : undefined;
    return {
        title: { default: name, template: `%s · ${name}` },
        description: inst?.description ?? 'Institution management',
        icons,
    };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
            </head>
            <body>
                <DialogProvider>{children}</DialogProvider>
            </body>
        </html>
    );
}
