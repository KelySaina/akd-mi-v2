'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Calendar, FileBarChart, Settings, ChevronRight, ChevronDown,
  Image as ImageIcon, ClipboardList, KeyRound, LogOut, ToggleRight, MessageSquare,
} from 'lucide-react';
import { MobileSidebarShell } from './MobileSidebarShell';
import { useAuth } from '@/lib/auth';
import { useEnabledModules } from '@/lib/modules';
import { categoryTheme } from '@/lib/category';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; moduleKey?: string };
type NavGroup = { id: string; label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: '/admin/users',    label: 'Users',    icon: Users },
      { href: '/admin/students', label: 'Students', icon: GraduationCap, moduleKey: 'students' },
      { href: '/admin/teachers', label: 'Teachers', icon: Users,         moduleKey: 'teachers' },
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    items: [
      { href: '/admin/courses',     label: 'Courses',     icon: BookOpen,        moduleKey: 'courses' },
      { href: '/admin/enrollments', label: 'Enrollments', icon: ClipboardList,   moduleKey: 'courses' },
      { href: '/admin/schedule',    label: 'Schedule',    icon: Calendar,        moduleKey: 'schedule' },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { href: '/admin/media', label: 'Media', icon: ImageIcon },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { href: '/admin/requests', label: 'Requests', icon: KeyRound },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare, moduleKey: 'messaging' },
      { href: '/admin/reports',  label: 'Reports',  icon: FileBarChart, moduleKey: 'reports' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      { href: '/admin/modules', label: 'Modules', icon: ToggleRight },
    ],
  },
];

const settingsItem: NavItem = { href: '/admin/settings', label: 'Settings', icon: Settings };

const STORAGE_KEY = 'akdmi:sidebar:openGroups';

function loadOpenState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export function Sidebar() {
  const instance = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';
  const BrandIcon = categoryTheme().icon;
  return (
    <>
      {/* desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-grad-brand grid place-items-center text-white shadow-lg shadow-brand-500/30">
            <BrandIcon className="size-5" />
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

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

function SidebarBody() {
  const pathname = usePathname();
  const { isEnabled } = useEnabledModules();

  // Filter items per group by enabled modules, drop empty groups entirely.
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => isEnabled(it.moduleKey)) }))
    .filter((g) => g.items.length > 0);

  // Persist collapse state + auto-open the group containing the active route.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const stored = loadOpenState();
    const next: Record<string, boolean> = {};
    for (const g of visibleGroups) {
      const hasActive = g.items.some((it) => isItemActive(pathname, it.href));
      next[g.id] = hasActive ? true : (stored[g.id] ?? true);
    }
    setOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visibleGroups.length]);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return (
    <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
      {visibleGroups.map((g) => {
        const isOpen = open[g.id] ?? true;
        const hasActive = g.items.some((it) => isItemActive(pathname, it.href));
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 transition"
            >
              <ChevronRight className={`size-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              <span className="flex-1 text-left">{g.label}</span>
              {!isOpen && hasActive && <span className="size-1.5 rounded-full bg-brand-500" />}
            </button>
            {isOpen && (
              <div className="mt-0.5 space-y-0.5">
                {g.items.map((it) => <NavLink key={it.href} item={it} pathname={pathname} />)}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, label, icon: Icon } = item;
  const active = isItemActive(pathname, href);
  return (
    <Link
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
      {active && <ChevronDown className="size-3.5 text-brand-500 rotate-[-90deg]" />}
    </Link>
  );
}

function SidebarFooter() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <div className="p-3 border-t border-ink-200 dark:border-ink-800 space-y-1">
      <NavLink item={settingsItem} pathname={pathname} />
      {user && (
        <div className="mt-2 flex items-center gap-3 px-3 py-2">
          <div className="size-8 rounded-full bg-grad-brand text-white grid place-items-center text-xs font-semibold overflow-hidden">
            {user.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
              : user.name?.slice(0, 1)?.toUpperCase() ?? '·'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{user.email}</div>
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
      )}
    </div>
  );
}
