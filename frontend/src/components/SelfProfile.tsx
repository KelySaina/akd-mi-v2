'use client';
import { useEffect, useState } from 'react';
import { Save, Loader2, KeyRound } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Modal, TextInput, Button } from '@/components/ui';
import { MediaField } from '@/components/MediaPicker';
import { api } from '@/lib/api';
import { useAuth, AuthUser, signIn, getToken } from '@/lib/auth';

export function SelfProfile({ title = 'Profile' }: { title?: string }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name ?? '', phone: '', avatarUrl: user.avatarUrl ?? '' });
    // load phone from /auth/me
    (async () => {
      try {
        const fresh = await api.get<AuthUser & { phone?: string | null }>('/auth/me');
        setForm({ name: fresh.name, phone: fresh.phone ?? '', avatarUrl: fresh.avatarUrl ?? '' });
      } catch { /* ignore */ }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await api.patch<AuthUser>('/auth/me', {
        name: form.name,
        phone: form.phone || null,
        avatarUrl: form.avatarUrl || null,
      });
      // refresh local user in storage so sidebar/topbar reflect changes
      const tok = getToken();
      if (tok) signIn(tok, { ...user!, ...updated });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Topbar title={title} />
      <main className="p-4 lg:p-6 max-w-3xl w-full mx-auto space-y-4">
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        <form onSubmit={save} className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="font-semibold">Account information</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">These details appear on your dashboard and in shared rosters.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <TextInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+33 1 23 45 67 89" />
          </div>
          <div>
            <div className="text-xs text-ink-500 dark:text-ink-400 mb-1">Email (read-only — ask an admin to change)</div>
            <input value={user.email} readOnly className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/50 text-ink-700 dark:text-ink-300 text-sm" />
          </div>
          <MediaField label="Avatar" value={form.avatarUrl} onChange={(v) => setForm({ ...form, avatarUrl: v })} kindHint="other" hint="Square images look best." />

          <div className="flex items-center gap-3 pt-2 border-t border-ink-200 dark:border-ink-800">
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Saving</> : <><Save className="size-4" /> Save changes</>}
            </Button>
            <Button variant="ghost" onClick={() => setPwOpen(true)}><KeyRound className="size-4" /> Change password</Button>
            {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>}
          </div>
        </form>

        <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      </main>
    </>
  );
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) { setForm({ currentPassword: '', newPassword: '', confirm: '' }); setError(null); setDone(false); }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.newPassword !== form.confirm) { setError('Confirmation does not match.'); return; }
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setDone(true); setTimeout(onClose, 1200);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      footer={
        done ? null : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => (document.getElementById('pw-form') as HTMLFormElement)?.requestSubmit()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : 'Update'}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="text-sm text-emerald-600 dark:text-emerald-400">Password updated. ✓</div>
      ) : (
        <form id="pw-form" onSubmit={submit} className="space-y-3">
          <TextInput label="Current password" type="password" value={form.currentPassword} onChange={(v) => setForm({ ...form, currentPassword: v })} required />
          <TextInput label="New password" type="password" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} required placeholder="At least 8 characters" />
          <TextInput label="Confirm new password" type="password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} required />
          {error && <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>}
        </form>
      )}
    </Modal>
  );
}
