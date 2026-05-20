'use client';
import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Avatar, Badge } from '@/components/DataTable';
import { Modal, TextInput, Button } from '@/components/ui';
import { PasswordReveal } from '@/components/PasswordReveal';
import { useDialog } from '@/components/DialogProvider';
import { api } from '@/lib/api';

type Role = 'INSTANCE_ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';

type User = {
  id: string; email: string; name: string; role: Role;
  extraRoles?: Role[]; roles?: Role[];
  avatarUrl?: string | null; isActive: boolean; createdAt: string;
};

const ROLES: Role[] = ['INSTANCE_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'];

const ROLE_LABEL: Record<Role, string> = {
  INSTANCE_ADMIN: 'Admin',
  MANAGER: 'Manager',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

const ROLE_HINT: Record<Role, string> = {
  INSTANCE_ADMIN: 'Full administrative access (settings, users, billing).',
  MANAGER: 'Can manage students, teachers, courses, enrollments.',
  TEACHER: 'Can grade students and upload syllabus/materials for assigned courses.',
  STUDENT: 'Can view enrollments, grades, and request enrollments.',
};

function ToneForRole(r: Role): 'brand' | 'success' | 'warn' | 'default' {
  if (r === 'INSTANCE_ADMIN') return 'brand';
  if (r === 'MANAGER') return 'warn';
  if (r === 'TEACHER') return 'success';
  return 'default';
}

export default function UsersPage() {
  const dialog = useDialog();
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'MANAGER' as Role });
  const [error, setError] = useState<string | null>(null);
  const [regenResult, setRegenResult] = useState<{ user: string; password: string } | null>(null);
  const [rolesEdit, setRolesEdit] = useState<{ user: User; primary: Role; extras: Set<Role> } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/users?limit=50');
      setRows(res.items ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/users', form);
      setOpenCreate(false);
      setForm({ email: '', name: '', password: '', role: 'MANAGER' });
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function regenerate(u: User) {
    const ok = await dialog.confirm({
      title: 'Regenerate password?',
      message: `Generate a new password for ${u.name} (${u.email})? All their active sessions will be revoked.`,
      confirmLabel: 'Regenerate',
    });
    if (!ok) return;
    try {
      const res = await api.post<{ generatedPassword: string }>(`/password-resets/admin-regenerate/${u.id}`);
      setRegenResult({ user: u.name, password: res.generatedPassword });
    } catch (e: any) {
      dialog.alert({ title: 'Failed', message: e.message, tone: 'danger' });
    }
  }

  function openRolesEditor(u: User) {
    const extras = new Set<Role>((u.extraRoles ?? []).filter((r) => r !== u.role));
    setRolesEdit({ user: u, primary: u.role, extras });
  }

  async function saveRoles() {
    if (!rolesEdit) return;
    try {
      const extras = Array.from(rolesEdit.extras).filter((r) => r !== rolesEdit.primary);
      await api.patch(`/users/${rolesEdit.user.id}/roles`, {
        role: rolesEdit.primary,
        extraRoles: extras,
      });
      setRolesEdit(null);
      await load();
    } catch (e: any) {
      dialog.alert({ title: 'Failed to update roles', message: e.message, tone: 'danger' });
    }
  }

  function toggleExtra(r: Role) {
    if (!rolesEdit) return;
    if (r === rolesEdit.primary) return;
    const next = new Set(rolesEdit.extras);
    if (next.has(r)) next.delete(r); else next.add(r);
    setRolesEdit({ ...rolesEdit, extras: next });
  }

  return (
    <>
      <Topbar title="Users" action={<PrimaryButton onClick={() => setOpenCreate(true)}>New user</PrimaryButton>} />
      <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        {loading ? (
          <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded shimmer" />)}
          </div>
        ) : (
          <DataTable
            rows={rows}
            empty="No users yet — create one."
            columns={[
              { key: 'user', header: 'User', render: (r) => (
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} src={r.avatarUrl} />
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink-500">{r.email}</div>
                  </div>
                </div>
              ) },
              { key: 'role', header: 'Roles', render: (r) => {
                const effective: Role[] = r.roles ?? [r.role, ...(r.extraRoles ?? [])];
                const set = Array.from(new Set(effective));
                return (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {set.map((role) => (
                      <Badge key={role} tone={ToneForRole(role)}>
                        {role === r.role ? '★ ' : ''}{ROLE_LABEL[role]}
                      </Badge>
                    ))}
                  </div>
                );
              } },
              { key: 'status', header: 'Status', render: (r) => (
                <Badge tone={r.isActive ? 'success' : 'danger'}>{r.isActive ? 'active' : 'disabled'}</Badge>
              ) },
              { key: 'created', header: 'Created', render: (r) =>
                <span className="text-ink-500">{new Date(r.createdAt).toLocaleDateString()}</span> },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => openRolesEditor(r)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                    title="Edit roles"
                  >
                    <ShieldCheck className="size-3.5" /> Roles
                  </button>
                  <button
                    onClick={() => regenerate(r)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                    title="Regenerate password"
                  >
                    <KeyRound className="size-3.5" /> Reset
                  </button>
                </div>
              ) },
            ]}
          />
        )}
      </main>

      {/* Create user */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Create user"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" onClick={() => (document.getElementById('user-form') as HTMLFormElement)?.requestSubmit()}>Create</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={create} className="space-y-4">
          <TextInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required placeholder="min 8 chars" />
          <label className="block">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Primary role</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <span className="block text-xs text-ink-500 dark:text-ink-400 mt-1">{ROLE_HINT[form.role]}</span>
          </label>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Additional roles can be granted from the user row after creation.
          </p>
        </form>
      </Modal>

      {/* Edit roles */}
      <Modal
        open={!!rolesEdit}
        onClose={() => setRolesEdit(null)}
        title={rolesEdit ? `Manage roles — ${rolesEdit.user.name}` : 'Manage roles'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRolesEdit(null)}>Cancel</Button>
            <Button onClick={saveRoles}><ShieldCheck className="size-4" /> Save roles</Button>
          </>
        }
      >
        {rolesEdit && (
          <div className="space-y-5">
            <div>
              <label className="block">
                <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Primary role</span>
                <span className="block text-xs text-ink-500 dark:text-ink-400 mb-1.5">
                  Drives the user's landing page after sign-in.
                </span>
                <select
                  value={rolesEdit.primary}
                  onChange={(e) => {
                    const primary = e.target.value as Role;
                    const extras = new Set(rolesEdit.extras);
                    extras.delete(primary);
                    setRolesEdit({ ...rolesEdit, primary, extras });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <span className="block text-xs text-ink-500 dark:text-ink-400 mt-1">{ROLE_HINT[rolesEdit.primary]}</span>
              </label>
            </div>

            <div>
              <div className="text-sm font-medium text-ink-700 dark:text-ink-200">Additional granted roles</div>
              <div className="text-xs text-ink-500 dark:text-ink-400 mb-2">
                Stack roles to grant extra privileges (e.g. give a teacher Manager rights without changing where they land).
              </div>
              <div className="space-y-2">
                {ROLES.filter((r) => r !== rolesEdit.primary).map((r) => {
                  const checked = rolesEdit.extras.has(r);
                  return (
                    <label
                      key={r}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        checked
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10'
                          : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-brand-500"
                        checked={checked}
                        onChange={() => toggleExtra(r)}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{ROLE_LABEL[r]}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">{ROLE_HINT[r]}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Regenerated password reveal */}
      <Modal
        open={!!regenResult}
        onClose={() => setRegenResult(null)}
        title="Password regenerated"
        footer={<Button onClick={() => setRegenResult(null)}>Done</Button>}
      >
        {regenResult && (
          <div className="space-y-3">
            <p className="text-sm text-ink-600 dark:text-ink-300">
              A new password has been generated for <strong>{regenResult.user}</strong>. Share it securely — it will not be shown again.
            </p>
            <PasswordReveal password={regenResult.password} />
          </div>
        )}
      </Modal>
    </>
  );
}
