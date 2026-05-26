'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import { formatRelative, type ActivityItem, type ActivityKind } from '@/lib/activity';
import {
    Activity, GraduationCap, Users, BookOpen, ClipboardList,
    Award, Image as ImageIcon, ToggleRight, Trash2, Settings as SettingsIcon,
    RefreshCw, Loader2,
} from 'lucide-react';

const KIND_META: Record<ActivityKind, { icon: typeof Activity; tone: string; label: string }> = {
    student:    { icon: GraduationCap,  tone: 'from-sky-500 to-cyan-500',         label: 'Students' },
    teacher:    { icon: Users,          tone: 'from-emerald-500 to-teal-500',     label: 'Teachers' },
    course:     { icon: BookOpen,       tone: 'from-amber-500 to-orange-500',     label: 'Courses' },
    enrollment: { icon: ClipboardList,  tone: 'from-blue-500 to-indigo-500',      label: 'Enrollments' },
    grade:      { icon: Award,          tone: 'from-fuchsia-500 to-pink-500',     label: 'Grades' },
    media:      { icon: ImageIcon,      tone: 'from-rose-500 to-pink-500',        label: 'Media' },
    status:     { icon: ToggleRight,    tone: 'from-slate-500 to-zinc-500',       label: 'Status changes' },
    settings:   { icon: SettingsIcon,   tone: 'from-violet-500 to-indigo-500',    label: 'Settings' },
    deletion:   { icon: Trash2,         tone: 'from-red-500 to-rose-600',         label: 'Deletions' },
};

const ALL_KINDS: ActivityKind[] = ['student', 'teacher', 'course', 'enrollment', 'grade', 'media', 'status', 'settings', 'deletion'];

export default function ActivityPage() {
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityKind | 'all'>('all');

    const load = async () => {
        setLoading(true);
        try {
            const r = await api.get<{ items: ActivityItem[] }>('/activity?limit=100');
            setItems(r.items ?? []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const filtered = filter === 'all' ? items : items.filter((i) => i.kind === filter);

    return (
        <>
            <Topbar title="Activity" />
            <main className="p-6 lg:p-8 max-w-5xl w-full mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Recent activity</h2>
                        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                            What&apos;s happening across your institution
                        </p>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 text-sm hover:bg-ink-50 dark:hover:bg-ink-800/60 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
                    {ALL_KINDS.map((k) => {
                        const meta = KIND_META[k];
                        const Icon = meta.icon;
                        return (
                            <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>
                                <Icon className="size-3.5" />
                                {meta.label}
                            </FilterChip>
                        );
                    })}
                </div>

                {/* List */}
                <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 overflow-hidden">
                    {loading && items.length === 0 ? (
                        <div className="p-10 grid place-items-center text-ink-500">
                            <Loader2 className="size-5 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center text-ink-500 text-sm">No activity yet.</div>
                    ) : (
                        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                            {filtered.map((it) => {
                                const meta = KIND_META[it.kind];
                                const Icon = meta.icon;
                                const Row = (
                                    <li className="flex items-start gap-3 p-4 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition">
                                        <div className={`size-9 rounded-xl bg-gradient-to-br ${meta.tone} text-white grid place-items-center shrink-0 shadow-sm`}>
                                            <Icon className="size-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{it.title}</div>
                                            <div className="text-sm text-ink-500 dark:text-ink-400 truncate">{it.subtitle}</div>
                                        </div>
                                        <time className="text-xs text-ink-400 whitespace-nowrap mt-0.5" title={new Date(it.at).toLocaleString()}>
                                            {formatRelative(it.at)}
                                        </time>
                                    </li>
                                );
                                return it.href ? (
                                    <Link key={it.id} href={it.href} className="block">{Row}</Link>
                                ) : (
                                    <div key={it.id}>{Row}</div>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </main>
        </>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border',
                active
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:border-brand-300 dark:hover:border-brand-500/40',
            ].join(' ')}
        >
            {children}
        </button>
    );
}
