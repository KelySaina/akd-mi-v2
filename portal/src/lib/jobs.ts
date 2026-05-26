import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { akdmiBin, projectDir } from './akdmi';

export type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type JobKind =
    | 'create' | 'up' | 'down' | 'restart' | 'migrate' | 'seed' | 'backup' | 'destroy' | 'init';

export type JobLine = { t: number; stream: 'out' | 'err' | 'sys'; text: string };

export type Job = {
    id: string;
    slug: string | null;
    kind: JobKind;
    /** Human-readable summary, e.g. "akd-mi up foo" or "init+up+seed". */
    title: string;
    steps: string[][]; // each step is an array of akd-mi args
    status: JobStatus;
    currentStep: number;
    exitCode: number | null;
    startedAt: number;
    endedAt: number | null;
    lines: JobLine[];
    /** Optional payload attached on success (e.g. created instance + admin creds). */
    result?: unknown;
    /** Optional error blob attached on failure. */
    error?: string;
};

type CreateJobOpts = {
    slug: string | null;
    kind: JobKind;
    /** Each step is the argv array passed to `akd-mi`. Steps run sequentially. */
    steps: string[][];
    title?: string;
    timeoutMs?: number;
    /** Extra env vars forwarded to every spawned `akd-mi` step (merged over process.env). */
    env?: Record<string, string>;
    /** Run after the LAST step completes successfully. May attach to `job.result`. */
    onSuccess?: (job: Job) => Promise<void> | void;
    /** Always run, regardless of success/failure. */
    onComplete?: (job: Job) => Promise<void> | void;
};

const MAX_LINES_PER_JOB = 5000;
const MAX_JOBS = 200;

type Registry = {
    jobs: Map<string, Job>;
    children: Map<string, ChildProcess>;
    activeBySlug: Map<string, string>;
};

function registry(): Registry {
    const g = globalThis as any;
    if (!g.__akdmi_job_registry__) {
        g.__akdmi_job_registry__ = {
            jobs: new Map<string, Job>(),
            children: new Map<string, ChildProcess>(),
            activeBySlug: new Map<string, string>(),
        } satisfies Registry;
    }
    return g.__akdmi_job_registry__ as Registry;
}

function pushLine(job: Job, stream: JobLine['stream'], text: string) {
    if (job.lines.length >= MAX_LINES_PER_JOB) {
        job.lines.splice(0, job.lines.length - MAX_LINES_PER_JOB + 1);
    }
    job.lines.push({ t: Date.now(), stream, text });
}

function evictOld() {
    const reg = registry();
    if (reg.jobs.size <= MAX_JOBS) return;
    // Drop the oldest finished jobs first.
    const finished = [...reg.jobs.values()]
        .filter((j) => j.status !== 'running' && j.status !== 'pending')
        .sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0));
    while (reg.jobs.size > MAX_JOBS && finished.length > 0) {
        const j = finished.shift()!;
        reg.jobs.delete(j.id);
    }
}

export class JobConflictError extends Error {
    code = 'JobConflict' as const;
    constructor(public existingJobId: string, slug: string) {
        super(`A job is already running for instance '${slug}' (id=${existingJobId})`);
    }
}

export function createJob(opts: CreateJobOpts): Job {
    if (!opts.steps.length) throw new Error('createJob: at least one step is required');
    const reg = registry();

    if (opts.slug) {
        const existing = reg.activeBySlug.get(opts.slug);
        if (existing) {
            const ex = reg.jobs.get(existing);
            if (ex && (ex.status === 'pending' || ex.status === 'running')) {
                throw new JobConflictError(existing, opts.slug);
            }
            reg.activeBySlug.delete(opts.slug);
        }
    }

    const job: Job = {
        id: randomUUID(),
        slug: opts.slug,
        kind: opts.kind,
        title: opts.title ?? (opts.steps.length === 1
            ? `akd-mi ${opts.steps[0].join(' ')}`
            : opts.steps.map((s) => s.join(' ')).join(' → ')),
        steps: opts.steps,
        status: 'pending',
        currentStep: 0,
        exitCode: null,
        startedAt: Date.now(),
        endedAt: null,
        lines: [],
    };
    reg.jobs.set(job.id, job);
    if (opts.slug) reg.activeBySlug.set(opts.slug, job.id);
    evictOld();

    // Kick off asynchronously so the HTTP response can return immediately.
    void runJob(job, opts).catch((e) => {
        // Should be unreachable — runJob catches everything — but log just in case.
        // eslint-disable-next-line no-console
        console.error('[jobs] unhandled error', e);
    });

    return job;
}

async function runJob(job: Job, opts: CreateJobOpts): Promise<void> {
    const reg = registry();
    const timeoutMs = opts.timeoutMs ?? 30 * 60 * 1000;
    job.status = 'running';

    try {
        for (let i = 0; i < job.steps.length; i++) {
            // job.status can be mutated to 'canceled' by cancelJob() while we await;
            // cast to widen the TS-narrowed 'running' literal type.
            if ((job.status as JobStatus) === 'canceled') break;
            job.currentStep = i;
            const args = job.steps[i];
            pushLine(job, 'sys', `── step ${i + 1}/${job.steps.length}: akd-mi ${args.join(' ')} ──`);

            const code = await runStep(job, args, timeoutMs, opts.env);
            if (code !== 0) {
                job.status = 'failed';
                job.exitCode = code;
                job.error = `step ${i + 1} (akd-mi ${args.join(' ')}) exited with code ${code}`;
                pushLine(job, 'sys', job.error);
                break;
            }
        }

        if ((job.status as JobStatus) === 'running') {
            job.status = 'succeeded';
            job.exitCode = 0;
            pushLine(job, 'sys', `── done in ${Math.round((Date.now() - job.startedAt) / 1000)}s ──`);
            if (opts.onSuccess) {
                try { await opts.onSuccess(job); }
                catch (e: any) {
                    job.status = 'failed';
                    job.error = `onSuccess hook failed: ${e?.message ?? e}`;
                    pushLine(job, 'sys', job.error);
                }
            }
        }
    } catch (e: any) {
        job.status = 'failed';
        job.error = e?.message ?? String(e);
        pushLine(job, 'sys', `[fatal] ${job.error}`);
    } finally {
        job.endedAt = Date.now();
        if (job.slug && reg.activeBySlug.get(job.slug) === job.id) {
            reg.activeBySlug.delete(job.slug);
        }
        reg.children.delete(job.id);
        if (opts.onComplete) {
            try { await opts.onComplete(job); }
            catch (e: any) { pushLine(job, 'sys', `[onComplete error] ${e?.message ?? e}`); }
        }
    }
}

function runStep(job: Job, args: string[], timeoutMs: number, extraEnv?: Record<string, string>): Promise<number> {
    return new Promise((resolve) => {
        const reg = registry();
        const child = spawn('bash', [akdmiBin(), ...args], {
            cwd: projectDir(),
            env: { ...process.env, ...(extraEnv ?? {}) },
        });
        reg.children.set(job.id, child);

        let outBuf = '';
        let errBuf = '';
        const flushPartial = (buf: string, stream: 'out' | 'err'): string => {
            const nl = buf.lastIndexOf('\n');
            if (nl < 0) return buf;
            const complete = buf.slice(0, nl);
            for (const line of complete.split('\n')) pushLine(job, stream, line);
            return buf.slice(nl + 1);
        };

        child.stdout.on('data', (d) => {
            outBuf += d.toString();
            outBuf = flushPartial(outBuf, 'out');
        });
        child.stderr.on('data', (d) => {
            errBuf += d.toString();
            errBuf = flushPartial(errBuf, 'err');
        });

        const t = setTimeout(() => {
            pushLine(job, 'sys', `[timeout after ${Math.round(timeoutMs / 1000)}s, killing process]`);
            try { child.kill('SIGKILL'); } catch { /* ignore */ }
        }, timeoutMs);

        child.on('error', (e) => {
            pushLine(job, 'err', `[spawn error] ${String(e)}`);
        });

        child.on('close', (code) => {
            clearTimeout(t);
            if (outBuf) pushLine(job, 'out', outBuf);
            if (errBuf) pushLine(job, 'err', errBuf);
            resolve(code ?? -1);
        });
    });
}

export function getJob(id: string, sinceLineIdx = 0): { job: Omit<Job, 'lines'> & { lines: JobLine[]; nextCursor: number }; } | null {
    const reg = registry();
    const j = reg.jobs.get(id);
    if (!j) return null;
    const slice = sinceLineIdx > 0 ? j.lines.slice(sinceLineIdx) : j.lines.slice();
    return {
        job: {
            id: j.id,
            slug: j.slug,
            kind: j.kind,
            title: j.title,
            steps: j.steps,
            status: j.status,
            currentStep: j.currentStep,
            exitCode: j.exitCode,
            startedAt: j.startedAt,
            endedAt: j.endedAt,
            result: j.result,
            error: j.error,
            lines: slice,
            nextCursor: j.lines.length,
        },
    };
}

export function cancelJob(id: string): boolean {
    const reg = registry();
    const j = reg.jobs.get(id);
    if (!j) return false;
    if (j.status !== 'running' && j.status !== 'pending') return false;
    j.status = 'canceled';
    pushLine(j, 'sys', '[canceled by user]');
    const ch = reg.children.get(id);
    if (ch) { try { ch.kill('SIGKILL'); } catch { /* ignore */ } }
    return true;
}

export function listJobs(filter: { slug?: string | null; activeOnly?: boolean; limit?: number } = {}) {
    const reg = registry();
    let arr = [...reg.jobs.values()];
    if (filter.slug !== undefined) arr = arr.filter((j) => j.slug === filter.slug);
    if (filter.activeOnly) arr = arr.filter((j) => j.status === 'running' || j.status === 'pending');
    arr.sort((a, b) => b.startedAt - a.startedAt);
    if (filter.limit) arr = arr.slice(0, filter.limit);
    return arr.map((j) => ({
        id: j.id, slug: j.slug, kind: j.kind, title: j.title,
        status: j.status, currentStep: j.currentStep, totalSteps: j.steps.length,
        exitCode: j.exitCode, startedAt: j.startedAt, endedAt: j.endedAt,
    }));
}

export function activeJobForSlug(slug: string): Job | null {
    const reg = registry();
    const id = reg.activeBySlug.get(slug);
    if (!id) return null;
    const j = reg.jobs.get(id);
    if (!j) return null;
    if (j.status !== 'running' && j.status !== 'pending') return null;
    return j;
}
