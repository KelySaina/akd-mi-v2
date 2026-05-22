'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, Copy, Search, ImagePlus, Image as ImageIcon, Sparkles, Layout, FileText, Film, Wand2, Box, ArrowRight } from 'lucide-react';
import { Topbar, PrimaryButton } from '@/components/Topbar';
import { Button, Modal, TextInput } from '@/components/ui';
import { api, uploadFile } from '@/lib/api';
import { MEDIA_KINDS, type MediaItem } from '@/components/MediaPicker';
import { useDialog } from '@/components/DialogProvider';

type KindOption = {
  value: string;
  label: string;
  icon: typeof ImageIcon;
  blurb: string;
  example: string;
};

const KIND_OPTIONS: KindOption[] = [
  { value: 'auto',     label: 'Smart auto',   icon: Wand2,     blurb: 'Pick the kind from the file type. Images become gallery, videos become video, the rest become document.', example: 'Use when you upload a mixed batch and just want it sorted.' },
  { value: 'logo',     label: 'Logo',         icon: Sparkles,  blurb: 'Your institution mark — shown in the topbar, on the public landing page and on shared links.',           example: 'A transparent PNG/SVG of the school logo.' },
  { value: 'cover',    label: 'Cover',        icon: Layout,    blurb: 'Large hero image used at the top of the landing page and in headers.',                                  example: 'A wide campus or classroom photo.' },
  { value: 'gallery',  label: 'Gallery',      icon: ImageIcon, blurb: 'Reusable photos for course thumbnails, event recaps, slideshows and decorative spots across the site.',  example: 'Class photos, event snapshots, illustrations.' },
  { value: 'document', label: 'Document',     icon: FileText,  blurb: 'PDFs and downloadable papers students or staff might need to read or print.',                            example: 'Syllabus, brochure, application form, rulebook.' },
  { value: 'video',    label: 'Video',        icon: Film,      blurb: 'Promo or course videos. Stored as-is; embed by URL where you need them.',                                example: 'Welcome video, course intro reel.' },
  { value: 'other',    label: 'Other',        icon: Box,       blurb: 'Anything that doesn’t fit the categories above. It will not appear in image pickers by default.',         example: 'Spreadsheets, archives, raw assets.' },
];

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [chosenKind, setChosenKind] = useState<string>('auto');
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useDialog();

  async function reload() {
    setError(null);
    try { setItems(await api.get<MediaItem[]>('/institution/media')); }
    catch (e: any) { setError(e.message); }
  }

  useEffect(() => { (async () => { setLoading(true); await reload(); setLoading(false); })(); }, []);

  function promptKind(files: File[]) {
    if (!files.length) return;
    setPendingFiles(files);
    setChosenKind('auto');
  }

  function kindFromMime(mime: string): string {
    if (mime.startsWith('image/')) return 'gallery';
    if (mime.startsWith('video/')) return 'video';
    return 'document';
  }

  async function ingest(files: File[], kindHint: string) {
    setUploading(true); setError(null);
    try {
      for (const f of files) {
        const up = await uploadFile(f);
        const kind = kindHint === 'auto' ? kindFromMime(f.type || '') : kindHint;
        await api.post('/institution/media', {
          kind,
          url: up.url,
          title: f.name,
          filename: f.name,
          mimeType: up.mimeType ?? f.type ?? null,
          size: up.size ?? f.size ?? null,
        });
      }
      await reload();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  async function remove(id: string) {
    const ok = await dialog.confirm({
      title: 'Delete media',
      message: 'Delete this media item? It will be removed from all courses it is attached to.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try { await api.delete(`/institution/media/${id}`); await reload(); }
    catch (e: any) { setError(e.message); }
  }

  const filtered = items.filter((m) => {
    if (kindFilter !== 'all' && m.kind !== kindFilter) return false;
    if (q && !(m.url + ' ' + (m.caption ?? '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <Topbar
        title="Media library"
        action={
          <PrimaryButton onClick={() => fileInput.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload'}
          </PrimaryButton>
        }
      />
      <main className="p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) promptKind(Array.from(e.target.files)); if (fileInput.current) fileInput.current.value = ''; }}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 flex-1 min-w-[14rem]">
            <Search className="size-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or URL…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm capitalize"
          >
            <option value="all">All kinds</option>
            {MEDIA_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="text-sm text-ink-500 dark:text-ink-400 ml-auto">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Dropzone + grid */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            if (e.dataTransfer.files?.length) promptKind(Array.from(e.dataTransfer.files));
          }}
          className={[
            'rounded-2xl border-2 border-dashed transition',
            dragOver ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-500/5' : 'border-ink-200 dark:border-ink-800',
            'bg-white dark:bg-ink-900 p-4 min-h-[20rem]',
          ].join(' ')}
        >
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-square rounded-xl shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-72 grid place-items-center text-center text-ink-500 dark:text-ink-400">
              <div>
                <ImagePlus className="size-10 mx-auto opacity-50" />
                <div className="mt-3 text-sm">Drop files here or click <button onClick={() => fileInput.current?.click()} className="text-brand-700 dark:text-brand-300 hover:underline">Upload</button>.</div>
                <div className="text-xs mt-1">Images go to MinIO and become reusable across the app.</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((m) => (
                <MediaCard key={m.id} item={m} onDelete={() => remove(m.id)} onEdit={() => setEditItem(m)} />
              ))}
            </div>
          )}
        </div>
      </main>

      <EditMediaModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={async () => { setEditItem(null); await reload(); }}
        onError={setError}
      />

      <Modal
        open={!!pendingFiles}
        onClose={() => !uploading && setPendingFiles(null)}
        title="What kind of files are these?"
        description={pendingFiles && pendingFiles.length === 1
          ? `Choose a category for “${pendingFiles[0].name}” — it controls where it shows up across the app.`
          : `Choose a category for the ${pendingFiles?.length ?? 0} files — it controls where they show up across the app.`}
        size="xl"
        dismissOnBackdrop={!uploading}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingFiles(null)} disabled={uploading}>Cancel</Button>
            <Button
              onClick={async () => {
                const files = pendingFiles;
                if (!files) return;
                setPendingFiles(null);
                await ingest(files, chosenKind);
              }}
              disabled={uploading}
            >
              {uploading ? <><Loader2 className="size-4 animate-spin" /> Uploading…</> : <>Upload {pendingFiles?.length ?? 0} file{(pendingFiles?.length ?? 0) === 1 ? '' : 's'} <ArrowRight className="size-4" /></>}
            </Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {KIND_OPTIONS.map((k) => {
            const Icon = k.icon;
            const active = chosenKind === k.value;
            return (
              <button
                key={k.value}
                type="button"
                onClick={() => setChosenKind(k.value)}
                className={[
                  'text-left rounded-xl border p-3 transition flex gap-3',
                  active
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 ring-2 ring-brand-500/30'
                    : 'border-ink-200 dark:border-ink-700 hover:border-brand-400 hover:bg-ink-50 dark:hover:bg-ink-800/60',
                ].join(' ')}
              >
                <div className={[
                  'size-9 rounded-lg grid place-items-center shrink-0',
                  active ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300',
                ].join(' ')}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{k.label}</div>
                  <div className="text-xs text-ink-600 dark:text-ink-300 mt-0.5 leading-snug">{k.blurb}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-1 italic">e.g. {k.example}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

function MediaCard({ item, onDelete, onEdit }: { item: MediaItem; onDelete: () => void; onEdit: () => void }) {
  const [copied, setCopied] = useState(false);
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(item.url) || item.kind !== 'document';
  return (
    <div className="group relative rounded-xl overflow-hidden border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-800">
      <button onClick={onEdit} className="block aspect-square w-full">
        {isImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.url} alt={item.caption ?? ''} className="size-full object-cover" />
          : <div className="size-full grid place-items-center text-ink-500 text-xs uppercase">{item.kind}</div>}
      </button>
      <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent text-white text-[11px] flex items-center justify-between gap-1">
        <span className="capitalize truncate">{item.kind}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }
              catch { /* ignore */ }
            }}
            className="size-6 grid place-items-center rounded bg-white/15 hover:bg-white/25"
            title="Copy URL"
          >
            <Copy className="size-3" />
          </button>
          <button
            onClick={onDelete}
            className="size-6 grid place-items-center rounded bg-rose-500/80 hover:bg-rose-500"
            title="Delete"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
      {copied && (
        <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">Copied</div>
      )}
    </div>
  );
}

function EditMediaModal({
  item, onClose, onSaved, onError,
}: { item: MediaItem | null; onClose: () => void; onSaved: () => void; onError: (m: string | null) => void }) {
  const [form, setForm] = useState({ kind: '', caption: '', sortOrder: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item) setForm({ kind: item.kind, caption: item.caption ?? '', sortOrder: item.sortOrder ?? 0 });
  }, [item]);

  async function save() {
    if (!item) return;
    setBusy(true); onError(null);
    try {
      await api.patch(`/institution/media/${item.id}`, {
        kind: form.kind,
        caption: form.caption || null,
        sortOrder: Number(form.sortOrder) || 0,
      });
      onSaved();
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Edit media"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}</Button>
        </>
      }
    >
      {item && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" className="w-full max-h-64 object-contain bg-checker" />
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={item.url}
              className="flex-1 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-600 dark:text-ink-300"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(item.url)}
              className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Kind</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 text-sm capitalize"
              >
                {MEDIA_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <TextInput
              label="Sort order" type="number"
              value={String(form.sortOrder)}
              onChange={(v) => setForm({ ...form, sortOrder: Number(v) || 0 })}
            />
          </div>
          <TextInput label="Caption" value={form.caption} onChange={(v) => setForm({ ...form, caption: v })} />
        </div>
      )}
    </Modal>
  );
}
