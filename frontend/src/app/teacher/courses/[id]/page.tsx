'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, Pencil, Trash2, Loader2, Award, TrendingUp, Users as UsersIcon } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Avatar, Badge } from '@/components/DataTable';
import { Modal, TextInput, Button } from '@/components/ui';
import { api } from '@/lib/api';

type Course = { id: string; code: string; title: string; credits: number; description?: string | null };
type Grade = { id: string; enrollmentId: string; studentId: string; assessment: string; score: number; maxScore: number; comment: string | null; gradedAt: string };
type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  teacherId: string | null;
  academicYear: string;
  semester: string | null;
  status: string;
  course: Course;
  student: { id: string; studentNumber: string; user: { id: string; name: string; email: string; avatarUrl: string | null } };
};

export default function TeacherCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [gradesByEnrollment, setGradesByEnrollment] = useState<Record<string, Grade[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Modal state
  const [modal, setModal] = useState<{ enrollment: Enrollment; grade?: Grade } | null>(null);

  async function load() {
    setError(null);
    try {
      // 1) course meta
      const c = await api.get<Course>(`/courses/${courseId}`);
      setCourse(c);
      // 2) my enrollments scoped server-side to me; filter to this course
      const all = await api.get<Enrollment[]>(`/enrollments?courseId=${courseId}`);
      setEnrollments(all);
      // 3) grades per enrollment in parallel
      const entries = await Promise.all(
        all.map(async (e) => [e.id, await api.get<Grade[]>(`/grades?enrollmentId=${e.id}`)] as const),
      );
      const map: Record<string, Grade[]> = {};
      entries.forEach(([id, gs]) => { map[id] = gs; });
      setGradesByEnrollment(map);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { (async () => { setLoading(true); await load(); setLoading(false); })(); }, [courseId]); // eslint-disable-line

  const years = useMemo(
    () => Array.from(new Set(enrollments.map((e) => e.academicYear))).sort().reverse(),
    [enrollments],
  );
  useEffect(() => { if (years.length && yearFilter === 'all') setYearFilter(years[0]); }, [years]); // eslint-disable-line

  const visible = yearFilter === 'all' ? enrollments : enrollments.filter((e) => e.academicYear === yearFilter);

  // Stats for selected year
  const allGrades = visible.flatMap((e) => gradesByEnrollment[e.id] ?? []);
  const overall = computeAvg(allGrades);

  async function deleteGrade(g: Grade) {
    if (!confirm('Delete this evaluation?')) return;
    setError(null);
    try { await api.delete(`/grades/${g.id}`); await load(); }
    catch (e: any) { setError(e.message); }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Course" />
        <main className="p-6"><div className="max-w-5xl mx-auto h-64 rounded-2xl shimmer" /></main>
      </>
    );
  }
  if (!course) {
    return (
      <>
        <Topbar title="Course" />
        <main className="p-6 max-w-5xl mx-auto">
          <div className="text-sm text-rose-700">{error ?? 'Course not found.'}</div>
          <Link href="/teacher/courses" className="mt-3 inline-flex items-center gap-1 text-brand-700 hover:underline"><ArrowLeft className="size-4" /> Back</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Course" />
      <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto space-y-4">
        <Link href="/teacher/courses" className="inline-flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400 hover:text-amber-700 dark:hover:text-amber-300">
          <ArrowLeft className="size-4" /> All my courses
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-xl bg-white/15 ring-2 ring-white/40 grid place-items-center shrink-0">
              <BookOpen className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wider text-white/70"><code>{course.code}</code> · {course.credits} credit{course.credits !== 1 ? 's' : ''}</div>
              <h2 className="text-xl font-bold truncate">{course.title}</h2>
              {course.description && <p className="text-white/85 text-sm mt-0.5 truncate">{course.description}</p>}
            </div>
          </div>
        </div>

        {/* Filter + summary */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm"
          >
            <option value="all">All academic years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="text-sm text-ink-500 dark:text-ink-400 inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" /> {visible.length} student{visible.length !== 1 ? 's' : ''}
          </div>
          {overall !== null && (
            <div className="text-sm text-amber-700 dark:text-amber-300 font-medium inline-flex items-center gap-1 ml-auto">
              <TrendingUp className="size-3.5" /> Class average: {overall.toFixed(1)}/100
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Roster */}
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-12 text-center text-sm text-ink-500 dark:text-ink-400">
            No students enrolled in this course {yearFilter !== 'all' ? `for ${yearFilter}.` : '.'}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((e) => {
              const gs = gradesByEnrollment[e.id] ?? [];
              const avg = computeAvg(gs);
              return (
                <div key={e.id} className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={e.student.user.name} src={e.student.user.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{e.student.user.name}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 flex flex-wrap items-center gap-x-2">
                        <code>{e.student.studentNumber}</code>
                        <span>· {e.academicYear}</span>
                        {e.semester && <span>· {e.semester}</span>}
                        <Badge tone={e.status === 'enrolled' ? 'success' : 'default'}>{e.status}</Badge>
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">{avg.toFixed(1)}/100</div>
                        <div className="text-[11px] text-ink-400">average</div>
                      </div>
                    )}
                    <Button onClick={() => setModal({ enrollment: e })}><Plus className="size-4" /> Evaluation</Button>
                  </div>

                  {gs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-ink-200 dark:border-ink-700 p-4 text-center text-xs text-ink-500 dark:text-ink-400">
                      <Award className="size-4 inline-block mr-1" /> No evaluations recorded for this student yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                      {gs.map((g) => {
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
                            <div className="flex items-center gap-1">
                              <button onClick={() => setModal({ enrollment: e, grade: g })} className="size-8 grid place-items-center rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500" title="Edit"><Pencil className="size-4" /></button>
                              <button onClick={() => deleteGrade(g)} className="size-8 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600" title="Delete"><Trash2 className="size-4" /></button>
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

        <GradeModal
          open={!!modal}
          enrollment={modal?.enrollment ?? null}
          grade={modal?.grade ?? null}
          onClose={() => setModal(null)}
          onSaved={async () => { setModal(null); await load(); }}
          onError={setError}
        />
      </main>
    </>
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={grade ? 'Edit evaluation' : (enrollment ? `New evaluation — ${enrollment.student.user.name}` : 'New evaluation')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (document.getElementById('grade-form') as HTMLFormElement)?.requestSubmit()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : grade ? 'Save' : 'Add'}
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
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-500/30 resize-y"
          />
        </label>
      </form>
    </Modal>
  );
}

function computeAvg(grades: { score: number; maxScore: number }[]): number | null {
  if (!grades.length) return null;
  const pcts = grades.map((g) => (g.score / g.maxScore) * 100);
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}
