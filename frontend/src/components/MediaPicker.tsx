'use client';
import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2, Search, Check, ImagePlus, Trash2, Copy } from 'lucide-react';
import { api, uploadFile } from '@/lib/api';
import { Modal, Button } from '@/components/ui';

export type MediaItem = {
  id: string;
  kind: string;
  url: string;
  caption?: string | null;
  sortOrder: number;
  createdAt: string;
};

export const MEDIA_KINDS = ['logo', 'cover', 'gallery', 'document', 'other'];

/** Upload one or more files → create media rows. Returns the created items. */
export async function uploadAndRegister(files: File[], kind = 'gallery'): Promise<MediaItem[]> {
  const created: MediaItem[] = [];
  for (const file of files) {
    const up = await uploadFile(file);
    const m = await api.post<MediaItem>('/institution/media', { kind, url: up.url });
    created.push(m);
  }
  return created;
}

/**
 * Media picker modal — pick one or many items from the library.
 * Has a built-in upload zone that registers files as media on the fly.
 */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  defaultKind = 'gallery',
  title = 'Select media',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  defaultKind?: string;
  title?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function reload() {
    setLoading(true); setError(null);
    try { setItems(await api.get<MediaItem[]>('/institution/media')); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (open) { setSelected(new Set()); reload(); }
  }, [open]);

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true); setError(null);
    try {
      const created = await uploadAndRegister(Array.from(list), defaultKind);
      await reload();
      // auto-select the newly uploaded ones
      setSelected(new Set(created.map((c) => c.id)));
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ''; }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (multiple) {
        if (next.has(id)) next.delete(id); else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }

  function confirm() {
    const picked = items.filter((m) => selected.has(m.id));
    if (picked.length) onSelect(picked);
    onClose();
  }

  const filtered = items.filter((m) => {
    if (kindFilter !== 'all' && m.kind !== kindFilter) return false;
    if (q && !(m.url + ' ' + (m.caption ?? '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={selected.size === 0}>
            <Check className="size-4" /> Use {selected.size > 1 ? `(${selected.size})` : 'selected'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 flex-1 min-w-[12rem]">
            <Search className="size-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm capitalize"
          >
            <option value="all">All kinds</option>
            {MEDIA_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
          </Button>
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Grid */}
        <div className="min-h-[18rem] max-h-[28rem] overflow-y-auto rounded-xl border border-ink-200 dark:border-ink-800 p-2">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-lg shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-64 grid place-items-center text-ink-500 dark:text-ink-400 text-sm gap-3">
              <ImagePlus className="size-8 opacity-50" />
              <div>Your library is empty. Upload an image to get started.</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((m) => {
                const isSel = selected.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={[
                      'group relative aspect-square rounded-lg overflow-hidden border-2 transition',
                      isSel
                        ? 'border-brand-500 ring-2 ring-brand-300 dark:ring-brand-500/40'
                        : 'border-transparent hover:border-ink-300 dark:hover:border-ink-700',
                    ].join(' ')}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.caption ?? ''} className="size-full object-cover bg-ink-100 dark:bg-ink-800" />
                    <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white text-left flex items-center justify-between">
                      <span className="capitalize">{m.kind}</span>
                    </div>
                    {isSel && (
                      <div className="absolute top-1 right-1 size-5 rounded-full bg-brand-600 text-white grid place-items-center shadow">
                        <Check className="size-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Small image-or-pick input. Shows preview + buttons "Choose" and "Clear". */
export function MediaField({
  label, value, onChange, kindHint = 'gallery', hint,
}: { label: string; value: string; onChange: (url: string) => void; kindHint?: string; hint?: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div>
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="size-14 rounded-lg bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 grid place-items-center overflow-hidden text-ink-400 shrink-0">
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt="" className="size-full object-cover" />
            : <ImagePlus className="size-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or pick from library"
            className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30"
          />
          <div className="mt-1 flex items-center gap-2">
            <button type="button" onClick={() => setPickerOpen(true)} className="text-xs text-brand-700 dark:text-brand-300 hover:underline inline-flex items-center gap-1">
              <ImagePlus className="size-3" /> Choose from library
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="text-xs text-ink-500 hover:underline">Clear</button>
            )}
            {hint && <span className="text-xs text-ink-500 dark:text-ink-400 ml-auto">{hint}</span>}
          </div>
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        defaultKind={kindHint}
        title={`Select ${label.toLowerCase()}`}
        onSelect={(items) => { if (items[0]) onChange(items[0].url); }}
      />
    </div>
  );
}

/** Inline button that shows a copy-to-clipboard chip. */
export function CopyUrlButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1500); }
        catch { /* ignore */ }
      }}
      className="inline-flex items-center gap-1 text-xs text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300"
      title="Copy URL"
    >
      <Copy className="size-3" /> {done ? 'Copied' : 'Copy URL'}
    </button>
  );
}

export { Trash2 };
