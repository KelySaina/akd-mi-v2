'use client';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Avatar, Badge } from '@/components/DataTable';
import { Modal, TextInput, Button, FormSection, FormGrid } from '@/components/ui';
import { PasswordReveal } from '@/components/PasswordReveal';
import { api } from '@/lib/api';

type Teacher = {
  id: string; staffNumber?: string | null; title?: string | null; specialties?: string[];
  user: { id: string; email: string; name: string; avatarUrl?: string | null; isActive: boolean };
  createdAt: string;
};

export default function TeachersPage() {
  const [rows, setRows] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', staffNumber: '', title: '' });
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/teachers?limit=50');
      setRows(res.items ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/teachers', form);
      if (res.generatedPassword) setGenerated(res.generatedPassword);
      else { setOpen(false); setForm({ email: '', name: '', staffNumber: '', title: '' }); }
      load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <>
      <Topbar title="Teachers" action={<PrimaryButton onClick={() => { setGenerated(null); setOpen(true); }}>New teacher</PrimaryButton>} />
      <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        {loading ? (
          <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded shimmer" />)}
          </div>
        ) : (
          <DataTable
            rows={rows}
            empty="No teachers yet."
            columns={[
              { key: 'teacher', header: 'Teacher', render: (r) => (
                <div className="flex items-center gap-3">
                  <Avatar name={r.user.name} src={r.user.avatarUrl} />
                  <div>
                    <div className="font-medium">{r.user.name}</div>
                    <div className="text-xs text-ink-500">{r.user.email}</div>
                  </div>
                </div>
              ) },
              { key: 'num', header: 'Staff #', render: (r) => r.staffNumber ?? <span className="text-ink-400">—</span> },
              { key: 'title', header: 'Title', render: (r) => r.title ?? <span className="text-ink-400">—</span> },
              { key: 'status', header: '', render: (r) => <Badge tone={r.user.isActive ? 'success' : 'danger'}>{r.user.isActive ? 'active' : 'disabled'}</Badge> },
            ]}
          />
        )}
      </main>

      <Modal
        open={open}
        onClose={() => { if (!generated) setOpen(false); }}
        title={generated ? 'Teacher created' : 'Onboard a new teacher'}
        description={generated
          ? 'A password has been generated. Share it securely — it will not be shown again.'
          : 'Create the user account and the teacher profile in one step. A password will be generated automatically.'}
        icon={<Users className="size-5" />}
        intent={generated ? 'info' : 'primary'}
        size={generated ? 'md' : 'xl'}
        dismissOnBackdrop={!generated}
        footer={
          generated ? (
            <Button onClick={() => { setOpen(false); setGenerated(null); setForm({ email: '', name: '', staffNumber: '', title: '' }); }}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => (document.getElementById('teacher-form') as HTMLFormElement)?.requestSubmit()}>
                <Users className="size-4" /> Create teacher
              </Button>
            </>
          )
        }
      >
        {generated ? (
          <PasswordReveal password={generated} label="Shown only once. Copy and share it with the teacher now — it cannot be recovered later." />
        ) : (
          <form id="teacher-form" onSubmit={create} className="space-y-6">
            <FormSection
              title="Identity"
              description="How the teacher will be addressed and signed in."
              required
            >
              <FormGrid cols={2}>
                <TextInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="e.g. Marie Curie" maxLength={120} />
                <TextInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required placeholder="name@school.tld" hint="Used to sign in. Must be unique." />
              </FormGrid>
            </FormSection>

            <FormSection
              title="Staff profile"
              description="Optional metadata shown on the teacher's profile and in course assignments."
            >
              <FormGrid cols={2}>
                <TextInput label="Staff number" value={form.staffNumber} onChange={(v) => setForm({ ...form, staffNumber: v })} placeholder="e.g. STF-014" hint="Internal identifier. Leave blank if unused." />
                <TextInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Mr., Dr., Prof." hint="Honorific shown before the name." />
              </FormGrid>
            </FormSection>

            <div className="text-xs text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-800/60 rounded-lg px-3 py-2 border border-ink-200 dark:border-ink-700">
              A strong password will be generated automatically and revealed once after creation.
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
