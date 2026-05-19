import type { Metadata } from 'next';
import './globals.css';
import { themeBootScript } from '@/lib/theme';

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI',
    description: 'Institution management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
