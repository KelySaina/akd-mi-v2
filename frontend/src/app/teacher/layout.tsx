'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, UserCog, ClipboardCheck } from 'lucide-react';
import { useAuth, canAccessArea, homeForRole } from '@/lib/auth';
import { RoleSidebar, RoleNavItem } from '@/components/RoleSidebar';

const nav: RoleNavItem[] = [
  { href: '/teacher',          label: 'Overview',   icon: LayoutDashboard },
  { href: '/teacher/courses',  label: 'My courses', icon: BookOpen,         moduleKey: 'courses' },
  { href: '/teacher/gradebook',label: 'Gradebook',  icon: ClipboardCheck,   moduleKey: 'grades' },
  { href: '/teacher/profile',  label: 'Profile',    icon: UserCog },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loaded) return;
    if (!user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname || '/teacher')}`);
      return;
    }
    if (!canAccessArea(user, 'teacher')) router.replace(homeForRole(user.role));
  }, [loaded, user, router, pathname]);

  if (!loaded) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-950">
        <div className="size-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user || !canAccessArea(user, 'teacher')) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-100">
      <RoleSidebar items={nav} subtitle="Teacher space" accent="amber" />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
