'use client';
import { ReactNode } from 'react';

export function DataTable<T extends { id: string }>({
  columns, rows, empty,
}: {
  columns: { key: string; header: string; render: (row: T) => ReactNode; className?: string }[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-12 text-center text-ink-500 dark:text-ink-400">
        {empty ?? 'Nothing here yet.'}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 dark:bg-ink-800/60 text-ink-500 dark:text-ink-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left px-4 py-3 font-medium ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) return <img src={src} alt={name} className="size-8 rounded-full object-cover" />;
  const initials = name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '·';
  return (
    <div className="size-8 rounded-full bg-grad-brand text-white grid place-items-center text-xs font-semibold">
      {initials}
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warn' | 'danger' | 'brand' }) {
  const cls = {
    default: 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200',
    success: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
    warn:    'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
    danger:  'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300',
    brand:   'bg-brand-100 dark:bg-brand-500/15 text-brand-800 dark:text-brand-300',
  }[tone];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{children}</span>;
}
