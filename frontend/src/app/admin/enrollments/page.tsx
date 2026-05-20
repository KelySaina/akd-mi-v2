'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Check, X as XIcon, ClipboardList, Trash2,
  Users as UsersIcon, BookOpen, Sparkles, CalendarRange, GraduationCap,
} from 'lucide-react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Avatar, Badge } from '@/components/DataTable';
import { Modal, TextInput, SelectInput, Button } from '@/components/ui';
import { useDialog } from '@/components/DialogProvider';
import { api } from '@/lib/api';

/* ─── Types ─── */
type CourseLite = { id: string; code: string; title: string; credits: number; teacherId: string | null };
type StudentLite = { id: string; studentNumber: string; user: { id: string; name: string; email: string; avatarUrl: string | null } };
type TeacherLite = { id: string; user: { name: string; email: string } };
type Enrollment = {
  id: string; studentId: string; courseId: string; teacherId: string | null;
  academicYear: string; semester: string | null; status: string; createdAt: string;
  course: CourseLite;
  student: StudentLite;
  teacher: TeacherLite | null;
};

const STATUS_TONES: Record<string, 'default' | 'success' | 'warn' | 'danger' | 'brand'> = {
  pending: 'warn', enrolled: 'success', rejected: 'danger',
  dropped: 'default', withdrawn: 'default', completed: 'brand',
};
const STATUS_VALUES = ['pending', 'enrolled', 'rejected', 'dropped', 'withdrawn', 'completed'] as const;

function defaultAcademicYear() {
  const now = new Date();
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // school year starts ~Aug
  return `${y}-${y + 1}`;
}

export default function EnrollmentsPage() {
  const dialog = useDialog();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  // bulk modal
  const [bulkOpen, setBulkOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (yearFilter !== 'all') qs.set('academicYear', yearFilter);
      if (courseFilter !== 'all') qs.set('courseId', courseFilter);
      const res = await api.get<{ items: Enrollment[]; total: number }>(`/enrollments?${qs}`);
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page, statusFilter, yearFilter, courseFilter]); // eslint-disable-line

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.academicYear))).sort().reverse(),
    [rows],
  );

  const visible = rows.filter((r) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      r.student.user.name.toLowerCase().includes(needle) ||
      r.student.user.email.toLowerCase().includes(needle) ||
      r.student.studentNumber.toLowerCase().includes(needle) ||
      r.course.code.toLowerCase().includes(needle) ||
      r.course.title.toLowerCase().includes(needle)
    );
  });

  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  async function setStatus(id: string, status: string) {
    try { await api.patch(`/enrollments/${id}`, { status }); await load(); }
    catch (e: any) { await dialog.alert({ title: 'Update failed', message: e.message, tone: 'danger' }); }
  }
  async function removeEnrollment(e: Enrollment) {
    const ok = await dialog.confirm({
      title: 'Delete enrollment?',
      message: `Permanently delete ${e.student.user.name}’s enrollment in ${e.course.code}? This cannot be undone.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try { await api.delete(`/enrollments/${e.id}`); await load(); }
    catch (err: any) { await dialog.alert({ title: 'Delete failed', message: err.message, tone: 'danger' }); }
  }

  return (
    <>
      <Topbar
        title="Enrollments"
        action={<PrimaryButton onClick={() => setBulkOpen(true)}>Bulk enroll</PrimaryButton>}
      />
      <main className="p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {pendingCount > 0 && statusFilter !== 'pending' && (
          <button
            onClick={() => setStatusFilter('pending')}
            className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm flex items-center justify-between hover:bg-amber-100 dark:hover:bg-amber-500/20 transition"
          >
            <span className="inline-flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <ClipboardList className="size-4" />
              {pendingCount} enrollment request{pendingCount === 1 ? '' : 's'} awaiting review
            </span>
            <span className="text-amber-700 dark:text-amber-300">Review →</span>
          </button>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 flex-1 min-w-[14rem]">
            <Search className="size-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student, code, or title…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm capitalize"
          >
            <option value="all">All statuses</option>
            {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm"
          >
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="text-sm text-ink-500 dark:text-ink-400 ml-auto inline-flex items-center gap-1">
            <Filter className="size-3.5" /> {visible.length} of {total}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-8 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 rounded shimmer" />)}
          </div>
        ) : (
          <DataTable
            rows={visible}
            empty="No enrollments match these filters."
            columns={[
              {
                key: 'student',
                header: 'Student',
                render: (r) => (
                  <Link href={`/admin/students/${r.student.id}`} className="flex items-center gap-3 group">
                    <Avatar name={r.student.user.name} src={r.student.user.avatarUrl} />
                    <div>
                      <div className="font-medium group-hover:text-brand-700 dark:group-hover:text-brand-300 transition">{r.student.user.name}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">{r.student.studentNumber}</div>
                    </div>
                  </Link>
                ),
              },
              {
                key: 'course',
                header: 'Course',
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.course.title}</div>
                    <div className="text-xs text-ink-500 dark:text-ink-400">{r.course.code} · {r.course.credits} cr</div>
                  </div>
                ),
              },
              { key: 'year', header: 'Year', render: (r) => <span className="text-sm">{r.academicYear}{r.semester ? ` · ${r.semester}` : ''}</span> },
              {
                key: 'teacher',
                header: 'Teacher',
                render: (r) => r.teacher ? <span className="text-sm">{r.teacher.user.name}</span> : <span className="text-ink-400 text-sm">—</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge tone={STATUS_TONES[r.status] ?? 'default'}>{r.status}</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div className="flex items-center justify-end gap-1">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setStatus(r.id, 'enrolled')}
                          title="Approve"
                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        ><Check className="size-4" /></button>
                        <button
                          onClick={() => setStatus(r.id, 'rejected')}
                          title="Reject"
                          className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        ><XIcon className="size-4" /></button>
                      </>
                    )}
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                      className="px-2 py-1 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-xs capitalize"
                      title="Change status"
                    >
                      {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => removeEnrollment(r)}
                      title="Delete"
                      className="p-1.5 rounded-md text-ink-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    ><Trash2 className="size-4" /></button>
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-ink-500 dark:text-ink-400">
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <Button variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Next</Button>
            </div>
          </div>
        )}
      </main>

      <BulkEnrollModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onDone={() => { setBulkOpen(false); load(); }}
        onError={setError}
      />
    </>
  );
}

/* ─────────────── Bulk Enroll modal (N × M matrix) ─────────────── */

function BulkEnrollModal({
  open, onClose, onDone, onError,
}: { open: boolean; onClose: () => void; onDone: () => void; onError: (msg: string) => void }) {
  const dialog = useDialog();
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [studentQ, setStudentQ] = useState('');
  const [courseQ, setCourseQ] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear());
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      api.get<{ items: StudentLite[] }>('/students?limit=100'),
      api.get<{ items: CourseLite[] }>('/courses?limit=100'),
    ])
      .then(([s, c]) => {
        setStudents(s.items ?? []);
        setCourses(c.items ?? []);
      })
      .catch((e: any) => onError(e.message))
      .finally(() => setLoading(false));
  }, [open, onError]);

  // reset when closed
  useEffect(() => {
    if (!open) {
      setSelectedStudents(new Set());
      setSelectedCourses(new Set());
      setStudentQ('');
      setCourseQ('');
      setSemester('');
    }
  }, [open]);

  const filteredStudents = students.filter((s) => {
    if (!studentQ.trim()) return true;
    const n = studentQ.toLowerCase();
    return s.user.name.toLowerCase().includes(n)
      || s.user.email.toLowerCase().includes(n)
      || s.studentNumber.toLowerCase().includes(n);
  });
  const filteredCourses = courses.filter((c) => {
    if (!courseQ.trim()) return true;
    const n = courseQ.toLowerCase();
    return c.code.toLowerCase().includes(n) || c.title.toLowerCase().includes(n);
  });

  const pairCount = selectedStudents.size * selectedCourses.size;
  const canSubmit = pairCount > 0 && academicYear.length >= 4 && !submitting;

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSet(next);
  }
  function selectAllVisible(items: { id: string }[], current: Set<string>, set: (s: Set<string>) => void) {
    const ids = items.map((i) => i.id);
    const allSelected = ids.length > 0 && ids.every((id) => current.has(id));
    const next = new Set(current);
    if (allSelected) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    set(next);
  }
  function clearSet(set: (s: Set<string>) => void) { set(new Set()); }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await api.post<{ createdCount: number; skippedCount: number; skipped: any[] }>('/enrollments/bulk', {
        studentIds: Array.from(selectedStudents),
        courseIds: Array.from(selectedCourses),
        academicYear,
        semester: semester || null,
      });
      await dialog.alert({
        title: 'Bulk enrollment complete',
        message: `${res.createdCount} enrollment${res.createdCount === 1 ? '' : 's'} created${res.skippedCount > 0 ? `, ${res.skippedCount} skipped (already enrolled).` : '.'}`,
        tone: res.createdCount > 0 ? 'success' : 'info',
      });
      onDone();
    } catch (e: any) {
      await dialog.alert({ title: 'Bulk enroll failed', message: e.message, tone: 'danger' });
    } finally { setSubmitting(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="3xl"
      title="Bulk enroll students into courses"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-sm text-ink-600 dark:text-ink-300 inline-flex items-center gap-2">
            <Sparkles className="size-4 text-brand-500" />
            {pairCount > 0 ? (
              <span><b className="text-ink-900 dark:text-ink-100">{pairCount}</b> enrollment{pairCount === 1 ? '' : 's'} will be created
                <span className="text-ink-400"> · {selectedStudents.size} × {selectedCourses.size}</span></span>
            ) : (
              <span className="text-ink-500">Pick at least one student and one course</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit}>
              {submitting ? 'Enrolling…' : pairCount > 0 ? `Enroll ${pairCount}` : 'Enroll'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step 1 — academic context */}
        <section className="rounded-xl border border-ink-200 dark:border-ink-700 bg-gradient-to-br from-brand-50/60 to-transparent dark:from-brand-500/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-ink-700 dark:text-ink-200">
            <CalendarRange className="size-4 text-brand-600 dark:text-brand-400" />
            Academic context
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="Academic year" value={academicYear} onChange={setAcademicYear} placeholder="2025-2026" required />
            <SelectInput
              label="Semester"
              value={semester}
              onChange={setSemester}
              placeholder="—"
              options={[{ value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }, { value: 'S3', label: 'S3' }, { value: 'S4', label: 'S4' }]}
            />
          </div>
        </section>

        {/* Step 2 — pick students × courses */}
        {loading ? (
          <div className="h-72 rounded-xl shimmer" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PickerColumn
              title="Students"
              icon={<UsersIcon className="size-4" />}
              accent="emerald"
              selected={selectedStudents.size}
              total={students.length}
              visibleCount={filteredStudents.length}
              query={studentQ}
              onQuery={setStudentQ}
              onSelectAllVisible={() => selectAllVisible(filteredStudents, selectedStudents, setSelectedStudents)}
              onClear={() => clearSet(setSelectedStudents)}
              empty={studentQ ? 'No students match your search.' : 'No students yet — create one in the Students page.'}
            >
              {filteredStudents.map((s) => {
                const checked = selectedStudents.has(s.id);
                return (
                  <PickerRow
                    key={s.id}
                    checked={checked}
                    onToggle={() => toggle(selectedStudents, setSelectedStudents, s.id)}
                    accent="emerald"
                    leading={<Avatar name={s.user.name} src={s.user.avatarUrl} />}
                    title={s.user.name}
                    subtitle={
                      <span className="inline-flex items-center gap-1.5">
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">{s.studentNumber}</code>
                        <span className="truncate">{s.user.email}</span>
                      </span>
                    }
                  />
                );
              })}
            </PickerColumn>

            <PickerColumn
              title="Courses"
              icon={<BookOpen className="size-4" />}
              accent="brand"
              selected={selectedCourses.size}
              total={courses.length}
              visibleCount={filteredCourses.length}
              query={courseQ}
              onQuery={setCourseQ}
              onSelectAllVisible={() => selectAllVisible(filteredCourses, selectedCourses, setSelectedCourses)}
              onClear={() => clearSet(setSelectedCourses)}
              empty={courseQ ? 'No courses match your search.' : 'No courses yet — create one in the Courses page.'}
            >
              {filteredCourses.map((c) => {
                const checked = selectedCourses.has(c.id);
                return (
                  <PickerRow
                    key={c.id}
                    checked={checked}
                    onToggle={() => toggle(selectedCourses, setSelectedCourses, c.id)}
                    accent="brand"
                    leading={
                      <div className="size-9 shrink-0 grid place-items-center rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300">
                        <BookOpen className="size-4" />
                      </div>
                    }
                    title={c.title}
                    subtitle={
                      <span className="inline-flex items-center gap-1.5">
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">{c.code}</code>
                        <span className="text-ink-500">{c.credits} cr</span>
                      </span>
                    }
                  />
                );
              })}
            </PickerColumn>
          </div>
        )}

        <p className="text-[11px] text-ink-500 dark:text-ink-400 px-1 inline-flex items-center gap-1.5">
          <GraduationCap className="size-3.5" />
          Existing enrollments for <b className="font-medium">{academicYear || 'this year'}</b> will be skipped automatically.
          The course's default teacher is assigned unless you change it later.
        </p>
      </div>
    </Modal>
  );
}

/* ─── Picker primitives ─── */

function PickerColumn({
  title, icon, accent, selected, total, visibleCount, query, onQuery,
  onSelectAllVisible, onClear, empty, children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: 'brand' | 'emerald';
  selected: number;
  total: number;
  visibleCount: number;
  query: string;
  onQuery: (v: string) => void;
  onSelectAllVisible: () => void;
  onClear: () => void;
  empty: string;
  children: React.ReactNode;
}) {
  const accentBadge = accent === 'emerald'
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300';
  const accentIcon = accent === 'emerald'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-brand-600 dark:text-brand-400';

  const rows = Array.isArray(children) ? (children as any[]) : [children];
  const hasRows = rows.filter(Boolean).length > 0;

  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800/30 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-ink-200 dark:border-ink-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={accentIcon}>{icon}</span>
          <span className="text-sm font-medium truncate">{title}</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${accentBadge}`}>
            {selected} / {total}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selected > 0 && (
            <button onClick={onClear} className="text-[11px] text-ink-500 hover:text-rose-600 dark:hover:text-rose-400 px-1.5 py-0.5 rounded">
              Clear
            </button>
          )}
          <button
            onClick={onSelectAllVisible}
            className="text-[11px] text-brand-700 dark:text-brand-300 hover:underline px-1.5 py-0.5 rounded"
            disabled={visibleCount === 0}
          >
            Select all{query ? ' visible' : ''}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-ink-200 dark:border-ink-700 bg-ink-50/60 dark:bg-ink-900/30">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
          <Search className="size-3.5 text-ink-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400"
          />
          {query && (
            <button onClick={() => onQuery('')} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul className="overflow-y-auto h-72 p-1.5 space-y-0.5">
        {hasRows
          ? children
          : <li className="text-xs text-ink-500 dark:text-ink-400 px-3 py-10 text-center">{empty}</li>}
      </ul>
    </div>
  );
}

function PickerRow({
  checked, onToggle, accent, leading, title, subtitle,
}: {
  checked: boolean;
  onToggle: () => void;
  accent: 'brand' | 'emerald';
  leading: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}) {
  const activeRing = accent === 'emerald'
    ? 'bg-emerald-50/80 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/30'
    : 'bg-brand-50/80 dark:bg-brand-500/10 ring-1 ring-brand-200 dark:ring-brand-500/30';
  const checkBg = accent === 'emerald'
    ? 'bg-emerald-500 border-emerald-500'
    : 'bg-brand-500 border-brand-500';

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-lg transition ${
          checked ? activeRing : 'hover:bg-ink-50 dark:hover:bg-ink-800/60'
        }`}
      >
        <span
          className={`size-4 rounded border flex items-center justify-center shrink-0 transition ${
            checked ? checkBg : 'border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900'
          }`}
          aria-hidden
        >
          {checked && <Check className="size-3 text-white" strokeWidth={3} />}
        </span>
        {leading}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate text-ink-900 dark:text-ink-100">{title}</span>
          <span className="block text-[11px] text-ink-500 dark:text-ink-400 truncate">{subtitle}</span>
        </span>
      </button>
    </li>
  );
}
