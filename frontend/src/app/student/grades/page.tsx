'use client';
import { useMemo, useState } from 'react';
import { TrendingUp, ClipboardList } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useStudentMe, computeAvg } from '../useStudentMe';

export default function StudentGradesPage() {
  const { me, loading, error } = useStudentMe();
  const [yearFilter, setYearFilter] = useState<string>('all');

  const years = useMemo(
    () => me ? Array.from(new Set(me.enrollments.map((e) => e.academicYear))).sort().reverse() : [],
    [me],
  );

  if (loading || !me) {
    return (
      <>
        <Topbar title="My grades" />
        <main className="p-6"><div className="max-w-5xl mx-auto h-64 rounded-2xl shimmer" /></main>
      </>
    );
  }

  const visible = yearFilter === 'all' ? me.enrollments : me.enrollments.filter((e) => e.academicYear === yearFilter);
  const allGrades = visible.flatMap((e) => e.grades);
  const overall = computeAvg(allGrades);

  return (
    <>
      <Topbar title="My grades" />
      <main className="p-4 lg:p-6 max-w-5xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">Your evaluations across courses. Read-only view.</p>
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

        {/* Overall */}
        <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center">
            <TrendingUp className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Overall average</div>
            <div className="text-xs text-ink-500 dark:text-ink-400">Across {allGrades.length} evaluation{allGrades.length !== 1 ? 's' : ''} in the selected scope.</div>
          </div>
          <div className="text-2xl font-bold tabular-nums">{overall === null ? '—' : `${overall.toFixed(1)}/100`}</div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-12 text-center text-sm text-ink-500 dark:text-ink-400">
            No courses to show.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((e) => {
              const avg = computeAvg(e.grades);
              return (
                <div key={e.id} className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="size-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0"><ClipboardList className="size-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{e.course.code}</code>{e.course.title}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 flex flex-wrap items-center gap-x-2">
                        <span>{e.academicYear}</span>
                        {e.semester && <span>· {e.semester}</span>}
                        {e.teacher?.user?.name && <span>· {e.teacher.user.name}</span>}
                        {avg !== null && <span className="text-brand-700 dark:text-brand-300 font-medium">· avg {avg.toFixed(1)}/100</span>}
                      </div>
                    </div>
                  </div>

                  {e.grades.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-ink-200 dark:border-ink-700 p-4 text-center text-xs text-ink-500 dark:text-ink-400">
                      No evaluations yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                      {e.grades.map((g) => {
                        const pct = (g.score / g.maxScore) * 100;
                        const tone = pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
                        return (
                          <li key={g.id} className="py-2 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{g.assessment}</div>
                              {g.comment && <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{g.comment}</div>}
                              <div className="text-[11px] text-ink-400">{new Date(g.gradedAt).toLocaleDateString()}</div>
                            </div>
                            <div className={`text-right tabular-nums ${tone}`}>
                              <div className="text-sm font-semibold">{g.score}/{g.maxScore}</div>
                              <div className="text-[11px]">{pct.toFixed(0)}%</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
