'use client';
import { useEffect, useState } from 'react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Badge } from '@/components/DataTable';
import { Modal, TextInput, Button } from '@/components/ui';
import { BookOpen } from 'lucide-react';
import { api } from '@/lib/api';

type Course = {
  id: string; code: string; title: string; description?: string | null;
  credits: number; isActive: boolean;
  program?: { id: string; name: string } | null;
};

export default function CoursesPage() {
  const [rows, setRows] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', description: '', credits: 3 });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/courses?limit=50');
      setRows(res.items ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/courses', { ...form, credits: Number(form.credits) });
      setOpen(false);
      setForm({ code: '', title: '', description: '', credits: 3 });
      load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <>
      <Topbar title="Courses" action={<PrimaryButton onClick={() => setOpen(true)}>New course</PrimaryButton>} />
      <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl shimmer" />)}
          </div>
        ) : rows.length === 0 ? (
          <DataTable rows={[]} columns={[]} empty="No courses yet — create your first one." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-5 hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="flex items-start justify-between">
                  <div className="size-10 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center">
                    <BookOpen className="size-5" />
                  </div>
                  <Badge tone={c.isActive ? 'success' : 'default'}>{c.isActive ? 'active' : 'archived'}</Badge>
                </div>
                <div className="mt-3 text-xs uppercase tracking-wider text-ink-500 font-mono">{c.code}</div>
                <h3 className="mt-1 font-semibold leading-tight">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-500 line-clamp-2 min-h-[2.5em]">
                  {c.description ?? <span className="text-ink-400">No description.</span>}
                </p>
                <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
                  <span>{c.credits} {c.credits === 1 ? 'credit' : 'credits'}</span>
                  <span>{c.program?.name ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create course"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => (document.getElementById('course-form') as HTMLFormElement)?.requestSubmit()}>Create</Button>
          </>
        }
      >
        <form id="course-form" onSubmit={create} className="space-y-4">
          <TextInput label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required placeholder="CS-101" />
          <TextInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required placeholder="Introduction to Computer Science" />
          <TextInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="optional" />
          <TextInput label="Credits" type="number" value={String(form.credits)} onChange={(v) => setForm({ ...form, credits: Number(v) })} />
        </form>
      </Modal>
    </>
  );
}
