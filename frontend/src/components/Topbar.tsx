'use client';
import { Search, Bell, Plus, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/lib/theme';
import { useAuth } from '@/lib/auth';

const ROLE_LABEL: Record<string, string> = {
  PLATFORM_ADMIN: 'Platform admin',
  INSTITUTION_OWNER: 'Owner',
  INSTANCE_ADMIN: 'Admin',
  MANAGER: 'Manager',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

export function Topbar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/70 backdrop-blur border-b border-ink-200 dark:border-ink-800">
      <div className="px-6 py-3.5 flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-sm text-ink-500 dark:text-ink-400">
          <Search className="size-4" />
          <input
            type="search"
            placeholder="Search…"
            className="bg-transparent outline-none flex-1 placeholder:text-ink-400 dark:placeholder:text-ink-500 text-ink-700 dark:text-ink-200"
          />
          <span className="text-[10px] text-ink-400 border border-ink-200 dark:border-ink-700 rounded px-1.5 py-0.5">⌘ K</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 relative">
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-rose-500" />
          </button>
          {action}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!user) return null;
  const initials = (user.name || user.email).split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition"
      >
        <div className="size-7 rounded-full bg-grad-brand text-white grid place-items-center text-xs font-semibold overflow-hidden">
          {user.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
            : initials || <UserIcon className="size-4" />}
        </div>
        <span className="hidden sm:block text-sm font-medium text-ink-800 dark:text-ink-100 max-w-[10rem] truncate">{user.name}</span>
        <ChevronDown className="size-3.5 text-ink-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xl shadow-black/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{user.email}</div>
            <div className="mt-1.5 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300">
              {ROLE_LABEL[user.role] ?? user.role}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({ children, onClick, type = 'button' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-grad-brand text-white text-sm font-medium shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.98] transition"
    >
      <Plus className="size-4" />
      {children}
    </button>
  );
}
