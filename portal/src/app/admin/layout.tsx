// Pass-through layout so /admin/login can render without the sidebar.
// The sidebar lives in /admin/(shell)/layout.tsx and wraps every protected page.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
