'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Filter, Search, BookOpen, TrendingUp } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import { useTeacherEnrollments } from '../useTeacher';

type Grade = {
    id: string;
    enrollmentId: string;
    studentId: string;
    assessment: string;
    score: number;
    maxScore: number;
};

function avg(grades: Grade[]) {
    if (!grades.length) return null;
    const total = grades.reduce((a, g) => a + (g.score / g.maxScore) * 100, 0);
    return total / grades.length;
}

function tone(pct: number | null) {
    if (pct == null) return 'text-ink-400 bg-ink-100 dark:bg-ink-800 border-ink-200 dark:border-ink-700';
    if (pct >= 80) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30';
    if (pct >= 60) return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30';
    return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30';
}

export default function GradebookPage() {
    const { data: enrollments, loading: loadingEnr, error } = useTeacherEnrollments();
    const [gradesByEnr, setGradesByEnr] = useState<Record<string, Grade[]>>({});
    const [gradesLoading, setGradesLoading] = useState(false);
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    // Only enrolled / completed / dropped are "active" for grading; we show "enrolled" and "completed"
    const active = useMemo(
        () => enrollments.filter((e) => e.status === 'enrolled' || e.status === 'completed'),
        [enrollments]
    );

    const years = useMemo(() => {
        const s = new Set<string>();
        active.forEach((e) => s.add(e.academicYear));
        return ['all', ...Array.from(s).sort().reverse()];
    }, [active]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return active.filter((e) => {
            if (yearFilter !== 'all' && e.academicYear !== yearFilter) return false;
            if (q) {
                const hay = `${e.student.user.name} ${e.student.user.email} ${e.student.studentNumber} ${e.course.code} ${e.course.title}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [active, yearFilter, search]);

    // Load grades for all filtered enrollments (capped to avoid N+1 explosion)
    useEffect(() => {
        if (!filtered.length) { setGradesByEnr({}); return; }
        let cancelled = false;
        setGradesLoading(true);
        (async () => {
            try {
                const entries = await Promise.all(
                    filtered.slice(0, 500).map(async (e) => {
                        try {
                            const gs = await api.get<Grade[]>(`/grades?enrollmentId=${e.id}`);
                            return [e.id, Array.isArray(gs) ? gs : []] as const;
                        } catch { return [e.id, [] as Grade[]] as const; }
                    })
                );
                if (!cancelled) {
                    const map: Record<string, Grade[]> = {};
                    for (const [k, v] of entries) map[k] = v;
                    setGradesByEnr(map);
                }
            } finally {
                if (!cancelled) setGradesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [filtered]);

    // Build matrix: rows = students, cols = courses
    const matrix = useMemo(() => {
        const studentMap = new Map<string, { id: string; name: string; email: string; number: string; avatarUrl: string | null }>();
        const courseMap = new Map<string, { id: string; code: string; title: string }>();
        const cells = new Map<string, { enrollmentId: string; pct: number | null; gradeCount: number }>();

        for (const e of filtered) {
            studentMap.set(e.studentId, {
                id: e.studentId,
                name: e.student.user.name,
                email: e.student.user.email,
                number: e.student.studentNumber,
                avatarUrl: e.student.user.avatarUrl,
            });
            courseMap.set(e.courseId, { id: e.courseId, code: e.course.code, title: e.course.title });
            const gs = gradesByEnr[e.id] ?? [];
            cells.set(`${e.studentId}|${e.courseId}`, {
                enrollmentId: e.id,
                pct: avg(gs),
                gradeCount: gs.length,
            });
        }

        const students = Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        const courses = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code));
        return { students, courses, cells };
    }, [filtered, gradesByEnr]);

    // Course averages (across all filtered students)
    const courseStats = useMemo(() => {
        const m = new Map<string, number[]>();
        for (const e of filtered) {
            const pct = avg(gradesByEnr[e.id] ?? []);
            if (pct != null) {
                const arr = m.get(e.courseId) ?? [];
                arr.push(pct);
                m.set(e.courseId, arr);
            }
        }
        const out = new Map<string, number>();
        m.forEach((arr, k) => out.set(k, arr.reduce((a, b) => a + b, 0) / arr.length));
        return out;
    }, [filtered, gradesByEnr]);

    return (
        <>
            <Topbar title="Gradebook" />
            <main className="p-6 space-y-4">
                {/* Filters */}
                <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[14rem]">
                        <Search className="size-4 text-ink-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search students or courses…"
                            className="flex-1 bg-transparent outline-none text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="size-4 text-ink-400" />
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="px-2 py-1.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm"
                        >
                            {years.map((y) => <option key={y} value={y}>{y === 'all' ? 'All years' : y}</option>)}
                        </select>
                    </div>
                    <div className="text-xs text-ink-500 ml-auto">
                        {matrix.students.length} student{matrix.students.length !== 1 ? 's' : ''} · {matrix.courses.length} course{matrix.courses.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

                {/* Summary tiles */}
                {matrix.courses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {matrix.courses.map((c) => {
                            const a = courseStats.get(c.id);
                            return (
                                <Link
                                    key={c.id}
                                    href={`/teacher/gradebook/${c.id}${yearFilter !== 'all' ? `?year=${yearFilter}` : ''}`}
                                    className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 hover:border-brand-400 hover:shadow-md transition"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="size-4 text-brand-500" />
                                        <div className="text-xs font-mono text-ink-500">{c.code}</div>
                                    </div>
                                    <div className="font-medium truncate" title={c.title}>{c.title}</div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className={`text-sm font-semibold px-2 py-0.5 rounded-md border ${tone(a ?? null)}`}>
                                            {a != null ? `${a.toFixed(1)}%` : '—'}
                                        </div>
                                        <div className="text-xs text-ink-500 inline-flex items-center gap-1">
                                            <TrendingUp className="size-3.5" /> class avg
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Matrix */}
                <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
                    <div className="px-4 py-3 border-b border-ink-200 dark:border-ink-800 flex items-center gap-2">
                        <ClipboardCheck className="size-4 text-brand-500" />
                        <div className="text-sm font-semibold">Student × Course matrix</div>
                        {gradesLoading && <span className="text-xs text-ink-400 ml-2">loading grades…</span>}
                    </div>
                    {loadingEnr ? (
                        <div className="p-12 text-center text-sm text-ink-500">Loading enrollments…</div>
                    ) : matrix.students.length === 0 ? (
                        <div className="p-12 text-center text-sm text-ink-500">No enrolled students match your filters.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
                                    <tr>
                                        <th className="sticky left-0 bg-ink-50 dark:bg-ink-800/60 z-10 text-left px-4 py-2 font-medium">Student</th>
                                        {matrix.courses.map((c) => (
                                            <th key={c.id} className="px-3 py-2 text-center font-mono text-xs font-medium whitespace-nowrap" title={c.title}>
                                                {c.code}
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-center font-medium">Overall</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                                    {matrix.students.map((s) => {
                                        const cells = matrix.courses.map((c) => matrix.cells.get(`${s.id}|${c.id}`));
                                        const valid = cells.filter((x): x is { enrollmentId: string; pct: number | null; gradeCount: number } => !!x && x.pct != null);
                                        const overall = valid.length ? valid.reduce((a, b) => a + (b.pct ?? 0), 0) / valid.length : null;
                                        return (
                                            <tr key={s.id} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                                                <td className="sticky left-0 bg-white dark:bg-ink-900 z-10 px-4 py-2">
                                                    <div className="font-medium truncate max-w-[14rem]">{s.name}</div>
                                                    <div className="text-xs text-ink-500 truncate max-w-[14rem]">{s.number} · {s.email}</div>
                                                </td>
                                                {matrix.courses.map((c) => {
                                                    const cell = matrix.cells.get(`${s.id}|${c.id}`);
                                                    if (!cell) return <td key={c.id} className="px-3 py-2 text-center text-ink-300">·</td>;
                                                    return (
                                                        <td key={c.id} className="px-3 py-2 text-center">
                                                            <Link
                                                                href={`/teacher/gradebook/${c.id}${yearFilter !== 'all' ? `?year=${yearFilter}` : ''}#student-${s.id}`}
                                                                className={`inline-block min-w-[3.4rem] px-2 py-1 rounded-md border text-xs font-semibold ${tone(cell.pct)} hover:scale-105 transition`}
                                                                title={`${cell.gradeCount} grade${cell.gradeCount !== 1 ? 's' : ''}`}
                                                            >
                                                                {cell.pct != null ? `${cell.pct.toFixed(0)}%` : '—'}
                                                            </Link>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`inline-block min-w-[3.4rem] px-2 py-1 rounded-md border text-xs font-semibold ${tone(overall)}`}>
                                                        {overall != null ? `${overall.toFixed(1)}%` : '—'}
                                                    </span>
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
        </>
    );
}
