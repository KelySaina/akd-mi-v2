'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useEnabledModules } from '@/lib/modules';
import { categoryTheme } from '@/lib/category';
import { MobileSidebarShell } from './MobileSidebarShell';

export type RoleNavItem = { href: string; label: string; icon: LucideIcon; moduleKey?: string };

export function RoleSidebar({
  items, subtitle, accent = 'brand',
}: { items: RoleNavItem[]; subtitle: string; accent?: 'brand' | 'amber' }) {
  const instance = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';
  const BrandIcon = categoryTheme().icon;
  const ringCls = accent === 'amber'
    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
    : 'bg-grad-brand';

  return (
    <>
      {/* desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className={`size-9 rounded-xl grid place-items-center text-white shadow-lg shadow-brand-500/30 ${ringCls}`}>
            <BrandIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{instance}</div>
            <div className="text-xs text-ink-500 dark:text-ink-400">{subtitle}</div>
          </div>
        </div>
        <RoleNavList items={items} />
        <RoleSidebarFooter ringCls={ringCls} />
      </aside>

      {/* mobile */}
      <MobileSidebarShell title={instance} subtitle={subtitle} accent={accent}>
        <RoleNavList items={items} />
        <RoleSidebarFooter ringCls={ringCls} />
      </MobileSidebarShell>
    </>
  );
}

function RoleNavList({ items }: { items: RoleNavItem[] }) {
  const pathname = usePathname();
  const { isEnabled } = useEnabledModules();
  const visible = items.filter((it) => isEnabled(it.moduleKey));
  const base = visible[0]?.href;
  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      {visible.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== base && pathname.startsWith(href));
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

function RoleSidebarFooter({ ringCls }: { ringCls: string }) {
  const { user, logout } = useAuth();
  return (
    <div className="p-3 border-t border-ink-200 dark:border-ink-800">
      <div className="mt-2 flex items-center gap-3 px-3 py-2">
        <div className={`size-8 rounded-full ${ringCls} text-white grid place-items-center text-xs font-semibold overflow-hidden`}>
          {user?.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
            : user?.name?.slice(0, 1)?.toUpperCase() ?? '·'}
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
