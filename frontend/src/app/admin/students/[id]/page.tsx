'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, Phone, Mail, Cake, UserCog, GraduationCap,
  BookOpen, ClipboardList, Plus, Trash2, Pencil, Award, TrendingUp, Users as UsersIcon,
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Badge } from '@/components/DataTable';
import { Modal, TextInput, Button } from '@/components/ui';
import { MediaField } from '@/components/MediaPicker';
import { api } from '@/lib/api';

/* ───────── Types ───────── */

type Course = { id: string; code: string; title: string; credits: number };
type TeacherLite = {
  id: string; staffNumber: string | null; title: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
};
type Grade = {
  id: string; enrollmentId: string; studentId: string;
  assessment: string; score: number; maxScore: number;
  comment: string | null; gradedAt: string;
};
type Enrollment = {
  id: string; studentId: string; courseId: string; teacherId: string | null;
  academicYear: string; semester: string | null; status: string;
  createdAt: string;
  course: Course;
  teacher: TeacherLite | null;
  grades: Grade[];
};
type Student = {
  id: string;
  studentNumber: string;
  status: string;
  enrollmentYear: number | null;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  programId: string | null;
  user: {
    id: string; name: string; email: string;
    phone: string | null; avatarUrl: string | null; isActive: boolean;
  };
  program: { id: string; name: string } | null;
  enrollments: Enrollment[];
};

const STATUS_TONES: Record<string, 'default' | 'success' | 'warn' | 'danger' | 'brand'> = {
  active: 'success', graduated: 'brand', suspended: 'warn', dropped: 'danger',
};

type Tab = 'overview' | 'enrollments' | 'grades';

/* ───────── Page ───────── */

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  async function reload() {
    setError(null);
    try { setStudent(await api.get<Student>(`/students/${id}`)); }
    catch (e: any) { setError(e.message); }
  }

  useEffect(() => {
    (async () => { setLoading(true); await reload(); setLoading(false); })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Available academic years from enrollments — newest first
  const years = useMemo(() => {
    if (!student) return [];
    return Array.from(new Set(student.enrollments.map((e) => e.academicYear))).sort().reverse();
  }, [student]);

  const [yearFilter, setYearFilter] = useState<string>('all');
  useEffect(() => { if (years[0] && yearFilter === 'all') setYearFilter('all'); }, [years]); // eslint-disable-line

  if (loading) {
    return (
      <>
        <Topbar title="Student" />
        <main className="p-6"><div className="max-w-5xl mx-auto h-64 rounded-2xl shimmer" /></main>
      </>
    );
  }
  if (!student) {
    return (
      <>
        <Topbar title="Student" />
        <main className="p-6 max-w-5xl mx-auto">
          <div className="text-sm text-rose-700">{error ?? 'Not found.'}</div>
          <Link href="/admin/students" className="mt-3 inline-flex items-center gap-1 text-brand-700 hover:underline"><ArrowLeft className="size-4" /> Back to students</Link>
        </main>
      </>
    );
  }

  const visibleEnrollments = yearFilter === 'all'
    ? student.enrollments
    : student.enrollments.filter((e) => e.academicYear === yearFilter);

  return (
    <>
      <Topbar title="Student" />
      <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto space-y-4">
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400 hover:text-brand-700 dark:hover:text-brand-300">
          <ArrowLeft className="size-4" /> All students
        </Link>

        <Hero student={student} />

        {/* Tabs + year filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 dark:border-ink-800">
          <div className="flex gap-1">
            <TabBtn active={tab === 'overview'}    onClick={() => setTab('overview')}><UserCog className="size-4" /> Overview</TabBtn>
            <TabBtn active={tab === 'enrollments'} onClick={() => setTab('enrollments')}><BookOpen className="size-4" /> Enrollments <Count n={student.enrollments.length} /></TabBtn>
            <TabBtn active={tab === 'grades'}      onClick={() => setTab('grades')}><Award className="size-4" /> Grades <Count n={student.enrollments.reduce((acc, e) => acc + e.grades.length, 0)} /></TabBtn>
          </div>
          {(tab !== 'overview') && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm"
            >
              <option value="all">All academic years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {tab === 'overview'    && <OverviewTab    student={student} onSaved={reload} onError={setError} />}
        {tab === 'enrollments' && <EnrollmentsTab student={student} enrollments={visibleEnrollments} reload={reload} onError={setError} />}
        {tab === 'grades'      && <GradesTab      student={student} enrollments={visibleEnrollments} reload={reload} onError={setError} />}
      </main>
    </>
  );
}

/* ───────── Shared bits ───────── */

function HeroAvatar({ name, src }: { name: string; src?: string | null }) {
  if (src) return <img src={src} alt={name} className="size-14 rounded-full object-cover ring-2 ring-white/40 shrink-0" />;
  const initials = name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '·';
  return (
    <div className="size-14 rounded-full bg-white/15 ring-2 ring-white/40 grid place-items-center text-base font-semibold shrink-0">
      {initials}
    </div>
  );
}

function Hero({ student }: { student: Student }) {
  const status = (student.status ?? 'active').toLowerCase();
  return (
    <div className="rounded-2xl bg-grad-brand text-white p-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <HeroAvatar name={student.user.name} src={student.user.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold truncate">{student.user.name}</h2>
            <Badge tone={STATUS_TONES[status] ?? 'default'}>{status}</Badge>
            {!student.user.isActive && <Badge tone="danger">disabled</Badge>}
          </div>
          <div className="text-white/85 text-sm flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="inline-flex items-center gap-1"><GraduationCap className="size-3.5" /> {student.studentNumber}</span>
            {student.user.email && <span className="inline-flex items-center gap-1"><Mail className="size-3.5" /> {student.user.email}</span>}
            {student.enrollmentYear && <span className="inline-flex items-center gap-1"><Cake className="size-3.5" /> class of {student.enrollmentYear}</span>}
            {student.program?.name && <span className="opacity-90">· {student.program.name}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-2',
        active
          ? 'border-brand-600 text-brand-700 dark:text-brand-300'
          : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="text-xs px-1.5 py-0.5 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">{n}</span>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl ${className}`}>{children}</div>;
}

/* ───────── Overview tab ───────── */

function OverviewTab({
  student, onSaved, onError,
}: { student: Student; onSaved: () => Promise<void>; onError: (m: string | null) => void }) {
  const [form, setForm] = useState({
    name: student.user.name,
    email: student.user.email,
    phone: student.user.phone ?? '',
    avatarUrl: student.user.avatarUrl ?? '',
    isActive: student.user.isActive,
    studentNumber: student.studentNumber,
    status: (student.status ?? 'active').toLowerCase(),
    enrollmentYear: student.enrollmentYear ?? null as number | null,
    birthDate: student.birthDate ? student.birthDate.slice(0, 10) : '',
    guardianName: student.guardianName ?? '',
    guardianPhone: student.guardianPhone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false); onError(null);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        avatarUrl: form.avatarUrl || null,
        isActive: form.isActive,
        studentNumber: form.studentNumber,
        status: form.status,
        enrollmentYear: form.enrollmentYear ? Number(form.enrollmentYear) : null,
        birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
        guardianName: form.guardianName || null,
        guardianPhone: form.guardianPhone || null,
      };
      await api.patch(`/students/${student.id}`, payload);
      await onSaved();
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { onError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-4">
      <form onSubmit={save} className="grid lg:grid-cols-2 gap-x-5 gap-y-3">
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <TextInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <TextInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <TextInput label="Birth date" type="date" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <TextInput label="Student #" value={form.studentNumber} onChange={(v) => setForm({ ...form, studentNumber: v })} required />
            <TextInput label="Enrollment year" type="number" value={String(form.enrollmentYear ?? '')} onChange={(v) => setForm({ ...form, enrollmentYear: v ? Number(v) : null })} />
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 capitalize"
            >
              {['active','graduated','suspended','dropped'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <MediaField label="Avatar" value={form.avatarUrl} onChange={(v) => setForm({ ...form, avatarUrl: v })} kindHint="other" hint="Profile picture." />
          <div className="grid sm:grid-cols-2 gap-3">
            <TextInput label="Guardian name" value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} />
            <TextInput label="Guardian phone" value={form.guardianPhone} onChange={(v) => setForm({ ...form, guardianPhone: v })} />
          </div>
          <label className="flex items-center gap-3 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/50">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="size-4 rounded accent-blue-600"
            />
            <span className="text-sm">Account is active (can sign in)</span>
          </label>
        </div>

        <div className="lg:col-span-2 flex items-center gap-3 pt-3 mt-1 border-t border-ink-200 dark:border-ink-800">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="size-4 animate-spin" /> Saving</> : <><Save className="size-4" /> Save changes</>}
          </Button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}

/* ───────── Enrollments tab ───────── */

function EnrollmentsTab({
  student, enrollments, reload, onError,
}: { student: Student; enrollments: Enrollment[]; reload: () => Promise<void>; onError: (m: string | null) => void }) {
  const [open, setOpen] = useState(false);

  async function remove(id: string) {
    if (!confirm('Remove this enrollment? Linked grades will be deleted as well.')) return;
    onError(null);
    try { await api.delete(`/enrollments/${id}`); await reload(); }
    catch (e: any) { onError(e.message); }
  }

  // Group by academic year for nicer reading
  const grouped = enrollments.reduce<Record<string, Enrollment[]>>((acc, e) => {
    (acc[e.academicYear] ||= []).push(e);
    return acc;
  }, {});
  const groupYears = Object.keys(grouped).sort().reverse();

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><BookOpen className="size-4 text-brand-600 dark:text-brand-400" /> Course enrollments</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">Courses this student is registered to, per academic year.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add enrollment</Button>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 dark:border-ink-700 p-8 text-center text-ink-500 dark:text-ink-400 text-sm">
          No enrollments {student.enrollments.length > 0 ? 'for the selected year.' : 'yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {groupYears.map((year) => (
            <div key={year}>
              <div className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">Academic year {year}</div>
              <ul className="divide-y divide-ink-100 dark:divide-ink-800 rounded-xl border border-ink-200 dark:border-ink-800 overflow-hidden">
                {grouped[year].map((e) => {
                  const avg = computeAvg(e.grades);
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-3 py-3 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition">
                      <div className="size-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{e.course.code}</code>{e.course.title}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-2 flex-wrap">
                          {e.semester && <span>{e.semester}</span>}
                          <Badge tone={e.status === 'enrolled' ? 'success' : 'default'}>{e.status}</Badge>
                          {e.teacher?.user?.name && <span className="inline-flex items-center gap-1"><UsersIcon className="size-3" /> {e.teacher.user.name}</span>}
                          <span>· {e.grades.length} grade{e.grades.length !== 1 ? 's' : ''}</span>
                          {avg !== null && <span className="text-brand-700 dark:text-brand-300 font-medium">avg {avg.toFixed(1)}/100</span>}
                        </div>
                      </div>
                      <button onClick={() => remove(e.id)} className="size-8 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600" title="Remove enrollment">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <EnrollmentModal open={open} onClose={() => setOpen(false)} studentId={student.id} onSaved={async () => { setOpen(false); await reload(); }} onError={onError} />
    </Card>
  );
}

function EnrollmentModal({
  open, onClose, studentId, onSaved, onError,
}: { open: boolean; onClose: () => void; studentId: string; onSaved: () => void | Promise<void>; onError: (m: string | null) => void }) {
  const thisYear = new Date().getFullYear();
  const defaultYear = `${thisYear}-${thisYear + 1}`;
  const [form, setForm] = useState({ courseId: '', teacherId: '', academicYear: defaultYear, semester: 'S1' });
  const [busy, setBusy] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm({ courseId: '', teacherId: '', academicYear: defaultYear, semester: 'S1' });
    (async () => {
      try {
        const [c, t] = await Promise.all([
          api.get('/courses?limit=100'),
          api.get('/teachers?limit=100'),
        ]);
        setCourses(c.items ?? []);
        setTeachers(t.items ?? []);
      } catch (e: any) { onError(e.message); }
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); onError(null);
    try {
      await api.post('/enrollments', {
        studentId,
        courseId: form.courseId,
        teacherId: form.teacherId || null,
        academicYear: form.academicYear,
        semester: form.semester || null,
      });
      await onSaved();
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add enrollment"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (document.getElementById('enroll-form') as HTMLFormElement)?.requestSubmit()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
          </Button>
        </>
      }
    >
      <form id="enroll-form" onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Course *</span>
          <select
            value={form.courseId} required
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100"
          >
            <option value="">Select a course…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Teacher</span>
          <select
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100"
          >
            <option value="">— Unassigned —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}{t.title ? ` (${t.title})` : ''}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Academic year" value={form.academicYear} onChange={(v) => setForm({ ...form, academicYear: v })} placeholder="2025-2026" required />
          <label className="block">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Semester</span>
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100"
            >
              {['S1', 'S2', 'Full year', ''].map((s) => <option key={s} value={s}>{s || '—'}</option>)}
            </select>
          </label>
        </div>
      </form>
    </Modal>
  );
}

/* ───────── Grades tab ───────── */

function GradesTab({
  enrollments, reload, onError,
}: { student: Student; enrollments: Enrollment[]; reload: () => Promise<void>; onError: (m: string | null) => void }) {
  const [adding, setAdding] = useState<Enrollment | null>(null);
  const [editing, setEditing] = useState<Grade | null>(null);

  async function remove(id: string) {
    if (!confirm('Delete this grade?')) return;
    onError(null);
    try { await api.delete(`/grades/${id}`); await reload(); }
    catch (e: any) { onError(e.message); }
  }

  const totalAvg = useMemo(() => {
    const allGrades = enrollments.flatMap((e) => e.grades);
    if (allGrades.length === 0) return null;
    const pct = allGrades.map((g) => (g.score / g.maxScore) * 100);
    return pct.reduce((a, b) => a + b, 0) / pct.length;
  }, [enrollments]);

  if (enrollments.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-ink-500 dark:text-ink-400">
        No enrollments for the selected year — enroll the student in a course first.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4 flex items-center gap-4">
        <div className="size-10 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center">
          <TrendingUp className="size-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Overall average</div>
          <div className="text-xs text-ink-500 dark:text-ink-400">Across all evaluations in the selected scope.</div>
        </div>
        <div className="text-2xl font-bold tabular-nums">
          {totalAvg === null ? '—' : `${totalAvg.toFixed(1)}/100`}
        </div>
      </Card>

      {enrollments.map((e) => {
        const avg = computeAvg(e.grades);
        return (
          <Card key={e.id} className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="size-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
                <ClipboardList className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate"><code className="text-xs text-ink-500 dark:text-ink-400 mr-2">{e.course.code}</code>{e.course.title}</div>
                <div className="text-xs text-ink-500 dark:text-ink-400 flex flex-wrap items-center gap-x-2">
                  <span>{e.academicYear}</span>
                  {e.semester && <span>· {e.semester}</span>}
                  {e.teacher?.user?.name && <span>· {e.teacher.user.name}</span>}
                  {avg !== null && <span className="text-brand-700 dark:text-brand-300 font-medium">· avg {avg.toFixed(1)}/100</span>}
                </div>
              </div>
              <Button onClick={() => setAdding(e)}><Plus className="size-4" /> Evaluation</Button>
            </div>

            {e.grades.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink-200 dark:border-ink-700 p-4 text-center text-xs text-ink-500 dark:text-ink-400">
                No evaluations yet for this course.
              </div>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {e.grades.map((g) => {
                  const pct = (g.score / g.maxScore) * 100;
                  const tone =
                    pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                    pct >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                'text-rose-600 dark:text-rose-400';
                  return (
                    <li key={g.id} className="py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{g.assessment}</div>
                        {g.comment && <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{g.comment}</div>}
                        <div className="text-[11px] text-ink-400 dark:text-ink-500">{new Date(g.gradedAt).toLocaleDateString()}</div>
                      </div>
                      <div className={`text-right tabular-nums ${tone}`}>
                        <div className="text-sm font-semibold">{g.score}/{g.maxScore}</div>
                        <div className="text-[11px]">{pct.toFixed(0)}%</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(g)} className="size-8 grid place-items-center rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500" title="Edit">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => remove(g.id)} className="size-8 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}

      <GradeModal
        open={!!adding || !!editing}
        enrollment={adding}
        grade={editing}
        onClose={() => { setAdding(null); setEditing(null); }}
        onSaved={async () => { setAdding(null); setEditing(null); await reload(); }}
        onError={onError}
      />
    </div>
  );
}

function GradeModal({
  open, enrollment, grade, onClose, onSaved, onError,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  grade: Grade | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onError: (m: string | null) => void;
}) {
  const isEdit = !!grade;
  const [form, setForm] = useState({ assessment: '', score: '', maxScore: '100', comment: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (grade) setForm({ assessment: grade.assessment, score: String(grade.score), maxScore: String(grade.maxScore), comment: grade.comment ?? '' });
    else       setForm({ assessment: '', score: '', maxScore: '100', comment: '' });
  }, [open, grade]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); onError(null);
    try {
      const payload = {
        assessment: form.assessment,
        score: Number(form.score),
        maxScore: Number(form.maxScore) || 100,
        comment: form.comment || null,
      };
      if (isEdit && grade) await api.patch(`/grades/${grade.id}`, payload);
      else if (enrollment) await api.post('/grades', { ...payload, enrollmentId: enrollment.id });
      await onSaved();
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  const ctxLabel = grade
    ? 'Edit evaluation'
    : enrollment ? `New evaluation — ${enrollment.course.code}` : 'New evaluation';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ctxLabel}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (document.getElementById('grade-form') as HTMLFormElement)?.requestSubmit()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : isEdit ? 'Save' : 'Add'}
          </Button>
        </>
      }
    >
      <form id="grade-form" onSubmit={submit} className="space-y-4">
        <TextInput label="Assessment" value={form.assessment} onChange={(v) => setForm({ ...form, assessment: v })} required placeholder="midterm, quiz 1, final…" />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Score" type="number" value={form.score} onChange={(v) => setForm({ ...form, score: v })} required />
          <TextInput label="Out of" type="number" value={form.maxScore} onChange={(v) => setForm({ ...form, maxScore: v })} required />
        </div>
        <label className="block">
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Comment</span>
          <textarea
            rows={3}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 resize-y"
          />
        </label>
      </form>
    </Modal>
  );
}

/* ───────── Utilities ───────── */

function computeAvg(grades: Grade[]): number | null {
  if (!grades.length) return null;
  const pcts = grades.map((g) => (g.score / g.maxScore) * 100);
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}
