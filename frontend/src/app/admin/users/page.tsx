'use client';
import { useEffect, useState } from 'react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Avatar, Badge } from '@/components/DataTable';
import { Modal, TextInput, Button } from '@/components/ui';
import { api } from '@/lib/api';

type User = {
  id: string; email: string; name: string; role: string;
  avatarUrl?: string | null; isActive: boolean; createdAt: string;
};

const ROLES = ['INSTANCE_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'] as const;

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'MANAGER' });
  const [error, setError] = useState<string | null>(null);

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
      setOpen(false);
      setForm({ email: '', name: '', password: '', role: 'MANAGER' });
      load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <>
      <Topbar title="Users" action={<PrimaryButton onClick={() => setOpen(true)}>New user</PrimaryButton>} />
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
              { key: 'role', header: 'Role', render: (r) => (
                <Badge tone={r.role === 'INSTANCE_ADMIN' ? 'brand' : 'default'}>{r.role}</Badge>
              ) },
              { key: 'status', header: 'Status', render: (r) => (
                <Badge tone={r.isActive ? 'success' : 'danger'}>{r.isActive ? 'active' : 'disabled'}</Badge>
              ) },
              { key: 'created', header: 'Created', render: (r) =>
                <span className="text-ink-500">{new Date(r.createdAt).toLocaleDateString()}</span> },
            ]}
          />
        )}
      </main>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create user"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={() => (document.getElementById('user-form') as HTMLFormElement)?.requestSubmit()}>Create</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={create} className="space-y-4">
          <TextInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required placeholder="min 8 chars" />
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Role</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </form>
      </Modal>
    </>
  );
}
