import type { Metadata } from 'next';
import './globals.css';
import { themeBootScript } from '@/lib/theme';
import { INSTANCE_CATEGORY } from '@/lib/category';
import { resolveTheme, themeStyle, type Institution } from '@/components/landing/types';
import { DialogProvider } from '@/components/DialogProvider';

async function getInstitution(): Promise<Partial<Institution> | null> {
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Resolve the admin's chosen landing template + color theme so they apply
    // not only to the public landing page but also to login/register/forgot
    // password and every other page that sits inside this layout.
    const inst = await getInstitution();
    const settings = inst?.settings ?? null;
    const { primary, accent } = resolveTheme(settings?.landingTheme);
    const landingTemplate = (settings?.landingTemplate as string | undefined) ?? 'classic';
    const style = themeStyle(primary, accent);

    return (
        <html
            lang="en"
            data-category={INSTANCE_CATEGORY}
            data-landing-template={landingTemplate}
            style={style}
            suppressHydrationWarning
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
            </head>
            <body>
                <DialogProvider>{children}</DialogProvider>
            </body>
        </html>
    );
}
