'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react';

// ─────────────────────────── types ───────────────────────────

export type ConfirmOpts = {
    title?: string;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'outline';
    /** If set, the user must type this exact string before "Confirm" is enabled. */
    typeToConfirm?: string;
};

export type AlertOpts = {
    title?: string;
    message?: React.ReactNode;
    okText?: string;
    kind?: 'info' | 'success' | 'warning' | 'error';
};

export type Toast = {
    id: string;
    kind: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message: React.ReactNode;
    ttl: number;
};

type DialogsCtx = {
    confirm: (opts: ConfirmOpts) => Promise<boolean>;
    alert: (opts: AlertOpts) => Promise<void>;
    notify: (kind: Toast['kind'], message: React.ReactNode, opts?: { title?: string; ttl?: number }) => void;
};

const Ctx = createContext<DialogsCtx | null>(null);

export function useDialogs(): DialogsCtx {
    const v = useContext(Ctx);
    if (!v) throw new Error('useDialogs must be used inside <DialogsProvider>');
    return v;
}

export const useConfirm = () => useDialogs().confirm;
export const useAlert   = () => useDialogs().alert;
export const useNotify  = () => useDialogs().notify;

// ─────────────────────────── provider ───────────────────────────

type ConfirmReq = ConfirmOpts & { _id: number; resolve: (v: boolean) => void };
type AlertReq   = AlertOpts   & { _id: number; resolve: () => void };

let _id = 0;

export function DialogsProvider({ children }: { children: React.ReactNode }) {
    const [confirms, setConfirms] = useState<ConfirmReq[]>([]);
    const [alerts, setAlerts] = useState<AlertReq[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => {
        setConfirms((prev) => [...prev, { ...opts, _id: ++_id, resolve }]);
    }), []);

    const alert = useCallback((opts: AlertOpts) => new Promise<void>((resolve) => {
        setAlerts((prev) => [...prev, { ...opts, _id: ++_id, resolve }]);
    }), []);

    const notify = useCallback<DialogsCtx['notify']>((kind, message, opts) => {
        const id = String(++_id);
        const ttl = opts?.ttl ?? 4000;
        setToasts((prev) => [...prev, { id, kind, title: opts?.title, message, ttl }]);
        if (ttl > 0) setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ttl);
    }, []);

    const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    function resolveConfirm(_id: number, value: boolean) {
        setConfirms((prev) => {
            const hit = prev.find((c) => c._id === _id);
            hit?.resolve(value);
            return prev.filter((c) => c._id !== _id);
        });
    }
    function resolveAlert(_id: number) {
        setAlerts((prev) => {
            const hit = prev.find((a) => a._id === _id);
            hit?.resolve();
            return prev.filter((a) => a._id !== _id);
        });
    }

    return (
        <Ctx.Provider value={{ confirm, alert, notify }}>
            {children}
            {confirms.map((c) => (
                <ConfirmDialog key={c._id} req={c} onResolve={(v) => resolveConfirm(c._id, v)} />
            ))}
            {alerts.map((a) => (
                <AlertDialog key={a._id} req={a} onResolve={() => resolveAlert(a._id)} />
            ))}
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </Ctx.Provider>
    );
}

// ─────────────────────────── confirm dialog ───────────────────────────

function ConfirmDialog({ req, onResolve }: { req: ConfirmReq; onResolve: (v: boolean) => void }) {
    const [typed, setTyped] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const variant = req.variant ?? 'primary';
    const requiresType = !!req.typeToConfirm;
    const canConfirm = !requiresType || typed === req.typeToConfirm;

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onResolve(false);
            else if (e.key === 'Enter' && canConfirm && !requiresType) onResolve(true);
        }
        window.addEventListener('keydown', onKey);
        if (requiresType) inputRef.current?.focus();
        return () => window.removeEventListener('keydown', onKey);
    }, [canConfirm, requiresType, onResolve]);

    const Icon = variant === 'danger' ? AlertTriangle : Info;
    const iconCls = variant === 'danger' ? 'text-rose-500' : 'text-indigo-500';

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={() => onResolve(false)}>
            <div className="card w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="flex items-start gap-3">
                    <Icon className={`size-6 shrink-0 ${iconCls}`} />
                    <div className="min-w-0">
                        <h2 className="font-semibold text-base">{req.title ?? 'Are you sure?'}</h2>
                        {req.message && <div className="text-sm muted mt-1">{req.message}</div>}
                    </div>
                </div>
                {requiresType && (
                    <label className="block">
                        <span className="block text-xs muted mb-1">
                            Type <code className="px-1 rounded bg-black/5 dark:bg-white/10">{req.typeToConfirm}</code> to confirm
                        </span>
                        <input
                            ref={inputRef}
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && canConfirm) onResolve(true); }}
                            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-mono"
                        />
                    </label>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                    <DialogButton variant="ghost" onClick={() => onResolve(false)}>
                        {req.cancelText ?? 'Cancel'}
                    </DialogButton>
                    <DialogButton
                        variant={variant}
                        onClick={() => onResolve(true)}
                        disabled={!canConfirm}
                    >
                        {req.confirmText ?? 'Confirm'}
                    </DialogButton>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────── alert dialog ───────────────────────────

function AlertDialog({ req, onResolve }: { req: AlertReq; onResolve: () => void }) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' || e.key === 'Enter') onResolve();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onResolve]);

    const kind = req.kind ?? 'info';
    const { Icon, cls } = iconForKind(kind);

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onResolve}>
            <div className="card w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
                <div className="flex items-start gap-3">
                    <Icon className={`size-6 shrink-0 ${cls}`} />
                    <div className="min-w-0">
                        <h2 className="font-semibold text-base">{req.title ?? 'Notice'}</h2>
                        {req.message && <div className="text-sm muted mt-1 whitespace-pre-wrap">{req.message}</div>}
                    </div>
                </div>
                <div className="flex items-center justify-end pt-1">
                    <DialogButton variant="primary" onClick={onResolve}>{req.okText ?? 'OK'}</DialogButton>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────── toast stack ───────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none">
            {toasts.map((t) => {
                const { Icon, cls } = iconForKind(t.kind);
                return (
                    <div
                        key={t.id}
                        className={`card px-3.5 py-2.5 text-sm flex items-start gap-2 pointer-events-auto shadow-lg ${toastCls(t.kind)}`}
                        role="status"
                    >
                        <Icon className={`size-4 shrink-0 mt-0.5 ${cls}`} />
                        <div className="min-w-0 flex-1">
                            {t.title && <div className="font-medium">{t.title}</div>}
                            <div className="text-[13px] break-words">{t.message}</div>
                        </div>
                        <button onClick={() => onDismiss(t.id)} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 muted">
                            <X className="size-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function iconForKind(kind: Toast['kind']) {
    switch (kind) {
        case 'success': return { Icon: CheckCircle2, cls: 'text-emerald-500' };
        case 'error':   return { Icon: XCircle, cls: 'text-rose-500' };
        case 'warning': return { Icon: AlertTriangle, cls: 'text-amber-500' };
        default:        return { Icon: Info, cls: 'text-indigo-500' };
    }
}

function toastCls(kind: Toast['kind']) {
    switch (kind) {
        case 'success': return 'border-emerald-300 dark:border-emerald-500/30';
        case 'error':   return 'border-rose-300 dark:border-rose-500/30';
        case 'warning': return 'border-amber-300 dark:border-amber-500/30';
        default:        return '';
    }
}

// ─────────────────────────── tiny button (avoid circular dep) ───────────────────────────

function DialogButton({
    children, variant = 'primary', ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }) {
    const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 text-sm';
    const variants = {
        primary: 'gradient-brand text-white hover:opacity-90',
        ghost:   'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5',
        danger:  'bg-rose-600 text-white hover:bg-rose-700',
        outline: 'border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5',
    };
    return <button className={`${base} ${variants[variant]}`} {...rest}>{children}</button>;
}
