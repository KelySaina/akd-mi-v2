'use client';
import { useEffect, useState } from 'react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Badge } from '@/components/DataTable';
import { Modal, TextInput, SelectInput, Button } from '@/components/ui';
import { BookOpen, Paperclip, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CourseMediaManager } from '@/components/CourseMediaManager';
import { useDialog } from '@/components/DialogProvider';

type TeacherInfo = {
  id: string;
  user: { id: string; name: string; email: string };
};

type Course = {
  id: string; code: string; title: string; description?: string | null;
  credits: number; isActive: boolean;
  teacherId?: string | null;
  teacher?: TeacherInfo | null;
  program?: { id: string; name: string } | null;
};

const EMPTY_FORM = { code: '', title: '', description: '', credits: 3, teacherId: '' };

export default function CoursesPage() {
  const [rows, setRows] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Course | null>(null);
  const [attaching, setAttaching] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const dialog = useDialog();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const coursesRes = await api.get('/courses?limit=50');
      setRows(coursesRes.items ?? []);
    } catch (e: any) { setError(e.message); }
    try {
      const teachersRes = await api.get('/teachers?limit=100');
      const list = Array.isArray(teachersRes) ? teachersRes : (teachersRes?.items ?? []);
      setTeachers(list);
    } catch (e: any) {
      // Show in modal as a helper, not as a top-level error
      console.error('Failed to load teachers:', e);
      setTeachersError(e?.message ?? 'Failed to load teachers');
      setTeachers([]);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      code: c.code,
      title: c.title,
      description: c.description ?? '',
      credits: c.credits,
      teacherId: c.teacherId ?? '',
    });
    setError(null);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: any = {
      code: form.code,
      title: form.title,
      description: form.description || null,
      credits: Number(form.credits),
      teacherId: form.teacherId || null,
    };
    try {
      if (editing) await api.patch(`/courses/${editing.id}`, payload);
      else await api.post('/courses', payload);
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(c: Course) {
    const ok = await dialog.confirm({
      title: 'Delete course',
      message: `Delete "${c.code} — ${c.title}"?\n\nThis will remove enrollments and attachments for this course. The files stay in the media library.`,
      tone: 'danger',
      confirmLabel: 'Delete course',
    });
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/courses/${c.id}`);
      setRows((xs) => xs.filter((x) => x.id !== c.id));
    } catch (e: any) { setError(e.message); }
  }

  const teacherOptions = [
    { value: '', label: '— Unassigned —' },
    ...teachers.map((t) => ({ value: t.id, label: `${t.user.name} (${t.user.email})` })),
  ];

  return (
    <>
      <Topbar title="Courses" action={<PrimaryButton onClick={openCreate}>New course</PrimaryButton>} />
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
              <div key={c.id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-5 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col">
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
                <div className="mt-3 text-xs text-ink-500">
                  Teacher: {c.teacher ? <span className="text-ink-700 dark:text-ink-200">{c.teacher.user.name}</span> : <span className="text-ink-400">— unassigned —</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between text-xs text-ink-500">
                  <span>{c.credits} {c.credits === 1 ? 'credit' : 'credits'}</span>
                  <span>{c.program?.name ?? '—'}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setAttaching(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                  >
                    <Paperclip className="size-3.5" /> Attachments
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                    aria-label="Delete course"
                    title="Delete course"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit course · ${editing.code}` : 'Create course'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => (document.getElementById('course-form') as HTMLFormElement)?.requestSubmit()}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="course-form" onSubmit={submit} className="space-y-4">
          <TextInput label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required placeholder="CS-101" />
          <TextInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required placeholder="Introduction to Computer Science" />
          <TextInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="optional" />
          <TextInput label="Credits" type="number" value={String(form.credits)} onChange={(v) => setForm({ ...form, credits: Number(v) })} />
          <SelectInput
            label="Teacher"
            value={form.teacherId}
            onChange={(v) => setForm({ ...form, teacherId: v })}
            options={teacherOptions}
          />
          {teachersError ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Couldn’t load teachers: {teachersError}
            </p>
          ) : teachers.length === 0 ? (
            <p className="text-xs text-ink-500">No teachers yet — create one from the Teachers page to assign here.</p>
          ) : (
            <p className="text-xs text-ink-500">{teachers.length} teacher{teachers.length === 1 ? '' : 's'} available.</p>
          )}
        </form>
      </Modal>

      <Modal
        open={!!attaching}
        onClose={() => setAttaching(null)}
        title={attaching ? `Attachments · ${attaching.code}` : 'Attachments'}
        footer={<Button variant="ghost" onClick={() => setAttaching(null)}>Close</Button>}
      >
        {attaching && <CourseMediaManager courseId={attaching.id} />}
      </Modal>
    </>
  );
}
