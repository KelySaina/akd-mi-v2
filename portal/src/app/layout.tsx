import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AKD-MI — Directory',
    description: 'Discover educational institutions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
