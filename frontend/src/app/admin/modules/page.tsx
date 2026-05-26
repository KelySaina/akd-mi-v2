'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { BookOpen, Users, GraduationCap, FileBarChart, Calendar, Library, MessageSquare, BarChart3, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { refreshEnabledModules } from '@/lib/modules';

const META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  courses:   { label: 'Courses',   icon: BookOpen,        color: 'from-violet-500 to-fuchsia-500', description: 'Programs, courses, syllabi.' },
  students:  { label: 'Students',  icon: GraduationCap,   color: 'from-sky-500 to-cyan-500',       description: 'Student records & enrollment.' },
  teachers:  { label: 'Teachers',  icon: Users,           color: 'from-emerald-500 to-teal-500',   description: 'Staff profiles & assignments.' },
  grades:    { label: 'Grades',    icon: FileBarChart,    color: 'from-amber-500 to-orange-500',   description: 'Grade books & report cards.' },
  schedule:  { label: 'Schedule',  icon: Calendar,        color: 'from-rose-500 to-pink-500',      description: 'Weekly time tables.' },
  library:   { label: 'Library',   icon: Library,         color: 'from-indigo-500 to-blue-500',    description: 'Books, loans, and resources.' },
  messaging: { label: 'Messaging', icon: MessageSquare,   color: 'from-purple-500 to-violet-500',  description: 'Internal announcements & DMs.' },
  reports:   { label: 'Reports',   icon: BarChart3,       color: 'from-slate-500 to-zinc-500',     description: 'Analytics & KPIs.' },
};

type Mod = { id: string; moduleKey: string; enabled: boolean };

export default function ModulesPage() {
  const [available, setAvailable] = useState<string[]>([]);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([api.get('/modules/available'), api.get('/modules')]);
      setAvailable(a.modules ?? []);
      const map: Record<string, boolean> = {};
      (m.items ?? []).forEach((x: Mod) => { map[x.moduleKey] = x.enabled; });
      setActive(map);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggle(key: string) {
    const next = !(active[key] ?? true);
    setSavingKey(key);
    setActive((s) => ({ ...s, [key]: next })); // optimistic
    try {
      await api.post('/modules', { moduleKey: key, enabled: next });
      refreshEnabledModules();
    } catch (e: any) {
      setActive((s) => ({ ...s, [key]: !next }));
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      <Topbar title="Modules" />
      <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <p className="text-ink-500 mb-6 max-w-2xl">
          Enable or disable features for this institution. Disabled modules are hidden from end users.
        </p>
        {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((key) => {
              const meta = META[key] ?? { label: key, icon: BookOpen, color: 'from-ink-400 to-ink-600', description: '' };
              const Icon = meta.icon;
              const on = active[key] ?? true; // default ON until explicitly disabled
              return (
                <div key={key} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-5 relative overflow-hidden">
                  <div className={`absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br ${meta.color} opacity-10 blur-2xl`} />
                  <div className="flex items-start justify-between gap-3 relative">
                    <div className={`size-11 rounded-xl bg-gradient-to-br ${meta.color} text-white grid place-items-center shadow-md`}>
                      <Icon className="size-5" />
                    </div>
                    <Switch on={on} onClick={() => toggle(key)} loading={savingKey === key} />
                  </div>
                  <h3 className="mt-3 font-semibold">{meta.label}</h3>
                  <p className="text-sm text-ink-500 mt-1">{meta.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function Switch({ on, onClick, loading }: { on: boolean; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? 'bg-grad-brand' : 'bg-ink-200'}`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
      {loading && (
        <Loader2 className="absolute right-1.5 size-3 text-white animate-spin" />
      )}
    </button>
  );
}
