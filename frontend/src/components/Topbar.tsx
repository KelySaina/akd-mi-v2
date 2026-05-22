'use client';
import { Search, Bell, Plus, ClipboardList, KeyRound, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useNotifications, type NotificationItem } from '@/lib/useNotifications';

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
          <NotificationBell />
          {action}
        </div>
      </div>
    </header>
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

function NotificationBell() {
  const { user } = useAuth();
  const { total, items, refresh } = useNotifications(30000);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) refresh(); }}
        className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 relative"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold grid place-items-center shadow ring-2 ring-white dark:ring-ink-900">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xl shadow-black/10 overflow-hidden z-40">
          <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800 flex items-center justify-between">
            <div className="text-sm font-semibold">Notifications</div>
            <button onClick={refresh} className="text-xs text-brand-600 hover:underline">Refresh</button>
          </div>
          <div className="max-h-[24rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-500 dark:text-ink-400">
                You're all caught up.
              </div>
            ) : items.map((it) => <NotificationRow key={it.kind + it.id} it={it} onSelect={() => setOpen(false)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ it, onSelect }: { it: NotificationItem; onSelect: () => void }) {
  const Icon = it.kind === 'enrollment_request' ? ClipboardList
    : it.kind === 'password_reset_request' ? KeyRound
    : it.kind === 'student_application' ? UserPlus
    : it.kind === 'enrollment_status' ? CheckCircle2
    : XCircle;
  const tint = it.kind === 'enrollment_request' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
    : it.kind === 'password_reset_request' ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
    : it.kind === 'student_application' ? 'text-sky-600 bg-sky-50 dark:bg-sky-500/10'
    : it.kind === 'enrollment_status' ? 'text-brand-600 bg-brand-50 dark:bg-brand-500/10'
    : 'text-ink-500 bg-ink-100 dark:bg-ink-800';
  const content = (
    <div className="flex gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition">
      <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${tint}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate">{it.title}</div>
        {it.subtitle && <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{it.subtitle}</div>}
        <div className="text-[10px] text-ink-400 mt-0.5">{new Date(it.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
  return it.href
    ? <Link href={it.href} onClick={onSelect}>{content}</Link>
    : <div>{content}</div>;
}
