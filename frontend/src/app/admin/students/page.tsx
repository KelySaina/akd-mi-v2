'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, GraduationCap } from 'lucide-react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { DataTable, Avatar, Badge } from '@/components/DataTable';
import { Modal, TextInput, Button, FormSection, FormGrid } from '@/components/ui';
import { PasswordReveal } from '@/components/PasswordReveal';
import { api } from '@/lib/api';

type Student = {
  id: string;
  studentNumber: string;
  status?: string;
  user: { id: string; email: string; name: string; avatarUrl?: string | null; isActive: boolean };
  program?: { id: string; name: string } | null;
  enrollmentYear?: number | null;
  createdAt: string;
};

const STATUS_TONES: Record<string, 'default' | 'success' | 'warn' | 'danger' | 'brand'> = {
  active: 'success',
  graduated: 'brand',
  suspended: 'warn',
  dropped: 'danger',
};

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', studentNumber: '', enrollmentYear: '' });
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/students?limit=100${q ? `&q=${encodeURIComponent(q)}` : ''}`);
      setRows(res.items ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.enrollmentYear).filter(Boolean))).sort((a, b) => (b! - a!)) as number[],
    [rows],
  );

  const visible = rows.filter((r) => {
    if (yearFilter !== 'all' && String(r.enrollmentYear ?? '') !== yearFilter) return false;
    if (statusFilter !== 'all') {
      const s = (r.status ?? 'active').toLowerCase();
      if (s !== statusFilter) return false;
    }
    return true;
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        email: form.email,
        name: form.name,
        studentNumber: form.studentNumber,
        enrollmentYear: form.enrollmentYear ? Number(form.enrollmentYear) : null,
      };
      const res = await api.post('/students', payload);
      if (res.generatedPassword) setGeneratedPassword(res.generatedPassword);
      else { setOpen(false); setForm({ email: '', name: '', studentNumber: '', enrollmentYear: '' }); }
      load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <>
      <Topbar
        title="Students"
        action={
          <PrimaryButton onClick={() => { setGeneratedPassword(null); setOpen(true); }}>New student</PrimaryButton>
        }
      />
      <main className="p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={(e) => { e.preventDefault(); load(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 flex-1 min-w-[14rem]"
          >
            <Search className="size-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, or student #…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400"
            />
          </form>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm"
          >
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm capitalize"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
            <option value="dropped">Dropped</option>
          </select>
          <div className="text-sm text-ink-500 dark:text-ink-400 ml-auto inline-flex items-center gap-1">
            <Filter className="size-3.5" /> {visible.length} of {rows.length}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded shimmer" />)}
          </div>
        ) : (
          <DataTable
            rows={visible}
            empty="No students match these filters."
            columns={[
              {
                key: 'student',
                header: 'Student',
                render: (r) => (
                  <Link href={`/admin/students/${r.id}`} className="flex items-center gap-3 group">
                    <Avatar name={r.user.name} src={r.user.avatarUrl} />
                    <div>
                      <div className="font-medium group-hover:text-brand-700 dark:group-hover:text-brand-300 transition">{r.user.name}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">{r.user.email}</div>
                    </div>
                  </Link>
                ),
              },
              { key: 'number', header: 'Student #', render: (r) => <code className="text-xs">{r.studentNumber}</code> },
              { key: 'program', header: 'Program', render: (r) => r.program?.name ?? <span className="text-ink-400">—</span> },
              { key: 'year', header: 'Year', render: (r) => r.enrollmentYear ?? <span className="text-ink-400">—</span> },
              {
                key: 'status',
                header: 'Status',
                render: (r) => {
                  const s = (r.status ?? 'active').toLowerCase();
                  return <Badge tone={STATUS_TONES[s] ?? 'default'}>{s}</Badge>;
                },
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <Link href={`/admin/students/${r.id}`} className="text-sm text-brand-700 dark:text-brand-300 hover:underline">
                    Open →
                  </Link>
                ),
              },
            ]}
          />
        )}
      </main>

      <Modal
        open={open}
        onClose={() => { if (!generatedPassword) setOpen(false); }}
        title={generatedPassword ? 'Student created' : 'Enrol a new student'}
        description={generatedPassword
          ? 'A password has been generated. Share it securely — it will not be shown again.'
          : 'Create the user account and the student profile in one step. A password will be generated automatically.'}
        icon={<GraduationCap className="size-5" />}
        intent={generatedPassword ? 'info' : 'primary'}
        size={generatedPassword ? 'md' : 'xl'}
        dismissOnBackdrop={!generatedPassword}
        footer={
          generatedPassword ? (
            <Button onClick={() => { setOpen(false); setGeneratedPassword(null); setForm({ email: '', name: '', studentNumber: '', enrollmentYear: '' }); }}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => (document.getElementById('student-form') as HTMLFormElement)?.requestSubmit()}>
                <GraduationCap className="size-4" /> Create student
              </Button>
            </>
          )
        }
      >
        {generatedPassword ? (
          <PasswordReveal password={generatedPassword} />
        ) : (
          <form id="student-form" onSubmit={create} className="space-y-6">
            <FormSection
              title="Identity"
              description="How the student will be addressed and signed in."
              required
            >
              <FormGrid cols={2}>
                <TextInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="e.g. Alex Johnson" maxLength={120} />
                <TextInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required placeholder="alex@school.tld" hint="Used to sign in. Must be unique." />
              </FormGrid>
            </FormSection>

            <FormSection
              title="Academic record"
              description="Used to identify the student inside the institution."
            >
              <FormGrid cols={2}>
                <TextInput
                  label="Student number"
                  value={form.studentNumber}
                  onChange={(v) => setForm({ ...form, studentNumber: v })}
                  required
                  placeholder="STU-001"
                  hint="Internal identifier shown on transcripts and badges."
                />
                <TextInput
                  label="Enrollment year"
                  type="number"
                  value={form.enrollmentYear}
                  onChange={(v) => setForm({ ...form, enrollmentYear: v })}
                  placeholder="2025"
                  hint="Academic year the student joined. Optional."
                />
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
