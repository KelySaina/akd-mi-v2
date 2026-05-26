'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { Users, GraduationCap, BookOpen, FileBarChart, ArrowUpRight, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatRelative, type ActivityItem } from '@/lib/activity';

type Stats = {
  users?: number;
  students?: number;
  teachers?: number;
  courses?: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, s, t, c] = await Promise.allSettled([
          api.get('/users?limit=1'),
          api.get('/students?limit=1'),
          api.get('/teachers?limit=1'),
          api.get('/courses?limit=1'),
        ]);
        setStats({
          users:    u.status === 'fulfilled' ? u.value.total : undefined,
          students: s.status === 'fulfilled' ? s.value.total : undefined,
          teachers: t.status === 'fulfilled' ? t.value.total : undefined,
          courses:  c.status === 'fulfilled' ? c.value.total : undefined,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ items: ActivityItem[] }>('/activity?limit=4');
        setActivity(r.items ?? []);
      } catch { /* ignore */ }
      finally { setActivityLoading(false); }
    })();
  }, []);

  const cards = [
    { label: 'Users',    value: stats.users,    icon: Users,         tone: 'from-blue-500 to-cyan-500' },
    { label: 'Students', value: stats.students, icon: GraduationCap, tone: 'from-sky-500 to-cyan-500' },
    { label: 'Teachers', value: stats.teachers, icon: Users,         tone: 'from-emerald-500 to-teal-500' },
    { label: 'Courses',  value: stats.courses,  icon: BookOpen,      tone: 'from-amber-500 to-orange-500' },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {/* greeting */}
        <section className="rounded-2xl bg-grad-brand text-white p-6 lg:p-8 mb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="text-sm text-white/80">Welcome back</div>
            <h2 className="mt-1 text-2xl lg:text-3xl font-bold">{user?.name ?? '·'} 👋</h2>
            <p className="mt-2 text-white/80 max-w-xl">
              Here&apos;s what&apos;s happening across your institution today.
            </p>
          </div>
        </section>

        {/* stats */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-5 relative overflow-hidden hover:shadow-md transition">
              <div className={`absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br ${tone} opacity-15 blur-xl`} />
              <div className={`size-10 rounded-xl bg-gradient-to-br ${tone} text-white grid place-items-center shadow-md`}>
                <Icon className="size-5" />
              </div>
              <div className="mt-4 text-3xl font-bold">
                {loading ? <span className="inline-block w-12 h-7 rounded shimmer" /> : (value ?? '—')}
              </div>
              <div className="mt-1 text-sm text-ink-500 dark:text-ink-400 flex items-center gap-1">
                {label}
                <ArrowUpRight className="size-3.5 text-emerald-500" />
              </div>
            </div>
          ))}
        </section>

        {/* two columns */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent activity</h3>
              <Link href="/admin/activity" className="text-sm text-brand-700 dark:text-brand-400 hover:underline">View all</Link>
            </div>
            {activityLoading ? (
              <ul className="space-y-3">
                {[0,1,2,3].map((i) => (
                  <li key={i} className="flex items-start gap-3 py-2">
                    <div className="size-8 rounded-full shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded shimmer" />
                      <div className="h-3 w-2/3 rounded shimmer" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-500">No activity yet.</div>
            ) : (
              <ul className="space-y-3">
                {activity.map((it) => {
                  const Row = (
                    <li className="flex items-start gap-3 py-2">
                      <div className="size-8 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center mt-0.5">
                        <Activity className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{it.title}</div>
                        <div className="text-sm text-ink-500 dark:text-ink-400 truncate">{it.subtitle}</div>
                      </div>
                      <time className="text-xs text-ink-400 whitespace-nowrap" title={new Date(it.at).toLocaleString()}>{formatRelative(it.at)}</time>
                    </li>
                  );
                  return it.href ? (
                    <Link key={it.id} href={it.href} className="block hover:bg-ink-50/60 dark:hover:bg-ink-800/40 -mx-2 px-2 rounded transition">{Row}</Link>
                  ) : (
                    <div key={it.id}>{Row}</div>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><FileBarChart className="size-4 text-brand-600 dark:text-brand-400" /> Quick links</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Add student',  '/admin/students'],
                ['Add teacher',  '/admin/teachers'],
                ['New course',   '/admin/courses'],
                ['Modules',      '/admin/modules'],
                ['Institution',  '/admin/institution'],
                ['Reports',      '/admin/reports'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg border border-ink-200 dark:border-ink-700 px-3 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:border-brand-200 dark:hover:border-brand-500/40 transition"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
