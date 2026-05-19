'use client';
import Link from 'next/link';
import { BookOpen, Users as UsersIcon, GraduationCap, ArrowRight } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useAuth } from '@/lib/auth';
import { useTeacherEnrollments, useCoursesFromEnrollments } from './useTeacher';

export default function TeacherHomePage() {
  const { user } = useAuth();
  const { data: enrollments, loading, error } = useTeacherEnrollments();
  const courses = useCoursesFromEnrollments(enrollments);
  const uniqueStudents = new Set(enrollments.map((e) => e.studentId)).size;
  const years = Array.from(new Set(enrollments.map((e) => e.academicYear))).sort().reverse();
  const currentYear = years[0];

  return (
    <>
      <Topbar title="Overview" />
      <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto space-y-4">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="text-xs uppercase tracking-wider text-white/80">Welcome back,</div>
            <h2 className="text-2xl font-bold">{user?.name ?? 'Teacher'}</h2>
            <p className="text-white/85 text-sm mt-1">
              {currentYear ? `You are teaching ${courses.length} course${courses.length !== 1 ? 's' : ''} this period.` : 'No courses assigned to you yet.'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat icon={<BookOpen className="size-5" />}      label="Courses I teach"  value={String(courses.length)} hint={currentYear ?? 'No academic year'} />
          <Stat icon={<UsersIcon className="size-5" />}     label="Students"          value={String(uniqueStudents)} hint="across all my courses" />
          <Stat icon={<GraduationCap className="size-5" />} label="Active enrollments" value={String(enrollments.length)} hint="all years" />
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Course list */}
        <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-ink-100 dark:border-ink-800">
            <div className="font-semibold text-sm">My courses</div>
            <Link href="/teacher/courses" className="text-xs text-brand-700 dark:text-brand-300 hover:underline inline-flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded shimmer" />)}</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-500 dark:text-ink-400">
              No courses assigned yet. Ask an administrator to enroll you on one.
            </div>
          ) : (
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {courses.slice(0, 5).map(({ course, enrollments: es, years: ys }) => {
                const studentsCount = new Set(es.map((e) => e.studentId)).size;
                return (
                  <li key={course.id}>
                    <Link href={`/teacher/courses/${course.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition">
                      <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 grid place-items-center shrink-0"><BookOpen className="size-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{course.code}</code>{course.title}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">{studentsCount} student{studentsCount !== 1 ? 's' : ''} · {Array.from(ys).sort().reverse().join(', ')}</div>
                      </div>
                      <ArrowRight className="size-4 text-ink-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4 flex items-center gap-3">
      <div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 grid place-items-center">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-ink-500 dark:text-ink-400">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        {hint && <div className="text-[11px] text-ink-400 dark:text-ink-500 truncate">{hint}</div>}
      </div>
    </div>
  );
}
