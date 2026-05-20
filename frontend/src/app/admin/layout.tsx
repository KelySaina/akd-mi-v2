'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';
import { canAccessArea, homeForRole } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loaded) return;
    if (!user) {
      const returnTo = encodeURIComponent(pathname || '/admin');
      router.replace(`/login?returnTo=${returnTo}`);
      return;
    }
    if (!canAccessArea(user, 'admin')) {
      router.replace(homeForRole(user.role));
    }
  }, [loaded, user, router, pathname]);

  if (!loaded) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-950">
        <div className="size-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user || !canAccessArea(user, 'admin')) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-100">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
