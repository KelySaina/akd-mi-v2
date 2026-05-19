'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  Building2, Calendar, FileBarChart, Settings, LogOut, ChevronRight, Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MobileSidebarShell } from './MobileSidebarShell';

const nav = [
  { href: '/admin',              label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/users',        label: 'Users',      icon: Users },
  { href: '/admin/students',     label: 'Students',   icon: GraduationCap },
  { href: '/admin/teachers',     label: 'Teachers',   icon: Users },
  { href: '/admin/courses',      label: 'Courses',    icon: BookOpen },
  { href: '/admin/modules',      label: 'Modules',    icon: Layers },
  { href: '/admin/institution',  label: 'Institution',icon: Building2 },
  { href: '/admin/media',        label: 'Media',      icon: ImageIcon },
  { href: '/admin/schedule',     label: 'Schedule',   icon: Calendar },
  { href: '/admin/reports',      label: 'Reports',    icon: FileBarChart },
];

export function Sidebar() {
  const instance = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';
  return (
    <>
      {/* desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-grad-brand grid place-items-center text-white shadow-lg shadow-brand-500/30">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{instance}</div>
            <div className="text-xs text-ink-500 dark:text-ink-400">Admin console</div>
          </div>
        </div>
        <SidebarBody />
        <SidebarFooter />
      </aside>

      {/* mobile */}
      <MobileSidebarShell title={instance} subtitle="Admin console">
        <SidebarBody />
        <SidebarFooter />
      </MobileSidebarShell>
    </>
  );
}

function SidebarBody() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={[
              'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
              active
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium'
                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white',
            ].join(' ')}
          >
            <Icon className={['size-4', active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 group-hover:text-ink-600 dark:group-hover:text-ink-200'].join(' ')} />
            <span className="flex-1">{label}</span>
            {active && <ChevronRight className="size-3.5 text-brand-500" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { user, logout } = useAuth();
  return (
    <div className="p-3 border-t border-ink-200 dark:border-ink-800">
      <Link
        href="/admin/settings"
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800"
      >
        <Settings className="size-4 text-ink-400" /> Settings
      </Link>
      <div className="mt-2 flex items-center gap-3 px-3 py-2">
        <div className="size-8 rounded-full bg-grad-brand text-white grid place-items-center text-xs font-semibold">
          {user?.name?.slice(0, 1)?.toUpperCase() ?? '·'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{user?.name ?? 'Guest'}</div>
          <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{user?.email ?? ''}</div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 dark:text-ink-400"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
