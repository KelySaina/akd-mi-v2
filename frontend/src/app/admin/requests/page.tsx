'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Check, X as XIcon, RefreshCw, UserPlus, GraduationCap, Mail, Phone, UserCog } from 'lucide-react';
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
    const [section, setSection] = useState<'applications' | 'passwords'>('applications');
    return (
        <>
            <Topbar title="Requests" />
            <main className="p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-ink-200 dark:border-ink-800 -mt-2 pb-3">
                    <SectionTab active={section === 'applications'} onClick={() => setSection('applications')} icon={<UserPlus className="size-4" />}>
                        Student applications
                    </SectionTab>
                    <SectionTab active={section === 'passwords'} onClick={() => setSection('passwords')} icon={<KeyRound className="size-4" />}>
                        Password resets
                    </SectionTab>
                </div>
                {section === 'applications' ? <ApplicationsPanel /> : <PasswordsPanel />}
            </main>
        </>
    );
}

function SectionTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-3 py-2 -mb-px border-b-2 text-sm font-medium transition ${active
                ? 'border-brand-500 text-brand-700 dark:text-brand-300'
                : 'border-transparent text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
        >
            {icon}{children}
        </button>
    );
}

function PasswordsPanel() {
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tab active={filter === 'pending'} onClick={() => setFilter('pending')}>Pending</Tab>
                    <Tab active={filter === 'all'} onClick={() => setFilter('all')}>All</Tab>
                </div>
                <button onClick={refresh} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800">
                    <RefreshCw className="size-4" /> Refresh
                </button>
            </div>

            <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden mt-4">
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

type PendingApp = {
    id: string;
    studentNumber: string;
    status: string;
    createdAt: string;
    user: { id: string; name: string; email: string; phone: string | null; avatarUrl: string | null; isActive: boolean; createdAt: string };
};

function ApplicationsPanel() {
    const dialog = useDialog();
    const router = useRouter();
    const [rows, setRows] = useState<PendingApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [approved, setApproved] = useState<{ user: string; password: string; studentId: string } | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<{ items: PendingApp[] }>(`/students/pending`);
            setRows(res.items ?? []);
        } catch (e: any) {
            dialog.alert({ title: 'Failed to load applications', message: e.message });
        } finally { setLoading(false); }
    }, [dialog]);

    useEffect(() => { refresh(); }, [refresh]);

    async function approve(r: PendingApp) {
        setApprovingId(r.id);
        try {
            const res = await api.post<{ generatedPassword: string; student: { id: string } }>(`/students/${r.id}/approve`, {});
            setApproved({ user: r.user.name, password: res.generatedPassword, studentId: res.student.id });
            await refresh();
        } catch (e: any) {
            dialog.alert({ title: 'Approval failed', message: e.message });
        } finally { setApprovingId(null); }
    }

    async function reject(r: PendingApp) {
        const ok = await dialog.confirm({
            title: 'Reject application?',
            message: `This will permanently delete ${r.user.name}'s account request. Continue?`,
            confirmLabel: 'Reject',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await api.post(`/students/${r.id}/reject`, {});
            await refresh();
        } catch (e: any) {
            dialog.alert({ title: 'Reject failed', message: e.message });
        }
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="text-sm text-ink-500 dark:text-ink-400">
                    {loading ? 'Loading…' : `${rows.length} pending application${rows.length === 1 ? '' : 's'}`}
                </div>
                <button onClick={refresh} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800">
                    <RefreshCw className="size-4" /> Refresh
                </button>
            </div>

            <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden mt-4">
                {loading ? (
                    <div className="p-12 text-center text-sm text-ink-500">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto mb-3">
                            <Check className="size-6" />
                        </div>
                        <div className="font-medium">No pending applications</div>
                        <div className="text-sm text-ink-500 dark:text-ink-400 mt-1">New self-registered students will appear here.</div>
                    </div>
                ) : (
                    <ul className="divide-y divide-ink-200 dark:divide-ink-800">
                        {rows.map((r) => (
                            <li key={r.id} className="p-4 flex items-start gap-3">
                                <Avatar name={r.user.name} src={r.user.avatarUrl} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="font-medium truncate">{r.user.name}</div>
                                        <Badge tone="warn">pending</Badge>
                                        <span className="text-xs text-ink-500">·</span>
                                        <span className="text-xs text-ink-500 font-mono">{r.studentNumber}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-3 flex-wrap text-sm text-ink-500 dark:text-ink-400">
                                        <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{r.user.email}</span>
                                        {r.user.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{r.user.phone}</span>}
                                    </div>
                                    <div className="text-[11px] text-ink-400 mt-1">
                                        Applied {new Date(r.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button onClick={() => approve(r)} variant="primary" disabled={approvingId === r.id}>
                                        <GraduationCap className="size-4" /> {approvingId === r.id ? 'Approving…' : 'Approve'}
                                    </Button>
                                    <Button onClick={() => reject(r)} variant="ghost" disabled={approvingId === r.id}>
                                        <XIcon className="size-4" /> Reject
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Modal
                open={!!approved}
                onClose={() => setApproved(null)}
                title="Student approved"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setApproved(null)}>Stay here</Button>
                        <Button onClick={() => { if (approved) router.push(`/admin/students/${approved.studentId}`); }}>
                            <UserCog className="size-4" /> Open profile to complete details
                        </Button>
                    </>
                }
            >
                {approved && (
                    <div className="space-y-3">
                        <p className="text-sm text-ink-600 dark:text-ink-300">
                            <strong>{approved.user}</strong> can now sign in. Share this one-time password securely — it will not be shown again.
                        </p>
                        <PasswordReveal password={approved.password} />
                        <p className="text-xs text-ink-500 dark:text-ink-400">
                            Tip: open the profile to set birth date, program, enrollment year, guardian contact and avatar.
                        </p>
                    </div>
                )}
            </Modal>
        </>
    );
}
