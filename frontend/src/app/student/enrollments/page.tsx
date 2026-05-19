'use client';
import { useMemo, useState } from 'react';
import { BookOpen, Users as UsersIcon, ClipboardList } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Badge } from '@/components/DataTable';
import { useStudentMe, computeAvg } from '../useStudentMe';

export default function StudentEnrollmentsPage() {
  const { me, loading, error } = useStudentMe();
  const [yearFilter, setYearFilter] = useState<string>('all');

  const years = useMemo(
    () => me ? Array.from(new Set(me.enrollments.map((e) => e.academicYear))).sort().reverse() : [],
    [me],
  );

  if (loading || !me) {
    return (
      <>
        <Topbar title="My courses" />
        <main className="p-6"><div className="max-w-5xl mx-auto h-64 rounded-2xl shimmer" /></main>
      </>
    );
  }

  const visible = yearFilter === 'all' ? me.enrollments : me.enrollments.filter((e) => e.academicYear === yearFilter);
  const grouped = visible.reduce<Record<string, typeof visible>>((acc, e) => {
    (acc[e.academicYear] ||= []).push(e);
    return acc;
  }, {});
  const groupYears = Object.keys(grouped).sort().reverse();

  return (
    <>
      <Topbar title="My courses" />
      <main className="p-4 lg:p-6 max-w-5xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">Courses you're enrolled in, grouped by academic year.</p>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm"
          >
            <option value="all">All academic years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-12 text-center text-sm text-ink-500 dark:text-ink-400">
            You don't have any enrollments yet. Contact your administration to be enrolled in a course.
          </div>
        ) : groupYears.map((year) => (
          <div key={year} className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800 flex items-center justify-between">
              <div className="font-semibold text-sm">Academic year {year}</div>
              <div className="text-xs text-ink-500 dark:text-ink-400">{grouped[year].length} course{grouped[year].length !== 1 ? 's' : ''}</div>
            </div>
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {grouped[year].map((e) => {
                const avg = computeAvg(e.grades);
                return (
                  <li key={e.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{e.course.code}</code>{e.course.title}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 flex flex-wrap items-center gap-x-2">
                        {e.semester && <span>{e.semester}</span>}
                        <Badge tone={e.status === 'enrolled' ? 'success' : 'default'}>{e.status}</Badge>
                        {e.teacher?.user?.name && <span className="inline-flex items-center gap-1"><UsersIcon className="size-3" /> {e.teacher.user.name}</span>}
                        <span className="inline-flex items-center gap-1"><ClipboardList className="size-3" /> {e.grades.length} grade{e.grades.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-semibold text-brand-700 dark:text-brand-300">{avg.toFixed(1)}/100</div>
                        <div className="text-[11px] text-ink-400">average</div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </main>
    </>
  );
}
