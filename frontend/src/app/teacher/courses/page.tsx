'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, ArrowRight, Search } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useTeacherEnrollments, useCoursesFromEnrollments } from '../useTeacher';

export default function TeacherCoursesPage() {
  const { data, loading, error } = useTeacherEnrollments();
  const courses = useCoursesFromEnrollments(data);
  const [q, setQ] = useState('');

  const visible = courses.filter(({ course }) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return course.code.toLowerCase().includes(needle) || course.title.toLowerCase().includes(needle);
  });

  return (
    <>
      <Topbar title="My courses" />
      <main className="p-4 lg:p-6 max-w-5xl w-full mx-auto space-y-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
          <Search className="size-4 text-ink-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by code or title…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400" />
          <span className="text-xs text-ink-500">{visible.length}</span>
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer" />)}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-12 text-center text-sm text-ink-500 dark:text-ink-400">
            No courses match this filter.
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map(({ course, enrollments: es, years: ys }) => {
              const studentsCount = new Set(es.map((e) => e.studentId)).size;
              return (
                <li key={course.id}>
                  <Link href={`/teacher/courses/${course.id}`}
                    className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4 flex items-center gap-3 hover:border-amber-300 dark:hover:border-amber-500/40 hover:shadow-sm transition">
                    <div className="size-11 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 grid place-items-center shrink-0">
                      <BookOpen className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{course.code}</code>{course.title}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 flex flex-wrap gap-x-2">
                        <span>{studentsCount} student{studentsCount !== 1 ? 's' : ''}</span>
                        <span>· {course.credits} credit{course.credits !== 1 ? 's' : ''}</span>
                        <span>· {Array.from(ys).sort().reverse().join(', ')}</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-ink-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
