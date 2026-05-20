'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, Trash2, Save, Pencil, X } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Avatar } from '@/components/DataTable';
import { Modal, TextInput, Button } from '@/components/ui';
import { useDialog } from '@/components/DialogProvider';
import { api } from '@/lib/api';

type Course = { id: string; code: string; title: string; credits: number };
type Grade = { id: string; enrollmentId: string; studentId: string; assessment: string; score: number; maxScore: number; comment: string | null; gradedAt: string };
type Enrollment = {
    id: string; studentId: string; courseId: string; academicYear: string; semester: string | null; status: string;
    student: { id: string; studentNumber: string; user: { id: string; name: string; email: string; avatarUrl: string | null } };
};

function pctOf(g: Grade) { return (g.score / g.maxScore) * 100; }
function avgPct(gs: Grade[]) {
    if (!gs.length) return null;
    return gs.reduce((a, g) => a + pctOf(g), 0) / gs.length;
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
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [gradesByEnr, setGradesByEnr] = useState<Record<string, Grade[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<string>(initialYear ?? 'all');

    // editing cell state: enrollmentId|assessment → { score, maxScore }
    const [editing, setEditing] = useState<{ enrollmentId: string; assessment: string; gradeId?: string; score: string; maxScore: string } | null>(null);
    const [addColOpen, setAddColOpen] = useState(false);
    const [newAssessmentName, setNewAssessmentName] = useState('');

    const load = useCallback(async () => {
        setError(null);
        try {
            const c = await api.get<Course>(`/courses/${courseId}`);
            setCourse(c);
            const res = await api.get<{ items: Enrollment[] } | Enrollment[]>(`/enrollments?courseId=${courseId}&limit=200`);
            const all = (Array.isArray(res) ? res : (res?.items ?? [])).filter((e) => e.status === 'enrolled' || e.status === 'completed');
            setEnrollments(all);
            const entries = await Promise.all(
                all.map(async (e) => [e.id, await api.get<Grade[]>(`/grades?enrollmentId=${e.id}`)] as const)
            );
            const m: Record<string, Grade[]> = {};
            for (const [k, v] of entries) m[k] = Array.isArray(v) ? v : [];
            setGradesByEnr(m);
        } catch (e: any) { setError(e.message); }
    }, [courseId]);

    useEffect(() => { (async () => { setLoading(true); await load(); setLoading(false); })(); }, [load]);

    const years = useMemo(() => Array.from(new Set(enrollments.map((e) => e.academicYear))).sort().reverse(), [enrollments]);
    const visible = useMemo(
        () => yearFilter === 'all' ? enrollments : enrollments.filter((e) => e.academicYear === yearFilter),
        [enrollments, yearFilter]
    );

    // Distinct assessments across visible enrollments — these become columns
    const assessments = useMemo(() => {
        const s = new Set<string>();
        for (const e of visible) {
            for (const g of gradesByEnr[e.id] ?? []) s.add(g.assessment);
        }
        return Array.from(s).sort();
    }, [visible, gradesByEnr]);

    function cellGrade(enrollmentId: string, assessment: string): Grade | undefined {
        return (gradesByEnr[enrollmentId] ?? []).find((g) => g.assessment === assessment);
    }

    async function saveCell() {
        if (!editing) return;
        const score = Number(editing.score);
        const maxScore = Number(editing.maxScore) || 100;
        if (Number.isNaN(score)) { setError('Score must be a number'); return; }
        try {
            if (editing.gradeId) {
                await api.patch(`/grades/${editing.gradeId}`, { score, maxScore, assessment: editing.assessment });
            } else {
                await api.post('/grades', {
                    enrollmentId: editing.enrollmentId,
                    assessment: editing.assessment,
                    score, maxScore,
                });
            }
            setEditing(null);
            await load();
        } catch (e: any) { setError(e.message); }
    }

    async function clearCell() {
        if (!editing?.gradeId) { setEditing(null); return; }
        const ok = await dialog.confirm({ title: 'Delete grade?', message: 'Remove this evaluation?', tone: 'danger', confirmLabel: 'Delete' });
        if (!ok) return;
        try {
            await api.delete(`/grades/${editing.gradeId}`);
            setEditing(null);
            await load();
        } catch (e: any) { setError(e.message); }
    }

    function startEdit(enrollmentId: string, assessment: string) {
        const g = cellGrade(enrollmentId, assessment);
        setEditing({
            enrollmentId,
            assessment,
            gradeId: g?.id,
            score: g ? String(g.score) : '',
            maxScore: g ? String(g.maxScore) : '100',
        });
    }

    function addAssessmentColumn() {
        const name = newAssessmentName.trim();
        if (!name) return;
        // Just register a "virtual" column by inserting an empty marker so it shows up.
        // We push it into assessments by creating a placeholder grade only when user enters a score.
        // Easiest: store in local extra columns state.
        setExtraCols((prev) => Array.from(new Set([...prev, name])));
        setNewAssessmentName('');
        setAddColOpen(false);
    }
    const [extraCols, setExtraCols] = useState<string[]>([]);

    const allCols = useMemo(() => {
        const s = new Set<string>([...assessments, ...extraCols]);
        return Array.from(s).sort();
    }, [assessments, extraCols]);

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
                    <div className="text-sm text-ink-500 dark:text-ink-400">{visible.length} student{visible.length !== 1 ? 's' : ''}</div>
                    <Button onClick={() => setAddColOpen(true)}><Plus className="size-4" /> Add assessment</Button>
                </div>

                {error && (
                    <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
                )}

                <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
                    {visible.length === 0 ? (
                        <div className="p-12 text-center text-sm text-ink-500">No students in this course {yearFilter !== 'all' ? `for ${yearFilter}.` : '.'}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
                                    <tr>
                                        <th className="sticky left-0 bg-ink-50 dark:bg-ink-800/60 z-10 text-left px-4 py-2 font-medium">Student</th>
                                        {allCols.map((col) => (
                                            <th key={col} className="px-3 py-2 text-center font-medium whitespace-nowrap">{col}</th>
                                        ))}
                                        <th className="px-3 py-2 text-center font-medium">Average</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                                    {visible.map((e) => {
                                        const gs = gradesByEnr[e.id] ?? [];
                                        const a = avgPct(gs);
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
                                                {allCols.map((col) => {
                                                    const g = cellGrade(e.id, col);
                                                    return (
                                                        <td key={col} className="px-2 py-2 text-center">
                                                            <button
                                                                onClick={() => startEdit(e.id, col)}
                                                                className={`inline-flex items-center justify-center min-w-[4rem] px-2 py-1 rounded-md text-xs font-semibold tabular-nums border transition ${g
                                                                    ? `border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 ${tone(pctOf(g))}`
                                                                    : 'border-dashed border-ink-200 dark:border-ink-700 text-ink-400 hover:border-brand-400 hover:text-brand-600'
                                                                    }`}
                                                                title={g ? `${g.score}/${g.maxScore} = ${pctOf(g).toFixed(0)}%` : 'Click to grade'}
                                                            >
                                                                {g ? `${g.score}/${g.maxScore}` : <Plus className="size-3.5" />}
                                                            </button>
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

            {/* Cell edit modal */}
            <Modal
                open={!!editing}
                onClose={() => setEditing(null)}
                title={editing ? `${editing.gradeId ? 'Edit' : 'Add'} grade — ${editing.assessment}` : ''}
                footer={
                    <>
                        {editing?.gradeId && <Button variant="danger" onClick={clearCell}><Trash2 className="size-4" /> Delete</Button>}
                        <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button onClick={saveCell}><Save className="size-4" /> Save</Button>
                    </>
                }
            >
                {editing && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <TextInput label="Score" type="number" value={editing.score} onChange={(v) => setEditing({ ...editing, score: v })} required />
                            <TextInput label="Out of" type="number" value={editing.maxScore} onChange={(v) => setEditing({ ...editing, maxScore: v })} />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add assessment column modal */}
            <Modal
                open={addColOpen}
                onClose={() => setAddColOpen(false)}
                title="Add assessment column"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAddColOpen(false)}>Cancel</Button>
                        <Button onClick={addAssessmentColumn}><Plus className="size-4" /> Add</Button>
                    </>
                }
            >
                <p className="text-sm text-ink-600 dark:text-ink-300 mb-3">
                    Add a new column (e.g. <em>Midterm</em>, <em>Final</em>, <em>Quiz 1</em>). The column appears immediately; grades are saved per cell.
                </p>
                <TextInput label="Assessment name" value={newAssessmentName} onChange={setNewAssessmentName} required />
            </Modal>
        </>
    );
}
