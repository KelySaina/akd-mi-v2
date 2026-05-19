'use client';
import Link from 'next/link';
import { BookOpen, Award, TrendingUp, GraduationCap, ArrowRight, Cake } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Badge } from '@/components/DataTable';
import { useStudentMe, computeAvg } from './useStudentMe';

const STATUS_TONES: Record<string, 'default' | 'success' | 'warn' | 'danger' | 'brand'> = {
  active: 'success', graduated: 'brand', suspended: 'warn', dropped: 'danger',
};

export default function StudentHomePage() {
  const { me, loading, error } = useStudentMe();

  if (loading) {
    return (
      <>
        <Topbar title="Overview" />
        <main className="p-6"><div className="max-w-5xl mx-auto h-64 rounded-2xl shimmer" /></main>
      </>
    );
  }
  if (!me) {
    return (
      <>
        <Topbar title="Overview" />
        <main className="p-6 max-w-5xl mx-auto">
          <div className="text-sm text-rose-700">{error ?? 'No student profile linked to your account.'}</div>
        </main>
      </>
    );
  }

  const allGrades = me.enrollments.flatMap((e) => e.grades);
  const overall = computeAvg(allGrades);
  const status = (me.status ?? 'active').toLowerCase();
  const currentYear = me.enrollments[0]?.academicYear;
  const currentCourses = currentYear ? me.enrollments.filter((e) => e.academicYear === currentYear) : [];
  const latestGrades = [...allGrades].sort((a, b) => +new Date(b.gradedAt) - +new Date(a.gradedAt)).slice(0, 5);

  return (
    <>
      <Topbar title="Overview" />
      <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto space-y-4">
        {/* Hero */}
        <div className="rounded-2xl bg-grad-brand text-white p-5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            {me.user.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={me.user.avatarUrl} alt={me.user.name} className="size-14 rounded-full object-cover ring-2 ring-white/40 shrink-0" />
              : <div className="size-14 rounded-full bg-white/15 ring-2 ring-white/40 grid place-items-center text-base font-semibold shrink-0">
                  {me.user.name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')}
                </div>}
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wider text-white/70">Welcome back,</div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold truncate">{me.user.name}</h2>
                <Badge tone={STATUS_TONES[status] ?? 'default'}>{status}</Badge>
              </div>
              <div className="text-white/85 text-sm flex flex-wrap items-center gap-x-3">
                <span className="inline-flex items-center gap-1"><GraduationCap className="size-3.5" /> {me.studentNumber}</span>
                {me.enrollmentYear && <span className="inline-flex items-center gap-1"><Cake className="size-3.5" /> class of {me.enrollmentYear}</span>}
                {me.program?.name && <span>· {me.program.name}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat icon={<BookOpen className="size-5" />} label="Active courses" value={String(currentCourses.length)} hint={currentYear ?? 'No enrollments yet'} />
          <Stat icon={<Award className="size-5" />}    label="Evaluations" value={String(allGrades.length)} hint="across all years" />
          <Stat icon={<TrendingUp className="size-5" />} label="Overall average" value={overall === null ? '—' : `${overall.toFixed(1)}/100`} hint="all evaluations" />
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Current courses */}
          <Card>
            <CardHeader title="Current courses" hint={currentYear ? `Academic year ${currentYear}` : 'No academic year set'} link={{ href: '/student/enrollments', label: 'View all' }} />
            {currentCourses.length === 0 ? (
              <Empty>No courses for the latest academic year.</Empty>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {currentCourses.slice(0, 5).map((e) => {
                  const avg = computeAvg(e.grades);
                  return (
                    <li key={e.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0"><BookOpen className="size-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{e.course.code}</code>{e.course.title}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400 flex flex-wrap gap-x-2">
                          {e.semester && <span>{e.semester}</span>}
                          {e.teacher?.user?.name && <span>· {e.teacher.user.name}</span>}
                          {avg !== null && <span className="text-brand-700 dark:text-brand-300 font-medium">· avg {avg.toFixed(1)}/100</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Latest grades */}
          <Card>
            <CardHeader title="Latest evaluations" hint="Across all your courses" link={{ href: '/student/grades', label: 'View all' }} />
            {latestGrades.length === 0 ? (
              <Empty>No evaluations recorded yet.</Empty>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {latestGrades.map((g) => {
                  const e = me.enrollments.find((x) => x.id === g.enrollmentId);
                  const pct = (g.score / g.maxScore) * 100;
                  const tone = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
                  return (
                    <li key={g.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{g.assessment}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{e?.course.code} — {e?.course.title}</div>
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
          </Card>
        </div>
      </main>
    </>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4 flex items-center gap-3">
      <div className="size-10 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-ink-500 dark:text-ink-400">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        {hint && <div className="text-[11px] text-ink-400 dark:text-ink-500 truncate">{hint}</div>}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl overflow-hidden">{children}</div>;
}
function CardHeader({ title, hint, link }: { title: string; hint?: string; link?: { href: string; label: string } }) {
  return (
    <div className="px-4 py-3 flex items-center gap-2 border-b border-ink-100 dark:border-ink-800">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm">{title}</div>
        {hint && <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{hint}</div>}
      </div>
      {link && (
        <Link href={link.href} className="text-xs text-brand-700 dark:text-brand-300 hover:underline inline-flex items-center gap-1">
          {link.label} <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-8 text-center text-xs text-ink-500 dark:text-ink-400">{children}</div>;
}
