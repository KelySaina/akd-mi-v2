'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText, FileImage, Film, Link as LinkIcon, Trash2, Upload, Loader2, FolderOpen } from 'lucide-react';
import { api, uploadFile } from '@/lib/api';
import { MediaPicker, type MediaItem, isImageMedia, mediaLabel, formatBytes } from '@/components/MediaPicker';
import { useDialog } from '@/components/DialogProvider';

type Attachment = {
    id: string;
    courseId: string;
    mediaId: string;
    sortOrder: number;
    createdAt: string;
    media: MediaItem;
};

function kindForUpload(mime?: string | null): string {
    if (!mime) return 'document';
    if (mime.startsWith('image/')) return 'gallery';
    if (mime.startsWith('video/')) return 'video';
    return 'document';
}

function iconFor(m: MediaItem) {
    if (m.kind === 'link') return <LinkIcon className="size-4" />;
    if (isImageMedia(m)) return <FileImage className="size-4" />;
    if (m.kind === 'video' || (m.mimeType ?? '').startsWith('video/')) return <Film className="size-4" />;
    return <FileText className="size-4" />;
}

export function CourseMediaManager({ courseId }: { courseId: string }) {
    const [items, setItems] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const dialog = useDialog();

    async function load() {
        setLoading(true);
        try {
            const data = await api.get<Attachment[]>(`/courses/${courseId}/attachments`);
            setItems(Array.isArray(data) ? data : []);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [courseId]);

    async function attachIds(mediaIds: string[]) {
        if (!mediaIds.length) return;
        await api.post(`/courses/${courseId}/attachments`, { mediaIds });
        await load();
    }

    async function onPick(files: FileList | null) {
        if (!files || files.length === 0) return;
        setError(null);
        setUploading(true);
        try {
            const createdIds: string[] = [];
            for (const file of Array.from(files)) {
                const up = await uploadFile(file);
                const mime = up.mimeType ?? file.type ?? null;
                const m = await api.post<MediaItem>('/institution/media', {
                    kind: kindForUpload(mime),
                    url: up.url,
                    title: file.name,
                    filename: file.name,
                    mimeType: mime,
                    size: up.size ?? file.size ?? null,
                });
                createdIds.push(m.id);
            }
            await attachIds(createdIds);
        } catch (e: any) { setError(e.message); }
        finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    }

    async function detach(att: Attachment) {
        const ok = await dialog.confirm({
            title: 'Detach file',
            message: `Detach "${mediaLabel(att.media)}" from this course?\n(The file stays in the media library.)`,
            tone: 'warning',
            confirmLabel: 'Detach',
        });
        if (!ok) return;
        try {
            await api.delete(`/courses/${courseId}/attachments/${att.mediaId}`);
            setItems((xs) => xs.filter((x) => x.id !== att.id));
        } catch (e: any) { setError(e.message); }
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-60 transition"
                >
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploading ? 'Uploading…' : 'Upload new'}
                </button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
                <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 text-sm hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                >
                    <FolderOpen className="size-4" /> Pick from library
                </button>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-400">
                Files are stored in the institution media library and can be attached to multiple courses.
            </p>

            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg shimmer" />)}
                </div>
            ) : items.length === 0 ? (
                <p className="text-sm text-ink-500 py-6 text-center">No attachments yet.</p>
            ) : (
                <ul className="divide-y divide-ink-100 dark:divide-ink-800 rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
                    {items.map((att) => {
                        const m = att.media;
                        return (
                            <li key={att.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition">
                                <span className="size-8 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 grid place-items-center shrink-0">
                                    {iconFor(m)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <a href={m.url} target="_blank" rel="noreferrer" className="block text-sm font-medium truncate hover:underline">
                                        {mediaLabel(m)}
                                    </a>
                                    <div className="text-xs text-ink-500 truncate">
                                        {m.kind}
                                        {m.mimeType ? ` · ${m.mimeType}` : ''}
                                        {m.size ? ` · ${formatBytes(m.size)}` : ''}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => detach(att)}
                                    className="text-ink-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    aria-label="Detach"
                                    title="Detach (keeps in library)"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <MediaPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                multiple
                accept="*/*"
                defaultKind="document"
                title="Attach from library"
                onSelect={async (picked) => {
                    setError(null);
                    try { await attachIds(picked.map((m) => m.id)); }
                    catch (e: any) { setError(e.message); }
                }}
            />
        </div>
    );
}
