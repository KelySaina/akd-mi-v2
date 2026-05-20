'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { TextInput, Button, Modal } from '@/components/ui';
import {
  Building2, Globe, Save, Loader2, MapPin, Phone, Plus, Trash2, Star,
  Mail, Facebook, Instagram, Twitter, Linkedin,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MediaField } from '@/components/MediaPicker';
import { useDialog } from '@/components/DialogProvider';

type Address = {
  id: string; label?: string | null; line1: string; line2?: string | null;
  city: string; region?: string | null; postalCode?: string | null;
  country: string; isPrimary: boolean;
};
type Contact = {
  id: string; type: string; value: string; label?: string | null; isPrimary: boolean;
};
type Institution = {
  id: string; name: string; legalName?: string | null;
  category?: string; description?: string | null;
  foundedYear?: number | null;
  logoUrl?: string | null; coverUrl?: string | null;
  websiteUrl?: string | null;
  isPublished: boolean;
  addresses: Address[];
  contacts: Contact[];
};

const CATEGORIES = ['UNIVERSITY','COLLEGE','HIGH_SCHOOL','SCHOOL','TRAINING_CENTER','OTHER'];
const CONTACT_TYPES = ['phone', 'email', 'website', 'facebook', 'instagram', 'twitter', 'linkedin', 'other'];

type Tab = 'profile' | 'addresses' | 'contacts';

export default function InstitutionPage() {
  const [inst, setInst] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const res = await api.get('/institution');
      setInst(res);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <>
        <Topbar title="Institution" />
        <main className="p-8"><div className="h-96 rounded-2xl shimmer max-w-4xl mx-auto" /></main>
      </>
    );
  }
  if (!inst) return <main className="p-8 text-ink-500">No institution found.</main>;

  return (
    <>
      <Topbar title="Institution" />
      <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto">
        <Hero inst={inst} />

        <div className="mt-4 flex gap-1 border-b border-ink-200 dark:border-ink-800 mb-4">
          <TabBtn active={tab === 'profile'}   onClick={() => setTab('profile')}>Profile</TabBtn>
          <TabBtn active={tab === 'addresses'} onClick={() => setTab('addresses')}>
            Addresses <Count n={inst.addresses?.length ?? 0} />
          </TabBtn>
          <TabBtn active={tab === 'contacts'}  onClick={() => setTab('contacts')}>
            Contacts <Count n={inst.contacts?.length ?? 0} />
          </TabBtn>
        </div>

        {error && (
          <div className="mb-4 text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {tab === 'profile'   && <ProfileForm   inst={inst} onSaved={(u) => setInst({ ...inst, ...u })} onError={setError} />}
        {tab === 'addresses' && <AddressesTab  inst={inst} reload={reload} onError={setError} />}
        {tab === 'contacts'  && <ContactsTab   inst={inst} reload={reload} onError={setError} />}
      </main>
    </>
  );
}

function Hero({ inst }: { inst: Institution }) {
  return (
    <div className="rounded-2xl bg-grad-brand text-white px-5 py-4 relative overflow-hidden">
      {inst.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={inst.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      )}
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-center gap-3 relative">
        <div className="size-12 rounded-xl bg-white/15 grid place-items-center overflow-hidden shrink-0">
          {inst.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={inst.logoUrl} alt={inst.name} className="size-full object-cover" />
            : <Building2 className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold truncate">{inst.name}</h2>
          <div className="text-white/80 text-xs flex items-center gap-2 flex-wrap">
            <span>{inst.category ?? 'Uncategorized'}</span>
            {inst.websiteUrl && (
              <>
                <span className="opacity-50">·</span>
                <a href={inst.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white truncate">
                  <Globe className="size-3" /> {inst.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-2',
        active
          ? 'border-brand-600 text-brand-700 dark:text-brand-300'
          : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="text-xs px-1.5 py-0.5 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">{n}</span>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

/* ───────── PROFILE TAB ───────── */

function ProfileForm({
  inst, onSaved, onError,
}: { inst: Institution; onSaved: (u: Partial<Institution>) => void; onError: (m: string | null) => void }) {
  const [form, setForm] = useState({
    name: inst.name,
    legalName: inst.legalName ?? '',
    category: inst.category ?? 'OTHER',
    description: inst.description ?? '',
    foundedYear: inst.foundedYear ?? null as number | null,
    websiteUrl: inst.websiteUrl ?? '',
    logoUrl: inst.logoUrl ?? '',
    coverUrl: inst.coverUrl ?? '',
    isPublished: inst.isPublished,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false); onError(null);
    try {
      const payload = {
        name: form.name,
        legalName: form.legalName || null,
        category: form.category,
        description: form.description || null,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
        websiteUrl: form.websiteUrl || null,
        logoUrl: form.logoUrl || null,
        coverUrl: form.coverUrl || null,
        isPublished: form.isPublished,
      };
      const res = await api.patch('/institution', payload);
      onSaved(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { onError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-4">
      <div className="grid lg:grid-cols-2 gap-x-5 gap-y-3">
        {/* Left column — identity */}
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <TextInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput label="Legal name" value={form.legalName} onChange={(v) => setForm({ ...form, legalName: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </label>
            <TextInput
              label="Founded year" type="number"
              value={String(form.foundedYear ?? '')}
              onChange={(v) => setForm({ ...form, foundedYear: v ? Number(v) : null })}
            />
          </div>
          <TextInput label="Website" value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} placeholder="https://…" />
          <label className="block">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Tell visitors about your institution…"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 resize-y"
            />
          </label>
        </div>

        {/* Right column — media + publish */}
        <div className="space-y-3">
          <MediaField label="Logo"  value={form.logoUrl}  onChange={(v) => setForm({ ...form, logoUrl: v })}  kindHint="logo"  hint="Square works best." />
          <MediaField label="Cover" value={form.coverUrl} onChange={(v) => setForm({ ...form, coverUrl: v })} kindHint="cover" hint="Wide image for hero." />
          <label className="flex items-center gap-3 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/50">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="size-4 rounded accent-blue-600"
            />
            <span className="text-sm">Publish institution profile publicly</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-3 mt-3 border-t border-ink-200 dark:border-ink-800">
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" /> Saving</> : <><Save className="size-4" /> Save changes</>}
        </Button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>}
      </div>
    </form>
  );
}

/* ───────── ADDRESSES TAB ───────── */

function AddressesTab({ inst, reload, onError }: { inst: Institution; reload: () => Promise<void>; onError: (m: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(a: Address) { setEditing(a); setOpen(true); }

  const dialog = useDialog();
  async function remove(id: string) {
    const ok = await dialog.confirm({ title: 'Delete address', message: 'Delete this address?', tone: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    onError(null);
    try { await api.delete(`/institution/addresses/${id}`); await reload(); }
    catch (e: any) { onError(e.message); }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><MapPin className="size-4 text-brand-600 dark:text-brand-400" /> Addresses</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">Where your institution operates.</p>
        </div>
        <Button onClick={openNew}><Plus className="size-4" /> Add address</Button>
      </div>

      {inst.addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 dark:border-ink-700 p-8 text-center text-ink-500 dark:text-ink-400 text-sm">
          No addresses yet.
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {inst.addresses.map((a) => (
            <li key={a.id} className="py-3 flex items-start gap-3">
              <div className="size-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
                <MapPin className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.label && <span className="text-xs uppercase tracking-wider text-brand-700 dark:text-brand-300">{a.label}</span>}
                  {a.isPrimary && (
                    <span className="text-xs inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">
                      <Star className="size-3" /> Primary
                    </span>
                  )}
                </div>
                <div className="text-sm">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                <div className="text-sm text-ink-500 dark:text-ink-400">
                  {[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="text-sm px-2 py-1 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800">Edit</button>
                <button onClick={() => remove(a.id)} className="size-8 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressModal
        open={open}
        initial={editing}
        onClose={() => setOpen(false)}
        onSaved={async () => { setOpen(false); await reload(); }}
        onError={onError}
      />
    </Card>
  );
}

function AddressModal({
  open, initial, onClose, onSaved, onError,
}: {
  open: boolean; initial: Address | null; onClose: () => void;
  onSaved: () => void | Promise<void>; onError: (m: string | null) => void;
}) {
  const blank = { label: '', line1: '', line2: '', city: '', region: '', postalCode: '', country: '', isPrimary: false };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        label: initial.label ?? '', line1: initial.line1, line2: initial.line2 ?? '',
        city: initial.city, region: initial.region ?? '', postalCode: initial.postalCode ?? '',
        country: initial.country, isPrimary: initial.isPrimary,
      } : blank);
    }
  }, [open, initial]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); onError(null);
    try {
      const payload: any = {
        label: form.label || null,
        line1: form.line1,
        line2: form.line2 || null,
        city: form.city,
        region: form.region || null,
        postalCode: form.postalCode || null,
        country: form.country,
        isPrimary: form.isPrimary,
      };
      if (initial) await api.patch(`/institution/addresses/${initial.id}`, payload);
      else         await api.post('/institution/addresses', payload);
      await onSaved();
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit address' : 'Add address'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (document.getElementById('addr-form') as HTMLFormElement)?.requestSubmit()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : (initial ? 'Save' : 'Add')}
          </Button>
        </>
      }
    >
      <form id="addr-form" onSubmit={submit} className="space-y-4">
        <TextInput label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="HQ, Annex, Campus North…" />
        <TextInput label="Street address" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} required />
        <TextInput label="Address line 2" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} placeholder="Suite, building…" />
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
          <TextInput label="Region / State" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Postal code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} />
          <TextInput label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
        </div>
        <label className="flex items-center gap-3 pt-1">
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} className="size-4 rounded accent-blue-600" />
          <span className="text-sm">Mark as primary address</span>
        </label>
      </form>
    </Modal>
  );
}

/* ───────── CONTACTS TAB ───────── */

const TYPE_ICON: Record<string, any> = {
  phone: Phone, email: Mail, website: Globe,
  facebook: Facebook, instagram: Instagram, twitter: Twitter, linkedin: Linkedin,
  other: Globe,
};

function ContactsTab({ inst, reload, onError }: { inst: Institution; reload: () => Promise<void>; onError: (m: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const dialog = useDialog();

  async function remove(id: string) {
    const ok = await dialog.confirm({ title: 'Delete contact', message: 'Delete this contact?', tone: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    onError(null);
    try { await api.delete(`/institution/contacts/${id}`); await reload(); }
    catch (e: any) { onError(e.message); }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Phone className="size-4 text-brand-600 dark:text-brand-400" /> Contacts</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">Phone numbers, emails, social profiles…</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add contact</Button>
      </div>

      {inst.contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 dark:border-ink-700 p-8 text-center text-ink-500 dark:text-ink-400 text-sm">
          No contact channels yet.
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {inst.contacts.map((c) => {
            const Icon = TYPE_ICON[c.type.toLowerCase()] ?? Globe;
            return (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink-200 dark:border-ink-800 p-3">
                <div className="size-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{c.value}</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-2">
                    <span className="capitalize">{c.type}</span>
                    {c.label && <span>· {c.label}</span>}
                    {c.isPrimary && <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1"><Star className="size-3" /> primary</span>}
                  </div>
                </div>
                <button onClick={() => remove(c.id)} className="size-8 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600">
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ContactModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={async () => { setOpen(false); await reload(); }}
        onError={onError}
      />
    </Card>
  );
}

function ContactModal({
  open, onClose, onSaved, onError,
}: { open: boolean; onClose: () => void; onSaved: () => void | Promise<void>; onError: (m: string | null) => void }) {
  const [form, setForm] = useState({ type: 'phone', value: '', label: '', isPrimary: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setForm({ type: 'phone', value: '', label: '', isPrimary: false }); }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); onError(null);
    try {
      await api.post('/institution/contacts', {
        type: form.type,
        value: form.value,
        label: form.label || null,
        isPrimary: form.isPrimary,
      });
      await onSaved();
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add contact"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (document.getElementById('contact-form') as HTMLFormElement)?.requestSubmit()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
          </Button>
        </>
      }
    >
      <form id="contact-form" onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 capitalize"
          >
            {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <TextInput
          label="Value"
          value={form.value}
          onChange={(v) => setForm({ ...form, value: v })}
          required
          placeholder={
            form.type === 'phone' ? '+33 1 23 45 67 89' :
            form.type === 'email' ? 'contact@school.edu' :
            'https://…'
          }
        />
        <TextInput label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="Main reception, Admissions…" />
        <label className="flex items-center gap-3 pt-1">
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} className="size-4 rounded accent-blue-600" />
          <span className="text-sm">Mark as primary</span>
        </label>
      </form>
    </Modal>
  );
}
