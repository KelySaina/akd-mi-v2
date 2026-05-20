'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Tone = 'info' | 'success' | 'warning' | 'danger';

export type AlertOptions = {
    title?: string;
    message: ReactNode;
    tone?: Tone;
    okLabel?: string;
};

export type ConfirmOptions = {
    title?: string;
    message: ReactNode;
    tone?: Tone;
    confirmLabel?: string;
    cancelLabel?: string;
};

type DialogState =
    | ({ kind: 'alert'; resolve: () => void } & AlertOptions)
    | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOptions);

type Ctx = {
    alert: (opts: AlertOptions) => Promise<void>;
    confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const DialogCtx = createContext<Ctx | null>(null);

const TONE_STYLES: Record<Tone, { icon: ReactNode; ring: string; btn: string }> = {
    info:    { icon: <Info className="size-5" />,          ring: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',     btn: 'bg-grad-brand text-white shadow-md shadow-brand-500/25 hover:shadow-brand-500/40' },
    success: { icon: <CheckCircle2 className="size-5" />,  ring: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300', btn: 'bg-emerald-600 text-white hover:bg-emerald-700' },
    warning: { icon: <AlertTriangle className="size-5" />, ring: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',    btn: 'bg-amber-600 text-white hover:bg-amber-700' },
    danger:  { icon: <XCircle className="size-5" />,       ring: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',         btn: 'bg-rose-600 text-white hover:bg-rose-700' },
};

export function DialogProvider({ children }: { children: ReactNode }) {
    const [stack, setStack] = useState<DialogState[]>([]);

    const push = useCallback((d: DialogState) => setStack((s) => [...s, d]), []);
    const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);

    const ctxValue = useRef<Ctx>({
        alert: (opts) => new Promise<void>((resolve) => push({ kind: 'alert', resolve, ...opts })),
        confirm: (opts) => new Promise<boolean>((resolve) => push({ kind: 'confirm', resolve, ...opts })),
    }).current;

    const current = stack[stack.length - 1];

    return (
        <DialogCtx.Provider value={ctxValue}>
            {children}
            {current && (
                <DialogShell
                    key={stack.length}
                    state={current}
                    onClose={(answer) => {
                        if (current.kind === 'alert') current.resolve();
                        else current.resolve(answer);
                        pop();
                    }}
                />
            )}
        </DialogCtx.Provider>
    );
}

function DialogShell({ state, onClose }: { state: DialogState; onClose: (answer: boolean) => void }) {
    const isConfirm = state.kind === 'confirm';
    const tone: Tone = state.tone ?? (isConfirm ? 'warning' : 'info');
    const styles = TONE_STYLES[tone];
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose(false);
            else if (e.key === 'Enter') onClose(true);
        };
        window.addEventListener('keydown', onKey);
        // focus default action
        const t = setTimeout(() => confirmRef.current?.focus(), 30);
        // lock scroll
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            clearTimeout(t);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    const okLabel = isConfirm
        ? (state as ConfirmOptions).confirmLabel ?? (tone === 'danger' ? 'Delete' : 'Confirm')
        : (state as AlertOptions).okLabel ?? 'OK';
    const cancelLabel = isConfirm ? ((state as ConfirmOptions).cancelLabel ?? 'Cancel') : null;
    const defaultTitle = isConfirm
        ? (tone === 'danger' ? 'Confirm deletion' : 'Are you sure?')
        : 'Notice';

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[200] grid place-items-center p-4 animate-[fadeIn_120ms_ease-out]"
        >
            <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => onClose(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xl animate-[popIn_140ms_ease-out]">
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="absolute top-3 right-3 size-8 grid place-items-center rounded-md text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
                    aria-label="Close"
                >
                    <X className="size-4" />
                </button>
                <div className="p-5 pr-12 flex gap-4">
                    <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${styles.ring}`}>
                        {styles.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">
                            {state.title ?? defaultTitle}
                        </h3>
                        <div className="mt-1 text-sm text-ink-600 dark:text-ink-300 whitespace-pre-line">
                            {state.message}
                        </div>
                    </div>
                </div>
                <div className="px-5 py-3 border-t border-ink-100 dark:border-ink-800 flex justify-end gap-2 bg-ink-50/50 dark:bg-ink-900/50 rounded-b-2xl">
                    {cancelLabel && (
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 bg-white dark:bg-ink-800 hover:bg-ink-50 dark:hover:bg-ink-700 transition active:scale-[0.98]"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={() => onClose(true)}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition active:scale-[0.98] ${styles.btn}`}
                    >
                        {okLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useDialog(): Ctx {
    const ctx = useContext(DialogCtx);
    if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
    return ctx;
}
