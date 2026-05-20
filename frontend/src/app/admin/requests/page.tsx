'use client';
import { useEffect, useState, useCallback } from 'react';
import { KeyRound, Check, X as XIcon, RefreshCw } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Modal, Button } from '@/components/ui';
import { Avatar, Badge } from '@/components/DataTable';
import { useDialog } from '@/components/DialogProvider';
import { PasswordReveal } from '@/components/PasswordReveal';
import { api } from '@/lib/api';

type ResetRow = {
    id: string;
    userId: string;
    status: 'pending' | 'fulfilled' | 'rejected' | 'expired';
    source: 'self' | 'forgot' | 'admin';
    reason: string | null;
    createdAt: string;
    fulfilledAt: string | null;
    user: { id: string; name: string; email: string; role: string; avatarUrl: string | null };
};

const SOURCE_LABEL: Record<string, string> = {
    self: 'In-app request',
    forgot: 'Forgot password (login)',
    admin: 'Admin-initiated',
};

const STATUS_TONE: Record<string, 'warn' | 'success' | 'danger' | 'default'> = {
    pending: 'warn', fulfilled: 'success', rejected: 'danger', expired: 'default',
};

export default function RequestsPage() {
    const dialog = useDialog();
    const [rows, setRows] = useState<ResetRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');
    const [generatedPassword, setGeneratedPassword] = useState<{ user: string; password: string } | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const qs = filter === 'pending' ? '?status=pending' : '';
            const res = await api.get<{ items: ResetRow[] }>(`/password-resets${qs}`);
            setRows(res.items ?? []);
        } catch (e: any) {
            dialog.alert({ title: 'Failed to load requests', message: e.message });
        } finally { setLoading(false); }
    }, [filter, dialog]);

    useEffect(() => { refresh(); }, [refresh]);

    async function fulfill(r: ResetRow) {
        const ok = await dialog.confirm({
            title: 'Regenerate password?',
            message: `A new password will be generated for ${r.user.name} (${r.user.email}). All their active sessions will be revoked. Continue?`,
            confirmLabel: 'Regenerate',
        });
        if (!ok) return;
        try {
            const res = await api.post<{ generatedPassword: string }>(`/password-resets/${r.id}/fulfill`);
            setGeneratedPassword({ user: r.user.name, password: res.generatedPassword });
            await refresh();
        } catch (e: any) {
            dialog.alert({ title: 'Failed', message: e.message });
        }
    }

    async function reject(r: ResetRow) {
        const ok = await dialog.confirm({
            title: 'Reject request?',
            message: `Reject ${r.user.name}'s password reset request? They can submit a new request later.`,
            confirmLabel: 'Reject',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await api.post(`/password-resets/${r.id}/reject`);
            await refresh();
        } catch (e: any) {
            dialog.alert({ title: 'Failed', message: e.message });
        }
    }

    return (
        <>
            <Topbar title="Requests" />
            <main className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tab active={filter === 'pending'} onClick={() => setFilter('pending')}>Pending</Tab>
                        <Tab active={filter === 'all'} onClick={() => setFilter('all')}>All</Tab>
                    </div>
                    <button onClick={refresh} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800">
                        <RefreshCw className="size-4" /> Refresh
                    </button>
                </div>

                <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-sm text-ink-500">Loading…</div>
                    ) : rows.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto mb-3">
                                <Check className="size-6" />
                            </div>
                            <div className="font-medium">No {filter === 'pending' ? 'pending ' : ''}requests</div>
                            <div className="text-sm text-ink-500 dark:text-ink-400 mt-1">You're all caught up.</div>
                        </div>
                    ) : (
                        <ul className="divide-y divide-ink-200 dark:divide-ink-800">
                            {rows.map((r) => (
                                <li key={r.id} className="p-4 flex items-start gap-3">
                                    <Avatar name={r.user.name} src={r.user.avatarUrl} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="font-medium truncate">{r.user.name}</div>
                                            <Badge tone={STATUS_TONE[r.status] ?? 'default'}>{r.status}</Badge>
                                            <span className="text-xs text-ink-500">·</span>
                                            <span className="text-xs text-ink-500">{SOURCE_LABEL[r.source] ?? r.source}</span>
                                        </div>
                                        <div className="text-sm text-ink-500 dark:text-ink-400 truncate">{r.user.email} · {r.user.role}</div>
                                        {r.reason && (
                                            <div className="mt-1.5 text-sm text-ink-700 dark:text-ink-200 bg-ink-50 dark:bg-ink-800/60 rounded-lg px-3 py-2 border border-ink-200 dark:border-ink-700">
                                                <span className="text-ink-500 dark:text-ink-400">Reason: </span>{r.reason}
                                            </div>
                                        )}
                                        <div className="text-[11px] text-ink-400 mt-1">
                                            {new Date(r.createdAt).toLocaleString()}
                                            {r.fulfilledAt && <> · resolved {new Date(r.fulfilledAt).toLocaleString()}</>}
                                        </div>
                                    </div>
                                    {r.status === 'pending' && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button onClick={() => fulfill(r)} variant="primary">
                                                <KeyRound className="size-4" /> Regenerate
                                            </Button>
                                            <Button onClick={() => reject(r)} variant="ghost">
                                                <XIcon className="size-4" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>

            <Modal
                open={!!generatedPassword}
                onClose={() => setGeneratedPassword(null)}
                title="Password regenerated"
                size="md"
                footer={<Button onClick={() => setGeneratedPassword(null)}>Done</Button>}
            >
                {generatedPassword && (
                    <div className="space-y-3">
                        <p className="text-sm text-ink-600 dark:text-ink-300">
                            A new password has been generated for <strong>{generatedPassword.user}</strong>. Share it securely — it will not be shown again.
                        </p>
                        <PasswordReveal password={generatedPassword.password} />
                    </div>
                )}
            </Modal>
        </>
    );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${active
                ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300'
                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
        >
            {children}
        </button>
    );
}
