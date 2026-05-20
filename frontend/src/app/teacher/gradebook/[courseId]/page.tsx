'use client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, Trash2, Pencil, ClipboardList } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Avatar } from '@/components/DataTable';
import { Modal, TextInput, Button, FormSection, FormGrid } from '@/components/ui';
import { useDialog } from '@/components/DialogProvider';
import { api } from '@/lib/api';

type Course = { id: string; code: string; title: string; credits: number };
type Assessment = { id: string; courseId: string; name: string; maxScore: number; weight: number; sortOrder: number };
type Grade = {
    id: string;
    enrollmentId: string;
    studentId: string;
    assessmentId: string | null;
    assessment: string;
    score: number;
    maxScore: number;
    comment: string | null;
    gradedAt: string;
};
type Enrollment = {
    id: string; studentId: string; courseId: string; academicYear: string; semester: string | null; status: string;
    student: { id: string; studentNumber: string; user: { id: string; name: string; email: string; avatarUrl: string | null } };
};

function pctOf(g: Grade) { return (g.score / g.maxScore) * 100; }
function weightedAvgPct(gs: Grade[], assessments: Assessment[]) {
    const byId = new Map(assessments.map((a) => [a.id, a]));
    let num = 0, den = 0;
    for (const g of gs) {
        const a = g.assessmentId ? byId.get(g.assessmentId) : null;
        const w = a?.weight ?? 1;
        num += pctOf(g) * w;
        den += w;
    }
    return den > 0 ? num / den : null;
}
function tone(pct: number | null) {
    if (pct == null) return '';
    if (pct >= 80) return 'text-emerald-700 dark:text-emerald-300';
    if (pct >= 60) return 'text-amber-700 dark:text-amber-300';
    return 'text-rose-700 dark:text-rose-300';
}

export default function GradebookCoursePage() {
    const params = useParams<{ courseId: string }>();
    const sp = useSearchParams();
    const courseId = params.courseId;
    const initialYear = sp.get('year');
    const dialog = useDialog();

    const [course, setCourse] = useState<Course | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<string>(initialYear ?? 'all');
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<Assessment | null>(null);
    const [form, setForm] = useState({ name: '', maxScore: '100', weight: '1' });

    const load = useCallback(async () => {
        setError(null);
        try {
            const [c, asses, enrRes, grRes] = await Promise.all([
                api.get<Course>(`/courses/${courseId}`),
                api.get<Assessment[]>(`/assessments?courseId=${courseId}`),
                api.get<{ items: Enrollment[] } | Enrollment[]>(`/enrollments?courseId=${courseId}&limit=200`),
                api.get<Grade[]>(`/grades?courseId=${courseId}`),
            ]);
            setCourse(c);
            setAssessments(Array.isArray(asses) ? asses : []);
            const all = (Array.isArray(enrRes) ? enrRes : (enrRes?.items ?? [])).filter((e) => e.status === 'enrolled' || e.status === 'completed');
            setEnrollments(all);
            setGrades(Array.isArray(grRes) ? grRes : []);
        } catch (e: any) { setError(e.message); }
    }, [courseId]);

    useEffect(() => { (async () => { setLoading(true); await load(); setLoading(false); })(); }, [load]);

    const years = useMemo(() => Array.from(new Set(enrollments.map((e) => e.academicYear))).sort().reverse(), [enrollments]);
    const visible = useMemo(
        () => yearFilter === 'all' ? enrollments : enrollments.filter((e) => e.academicYear === yearFilter),
        [enrollments, yearFilter]
    );

    const gradesByEnr = useMemo(() => {
        const m = new Map<string, Map<string, Grade>>();
        for (const g of grades) {
            if (!g.assessmentId) continue;
            let inner = m.get(g.enrollmentId);
            if (!inner) { inner = new Map(); m.set(g.enrollmentId, inner); }
            inner.set(g.assessmentId, g);
        }
        return m;
    }, [grades]);

    function cellGrade(enrollmentId: string, assessmentId: string): Grade | undefined {
        return gradesByEnr.get(enrollmentId)?.get(assessmentId);
    }

    async function commitCell(enrollment: Enrollment, asses: Assessment, raw: string) {
        const trimmed = raw.trim();
        const existing = cellGrade(enrollment.id, asses.id);
        const key = `${enrollment.id}|${asses.id}`;
        setSavingKey(key);
        try {
            if (trimmed === '') {
                if (existing) {
                    await api.delete(`/grades/${existing.id}`);
                }
            } else {
                const score = Number(trimmed.replace(',', '.'));
                if (Number.isNaN(score)) { setError('Score must be a number'); return; }
                if (existing) {
                    if (score === existing.score) return;
                    await api.patch(`/grades/${existing.id}`, { score });
                } else {
                    await api.post('/grades', {
                        enrollmentId: enrollment.id,
                        assessmentId: asses.id,
                        score,
                    });
                }
            }
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setSavingKey(null); }
    }

    function openAdd() {
        setEditing(null);
        setForm({ name: '', maxScore: '100', weight: '1' });
        setAddOpen(true);
    }
    function openEdit(a: Assessment) {
        setEditing(a);
        setForm({ name: a.name, maxScore: String(a.maxScore), weight: String(a.weight) });
        setAddOpen(true);
    }
    async function saveAssessment() {
        const name = form.name.trim();
        if (!name) { setError('Name is required'); return; }
        const maxScore = Number(form.maxScore);
        const weight = Number(form.weight);
        if (!Number.isFinite(maxScore) || maxScore <= 0) { setError('Max score must be > 0'); return; }
        if (!Number.isFinite(weight) || weight < 0) { setError('Weight must be ≥ 0'); return; }
        try {
            if (editing) {
                await api.patch(`/assessments/${editing.id}`, { name, maxScore, weight });
            } else {
                await api.post('/assessments', {
                    courseId,
                    name,
                    maxScore,
                    weight,
                    sortOrder: assessments.length,
                });
            }
            setAddOpen(false);
            await load();
        } catch (e: any) { setError(e.message); }
    }
    async function removeAssessment(a: Assessment) {
        const usedCount = grades.filter((g) => g.assessmentId === a.id).length;
        const ok = await dialog.confirm({
            title: `Remove “${a.name}”?`,
            message: usedCount > 0
                ? `This will also delete ${usedCount} grade${usedCount === 1 ? '' : 's'} recorded under this assessment.`
                : 'No grades are recorded yet. The column will be removed.',
            tone: 'danger',
            confirmLabel: 'Remove',
        });
        if (!ok) return;
        try {
            await api.delete(`/assessments/${a.id}`);
            await load();
        } catch (e: any) { setError(e.message); }
    }

    if (loading) {
        return (
            <>
                <Topbar title="Gradebook" />
                <main className="p-6"><div className="max-w-6xl mx-auto h-64 rounded-2xl shimmer" /></main>
            </>
        );
    }
    if (!course) {
        return (
            <>
                <Topbar title="Gradebook" />
                <main className="p-6 max-w-5xl mx-auto">
                    <div className="text-sm text-rose-700">{error ?? 'Course not found.'}</div>
                    <Link href="/teacher/gradebook" className="mt-3 inline-flex items-center gap-1 text-brand-700 hover:underline"><ArrowLeft className="size-4" /> Back to gradebook</Link>
                </main>
            </>
        );
    }

    return (
        <>
            <Topbar title="Gradebook" />
            <main className="p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
                <Link href="/teacher/gradebook" className="inline-flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400 hover:text-amber-700 dark:hover:text-amber-300">
                    <ArrowLeft className="size-4" /> All courses
                </Link>

                <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-center gap-4">
                        <div className="size-14 rounded-xl bg-white/15 ring-2 ring-white/40 grid place-items-center shrink-0">
                            <BookOpen className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs uppercase tracking-wider text-white/70"><code>{course.code}</code> · {course.credits} credit{course.credits !== 1 ? 's' : ''}</div>
                            <h2 className="text-xl font-bold truncate">{course.title}</h2>
                            <div className="text-xs text-white/80 mt-1">
                                {assessments.length} assessment{assessments.length === 1 ? '' : 's'} · {visible.length} student{visible.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm"
                    >
                        <option value="all">All academic years</option>
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <Button onClick={openAdd}><Plus className="size-4" /> Add assessment</Button>
                    <span className="text-xs text-ink-500 dark:text-ink-400">
                        Tip: click any cell, type a score and press Enter to save. Empty + Enter clears the grade.
                    </span>
                </div>

                {error && (
                    <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-rose-600 hover:underline text-xs">dismiss</button>
                    </div>
                )}

                <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
                    {assessments.length === 0 ? (
                        <div className="p-12 text-center">
                            <ClipboardList className="size-10 mx-auto text-ink-300 dark:text-ink-600 mb-3" />
                            <div className="text-sm text-ink-600 dark:text-ink-300 font-medium">No assessments yet</div>
                            <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 mb-4">
                                Define the gradeable items for this course (e.g. Midterm, Final, Quiz 1).
                            </div>
                            <Button onClick={openAdd}><Plus className="size-4" /> Add the first assessment</Button>
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="p-12 text-center text-sm text-ink-500">No students in this course {yearFilter !== 'all' ? `for ${yearFilter}.` : '.'}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
                                    <tr>
                                        <th className="sticky left-0 bg-ink-50 dark:bg-ink-800/60 z-10 text-left px-4 py-2 font-medium min-w-[14rem]">Student</th>
                                        {assessments.map((a) => (
                                            <th key={a.id} className="px-3 py-2 text-center font-medium whitespace-nowrap min-w-[7rem]">
                                                <div className="flex items-center justify-center gap-1 group">
                                                    <button
                                                        onClick={() => openEdit(a)}
                                                        className="hover:text-brand-600 dark:hover:text-brand-300 inline-flex items-center gap-1"
                                                        title="Edit assessment"
                                                    >
                                                        <span>{a.name}</span>
                                                        <Pencil className="size-3 opacity-0 group-hover:opacity-60" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeAssessment(a)}
                                                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition"
                                                        title="Remove assessment"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                                <div className="text-[10px] font-normal text-ink-400">/ {a.maxScore} · ×{a.weight}</div>
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-center font-medium">Average</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                                    {visible.map((e) => {
                                        const studentGrades = grades.filter((g) => g.enrollmentId === e.id);
                                        const a = weightedAvgPct(studentGrades, assessments);
                                        return (
                                            <tr key={e.id} id={`student-${e.studentId}`} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                                                <td className="sticky left-0 bg-white dark:bg-ink-900 z-10 px-4 py-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar name={e.student.user.name} src={e.student.user.avatarUrl} />
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate max-w-[12rem]">{e.student.user.name}</div>
                                                            <div className="text-xs text-ink-500 truncate max-w-[12rem]">{e.student.studentNumber}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {assessments.map((asses) => {
                                                    const g = cellGrade(e.id, asses.id);
                                                    const key = `${e.id}|${asses.id}`;
                                                    return (
                                                        <td key={asses.id} className="px-2 py-1.5 text-center">
                                                            <GradeCell
                                                                grade={g}
                                                                assessment={asses}
                                                                saving={savingKey === key}
                                                                onCommit={(raw) => commitCell(e, asses, raw)}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className={`px-3 py-2 text-center font-semibold tabular-nums ${tone(a)}`}>
                                                    {a != null ? `${a.toFixed(1)}%` : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            <Modal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title={editing ? `Edit assessment · ${editing.name}` : 'Add a new assessment'}
                description={editing
                    ? 'Update the assessment definition. Existing grade scores are kept; the maximum score is propagated.'
                    : 'Define a gradeable item for this course. It becomes a column in the gradebook.'}
                icon={<ClipboardList className="size-5" />}
                intent="primary"
                size="lg"
                footer={
                    <>
                        {editing && (
                            <Button variant="danger" onClick={async () => { setAddOpen(false); await removeAssessment(editing); }}>
                                <Trash2 className="size-4" /> Delete
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button onClick={saveAssessment}>
                            <ClipboardList className="size-4" /> {editing ? 'Save changes' : 'Create assessment'}
                        </Button>
                    </>
                }
            >
                <FormSection title="Identity" description="How this assessment appears as a column header." required>
                    <TextInput
                        label="Name"
                        value={form.name}
                        onChange={(v) => setForm({ ...form, name: v })}
                        required
                        placeholder="Midterm exam"
                        maxLength={120}
                        hint="Examples: Midterm, Final, Quiz 1, Lab report."
                    />
                </FormSection>
                <FormSection title="Scoring" description="Scale and contribution to the weighted average.">
                    <FormGrid cols={2}>
                        <TextInput
                            label="Max score"
                            type="number"
                            value={form.maxScore}
                            onChange={(v) => setForm({ ...form, maxScore: v })}
                            hint="Value cells are graded out of (e.g. 20, 100)."
                        />
                        <TextInput
                            label="Weight"
                            type="number"
                            value={form.weight}
                            onChange={(v) => setForm({ ...form, weight: v })}
                            hint="Relative weight in the course average. Use 1 for equal weighting."
                        />
                    </FormGrid>
                </FormSection>
            </Modal>
        </>
    );
}

function GradeCell({
    grade,
    assessment,
    saving,
    onCommit,
}: {
    grade: Grade | undefined;
    assessment: Assessment;
    saving: boolean;
    onCommit: (raw: string) => void;
}) {
    const [value, setValue] = useState<string>(grade ? String(grade.score) : '');
    const [focused, setFocused] = useState(false);
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!focused) setValue(grade ? String(grade.score) : '');
    }, [grade, focused]);

    const pct = grade ? (grade.score / grade.maxScore) * 100 : null;
    const t = tone(pct);

    return (
        <div className="relative inline-flex items-center justify-center">
            <input
                ref={ref}
                type="text"
                inputMode="decimal"
                value={value}
                disabled={saving}
                onFocus={(e) => { setFocused(true); e.currentTarget.select(); }}
                onBlur={() => {
                    setFocused(false);
                    const original = grade ? String(grade.score) : '';
                    if (value.trim() !== original.trim()) onCommit(value);
                }}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); ref.current?.blur(); }
                    else if (e.key === 'Escape') { setValue(grade ? String(grade.score) : ''); ref.current?.blur(); }
                }}
                placeholder="—"
                className={`w-16 px-1 py-1 text-center text-xs font-semibold tabular-nums rounded-md border bg-transparent transition focus:outline-none focus:ring-2 focus:ring-brand-400 ${value
                    ? `border-ink-200 dark:border-ink-700 ${t}`
                    : 'border-dashed border-ink-200 dark:border-ink-700 text-ink-400'
                    } ${saving ? 'opacity-50' : ''}`}
                title={grade ? `${grade.score}/${grade.maxScore} = ${pct!.toFixed(0)}%` : `out of ${assessment.maxScore}`}
            />
            <span className="ml-1 text-[10px] text-ink-400 tabular-nums select-none">/{assessment.maxScore}</span>
        </div>
    );
}
