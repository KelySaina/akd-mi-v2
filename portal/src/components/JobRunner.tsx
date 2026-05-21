'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Square, RefreshCw, Loader2, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

export type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'canceled';

export type JobSnapshot = {
    id: string;
    slug: string | null;
    kind: string;
    title: string;
    steps: string[][];
    status: JobStatus;
    currentStep: number;
    exitCode: number | null;
    startedAt: number;
    endedAt: number | null;
    result?: any;
    error?: string;
    lines: { t: number; stream: 'out' | 'err' | 'sys'; text: string }[];
    nextCursor: number;
};

/** Incrementally polls /api/admin/jobs/:id and accumulates output lines. */
export function useJob(jobId: string | null, opts: { intervalMs?: number } = {}) {
    const interval = opts.intervalMs ?? 1000;
    const [snap, setSnap] = useState<JobSnapshot | null>(null);
    const [lines, setLines] = useState<JobSnapshot['lines']>([]);
    const [err, setErr] = useState<string | null>(null);
    const cursorRef = useRef(0);

    const poll = useCallback(async () => {
        if (!jobId) return;
        try {
            const r = await fetch(`/api/admin/jobs/${jobId}?since=${cursorRef.current}`, { cache: 'no-store' });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? r.statusText);
            const job: JobSnapshot = j.job;
            cursorRef.current = job.nextCursor;
            setLines((prev) => (job.lines.length ? [...prev, ...job.lines] : prev));
            setSnap({ ...job, lines: [] });
            setErr(null);
            return job.status;
        } catch (e: any) { setErr(e.message); return null; }
    }, [jobId]);

    useEffect(() => {
        if (!jobId) { setSnap(null); setLines([]); cursorRef.current = 0; return; }
        cursorRef.current = 0; setLines([]); setSnap(null); setErr(null);
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const tick = async () => {
            if (cancelled) return;
            const st = await poll();
            if (cancelled) return;
            if (st === 'succeeded' || st === 'failed' || st === 'canceled') return; // stop polling
            timer = setTimeout(tick, interval);
        };
        tick();
        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [jobId, interval, poll]);

    return { snap, lines, err, refetch: poll };
}

export async function cancelJob(jobId: string): Promise<boolean> {
    const r = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
    return r.ok;
}

function StatusPill({ status }: { status: JobStatus }) {
    const map = {
        pending:   { cls: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300', icon: <Loader2 className="size-3 animate-spin" />, label: 'Pending' },
        running:   { cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', icon: <Loader2 className="size-3 animate-spin" />, label: 'Running' },
        succeeded: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', icon: <CheckCircle2 className="size-3" />, label: 'Succeeded' },
        failed:    { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: <XCircle className="size-3" />, label: 'Failed' },
        canceled:  { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: <MinusCircle className="size-3" />, label: 'Canceled' },
    } as const;
    const m = map[status];
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${m.cls}`}>{m.icon}{m.label}</span>;
}

function streamCls(s: 'out' | 'err' | 'sys') {
    if (s === 'err') return 'text-rose-300';
    if (s === 'sys') return 'text-indigo-300';
    return 'text-emerald-200';
}

function formatElapsed(startedAt: number, endedAt: number | null) {
    const ms = (endedAt ?? Date.now()) - startedAt;
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** Live job panel. When the job ends, calls onDone(snap) once. */
export function JobRunner({
    jobId, onClose, onDone, compact = false,
}: {
    jobId: string;
    onClose?: () => void;
    onDone?: (snap: JobSnapshot) => void;
    compact?: boolean;
}) {
    const { snap, lines, err } = useJob(jobId);
    const preRef = useRef<HTMLPreElement>(null);
    const [autoscroll, setAutoscroll] = useState(true);
    const calledDoneRef = useRef(false);
    const [, force] = useState(0);

    // Keep the elapsed-time counter ticking while the job runs.
    useEffect(() => {
        if (!snap || (snap.status !== 'running' && snap.status !== 'pending')) return;
        const i = setInterval(() => force((x) => x + 1), 1000);
        return () => clearInterval(i);
    }, [snap?.status]);

    useEffect(() => {
        if (!autoscroll || !preRef.current) return;
        preRef.current.scrollTop = preRef.current.scrollHeight;
    }, [lines, autoscroll]);

    useEffect(() => {
        if (!snap || calledDoneRef.current) return;
        if (snap.status === 'succeeded' || snap.status === 'failed' || snap.status === 'canceled') {
            calledDoneRef.current = true;
            onDone?.(snap);
        }
    }, [snap?.status, snap, onDone]);

    async function onCancel() {
        if (!jobId) return;
        await cancelJob(jobId);
    }

    return (
        <div className={`card overflow-hidden flex flex-col ${compact ? 'h-[420px]' : 'h-[520px]'}`}>
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap">
                {snap ? <StatusPill status={snap.status} /> : <StatusPill status="pending" />}
                <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{snap?.title ?? 'Starting job…'}</div>
                    {snap && (
                        <div className="text-[11px] muted">
                            step {Math.min(snap.currentStep + 1, snap.steps.length)}/{snap.steps.length} · {formatElapsed(snap.startedAt, snap.endedAt)}
                            {snap.exitCode != null && snap.status !== 'succeeded' && ` · exit ${snap.exitCode}`}
                        </div>
                    )}
                </div>
                <div className="flex-1" />
                <label className="text-[11px] muted flex items-center gap-1">
                    <input type="checkbox" checked={autoscroll} onChange={(e) => setAutoscroll(e.target.checked)} /> auto-scroll
                </label>
                {snap && (snap.status === 'running' || snap.status === 'pending') && (
                    <button
                        onClick={onCancel}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-[var(--border)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                        title="Cancel job"
                    ><Square className="size-3" /> Cancel</button>
                )}
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5" title="Close"><X className="size-4" /></button>
                )}
            </div>
            {err && <div className="px-4 py-2 text-xs text-rose-600 border-b border-[var(--border)]">{err}</div>}
            {snap?.error && snap.status === 'failed' && (
                <div className="px-4 py-2 text-xs text-rose-600 border-b border-[var(--border)]">{snap.error}</div>
            )}
            <pre ref={preRef} className="flex-1 overflow-auto text-[11px] leading-5 p-3 bg-black/90 font-mono whitespace-pre-wrap break-all">
                {lines.length === 0 && (
                    <span className="text-slate-500 inline-flex items-center gap-2"><RefreshCw className="size-3 animate-spin" /> waiting for output…</span>
                )}
                {lines.map((l, i) => (
                    <div key={i} className={streamCls(l.stream)}>{l.text}</div>
                ))}
            </pre>
        </div>
    );
}
