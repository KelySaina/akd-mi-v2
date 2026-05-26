'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { api, uploadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRealtime } from '@/lib/realtime';
import {
    Send, Paperclip, Search, Plus, Users as UsersIcon, X, Loader2,
    Check, CheckCheck, MessageSquare, File as FileIcon, Image as ImageIcon, Trash2, ArrowLeft,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────── */
/* Types                                                            */
/* ────────────────────────────────────────────────────────────── */

type Attachment = { key: string; url: string; name: string; mimeType: string; size: number };
type ConvoUser = { id: string; name: string; email: string; avatarUrl?: string | null; role?: string };
type Participant = { userId: string; role: string; joinedAt: string; user: ConvoUser };
type LastMessage = {
    id: string;
    body: string;
    attachments: Attachment[] | unknown;
    createdAt: string;
    sender: { id: string; name: string };
} | null;
export type Conversation = {
    id: string;
    kind: 'DIRECT' | 'GROUP';
    title: string | null;
    avatarUrl: string | null;
    lastMessageAt: string | null;
    createdAt: string;
    unread: number;
    lastMessage: LastMessage;
    participants: Participant[];
    otherUsers: ConvoUser[];
};
type Message = {
    id: string;
    body: string;
    attachments: Attachment[];
    createdAt: string;
    editedAt: string | null;
    sender: { id: string; name: string; avatarUrl?: string | null };
};

/* ────────────────────────────────────────────────────────────── */
/* Helpers                                                          */
/* ────────────────────────────────────────────────────────────── */

const CONVO_POLL_MS = 120_000; // safety-net only; realtime drives updates
const MSG_POLL_MS = 120_000;   // safety-net only; realtime drives updates

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '·';
}

export function conversationDisplay(c: Conversation, viewerId: string | undefined): { title: string; subtitle?: string; avatarUrl?: string | null } {
    if (c.kind === 'GROUP') {
        const names = c.participants.filter((p) => p.userId !== viewerId).map((p) => p.user.name).slice(0, 3);
        return {
            title: c.title || names.join(', ') || 'Group',
            subtitle: `${c.participants.length} members`,
            avatarUrl: c.avatarUrl,
        };
    }
    const other = c.otherUsers[0];
    return {
        title: other?.name ?? 'Direct',
        subtitle: other?.email,
        avatarUrl: other?.avatarUrl,
    };
}

export function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString();
}

function isImage(att: Attachment) { return att.mimeType?.startsWith('image/'); }
function humanSize(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function parseAttachments(raw: unknown): Attachment[] {
    if (Array.isArray(raw)) return raw as Attachment[];
    return [];
}

/* ────────────────────────────────────────────────────────────── */
/* Main view                                                        */
/* ────────────────────────────────────────────────────────────── */

export function MessagesView({ title = 'Messages' }: { title?: string }) {
    const { user } = useAuth();
    const [convos, setConvos] = useState<Conversation[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [showNew, setShowNew] = useState(false);

    const loadConvos = useCallback(async () => {
        try {
            const r = await api.get<{ items: Conversation[] }>('/messaging/conversations');
            setConvos(r.items ?? []);
        } catch { /* ignore */ }
        finally { setLoadingList(false); }
    }, []);

    useEffect(() => {
        loadConvos();
        const t = setInterval(loadConvos, CONVO_POLL_MS);
        return () => clearInterval(t);
    }, [loadConvos]);

    // Realtime: refresh the list whenever a relevant event arrives.
    useRealtime((e) => {
        if (e.type === 'message.new' || e.type === 'message.updated' ||
            e.type === 'message.deleted' || e.type === 'conversation.updated' ||
            e.type === 'conversation.read') {
            loadConvos();
        }
    });

    const filtered = useMemo(() => {
        if (!query.trim()) return convos;
        const q = query.trim().toLowerCase();
        return convos.filter((c) => {
            const d = conversationDisplay(c, user?.id);
            return d.title.toLowerCase().includes(q) || (d.subtitle ?? '').toLowerCase().includes(q);
        });
    }, [convos, query, user?.id]);

    const selected = convos.find((c) => c.id === selectedId) ?? null;

    function onCreated(c: Conversation) {
        setConvos((prev) => {
            const without = prev.filter((x) => x.id !== c.id);
            return [c, ...without];
        });
        setSelectedId(c.id);
        setShowNew(false);
    }

    function onConvoUpdated(c: Conversation) {
        setConvos((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    }

    function onUnreadCleared(id: string) {
        setConvos((prev) => prev.map((x) => (x.id === id ? { ...x, unread: 0 } : x)));
    }

    return (
        <>
            <Topbar title={title} />
            <main className="flex-1 min-h-0 flex">
                {/* List pane */}
                <aside
                    className={[
                        'w-full md:w-80 lg:w-96 shrink-0 border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex flex-col',
                        selectedId ? 'hidden md:flex' : 'flex',
                    ].join(' ')}
                >
                    <div className="p-3 border-b border-ink-200 dark:border-ink-800 flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-sm">
                            <Search className="size-4 text-ink-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search conversations"
                                className="bg-transparent outline-none flex-1 placeholder:text-ink-400 text-ink-700 dark:text-ink-200"
                            />
                        </div>
                        <button
                            onClick={() => setShowNew(true)}
                            className="size-9 grid place-items-center rounded-lg bg-grad-brand text-white shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95 transition"
                            title="New conversation"
                            aria-label="New conversation"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingList ? (
                            <div className="p-6 text-center text-sm text-ink-500"><Loader2 className="size-4 animate-spin inline" /> Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-10 text-center text-sm text-ink-500 dark:text-ink-400">
                                <MessageSquare className="size-8 mx-auto mb-2 opacity-40" />
                                {query ? 'No matches.' : 'No conversations yet. Start one with the + button.'}
                            </div>
                        ) : filtered.map((c) => {
                            const d = conversationDisplay(c, user?.id);
                            const active = c.id === selectedId;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    className={[
                                        'w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-ink-100 dark:border-ink-800/60 transition',
                                        active ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-ink-50 dark:hover:bg-ink-800/60',
                                    ].join(' ')}
                                >
                                    <Avatar name={d.title} url={d.avatarUrl} kind={c.kind} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium text-sm truncate flex-1">{d.title}</div>
                                            {c.lastMessageAt && (
                                                <div className="text-[10px] text-ink-400 shrink-0">{formatTime(c.lastMessageAt)}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="text-xs text-ink-500 dark:text-ink-400 truncate flex-1">
                                                {c.lastMessage
                                                    ? (c.lastMessage.body
                                                        || (parseAttachments(c.lastMessage.attachments).length ? '📎 Attachment' : '—'))
                                                    : <span className="italic">No messages yet</span>}
                                            </div>
                                            {c.unread > 0 && (
                                                <span className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-brand-500 text-white text-[10px] font-semibold grid place-items-center">
                                                    {c.unread > 99 ? '99+' : c.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Thread pane */}
                <section className={['flex-1 min-w-0 flex flex-col bg-ink-50 dark:bg-ink-950', selectedId ? 'flex' : 'hidden md:flex'].join(' ')}>
                    {selected ? (
                        <ConversationThread
                            key={selected.id}
                            convo={selected}
                            viewerId={user?.id}
                            onBack={() => setSelectedId(null)}
                            onConvoUpdated={onConvoUpdated}
                            onUnreadCleared={() => onUnreadCleared(selected.id)}
                        />
                    ) : (
                        <div className="flex-1 grid place-items-center text-ink-400">
                            <div className="text-center">
                                <MessageSquare className="size-10 mx-auto mb-3 opacity-30" />
                                <div className="text-sm">Select a conversation</div>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {showNew && (
                <NewConversationModal
                    onClose={() => setShowNew(false)}
                    onCreated={onCreated}
                />
            )}
        </>
    );
}

/* ────────────────────────────────────────────────────────────── */
/* Thread                                                           */
/* ────────────────────────────────────────────────────────────── */

export function ConversationThread({
    convo, viewerId, onBack, onConvoUpdated, onUnreadCleared, hideHeaderBack,
}: {
    convo: Conversation;
    viewerId: string | undefined;
    onBack: () => void;
    onConvoUpdated: (c: Conversation) => void;
    onUnreadCleared: () => void;
    /** When true, always show the back button (used inside the floating widget). */
    hideHeaderBack?: boolean;
}) {
    const d = conversationDisplay(convo, viewerId);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const lastIdRef = useRef<string | null>(null);

    const loadFirst = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get<{ items: Message[]; nextCursor: string | null }>(`/messaging/conversations/${convo.id}/messages?limit=50`);
            const items = (r.items ?? []).map((m) => ({ ...m, attachments: parseAttachments(m.attachments) }));
            setMessages(items);
            setNextCursor(r.nextCursor);
            lastIdRef.current = items[items.length - 1]?.id ?? null;
            // Scroll to bottom on first load
            queueMicrotask(() => {
                const el = listRef.current;
                if (el) el.scrollTop = el.scrollHeight;
            });
            // Mark as read
            try { await api.post(`/messaging/conversations/${convo.id}/read`); onUnreadCleared(); } catch { /* ignore */ }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [convo.id, onUnreadCleared]);

    const pollNew = useCallback(async () => {
        try {
            const r = await api.get<{ items: Message[]; nextCursor: string | null }>(`/messaging/conversations/${convo.id}/messages?limit=30`);
            const items = (r.items ?? []).map((m) => ({ ...m, attachments: parseAttachments(m.attachments) }));
            setMessages((prev) => {
                const existing = new Map(prev.map((m) => [m.id, m]));
                const merged = [...prev];
                let added = false;
                for (const m of items) {
                    if (!existing.has(m.id)) { merged.push(m); added = true; }
                }
                merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                if (added) {
                    const lastIncoming = items[items.length - 1];
                    if (lastIncoming && lastIncoming.sender.id !== viewerId) {
                        api.post(`/messaging/conversations/${convo.id}/read`).then(onUnreadCleared).catch(() => { /* ignore */ });
                    }
                    queueMicrotask(() => {
                        const el = listRef.current;
                        if (!el) return;
                        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
                        if (nearBottom) el.scrollTop = el.scrollHeight;
                    });
                }
                return merged;
            });
        } catch { /* ignore */ }
    }, [convo.id, viewerId, onUnreadCleared]);

    useEffect(() => { loadFirst(); }, [loadFirst]);
    useEffect(() => {
        const t = setInterval(pollNew, MSG_POLL_MS);
        return () => clearInterval(t);
    }, [pollNew]);

    // Realtime: refresh thread on events scoped to this conversation.
    useRealtime((e) => {
        if ('conversationId' in e && e.conversationId !== convo.id) return;
        if (e.type === 'message.new' || e.type === 'message.updated' || e.type === 'message.deleted') {
            pollNew();
        }
    });

    async function loadOlder() {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const el = listRef.current;
        const prevHeight = el?.scrollHeight ?? 0;
        try {
            const r = await api.get<{ items: Message[]; nextCursor: string | null }>(`/messaging/conversations/${convo.id}/messages?limit=50&cursor=${encodeURIComponent(nextCursor)}`);
            const items = (r.items ?? []).map((m) => ({ ...m, attachments: parseAttachments(m.attachments) }));
            setMessages((prev) => [...items, ...prev]);
            setNextCursor(r.nextCursor);
            queueMicrotask(() => {
                const el2 = listRef.current;
                if (el2) el2.scrollTop = el2.scrollHeight - prevHeight;
            });
        } catch { /* ignore */ }
        finally { setLoadingMore(false); }
    }

    async function onPickFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const f of Array.from(files).slice(0, 10 - attachments.length)) {
                const res = await uploadFile(f);
                setAttachments((prev) => [...prev, { key: res.key, url: res.url, name: f.name, mimeType: res.mimeType, size: res.size }]);
            }
        } catch (e: any) { console.warn(e?.message); }
        finally { setUploading(false); }
    }

    async function send() {
        if (sending) return;
        const trimmed = draft.trim();
        if (!trimmed && attachments.length === 0) return;
        setSending(true);
        try {
            const m = await api.post<Message>(`/messaging/conversations/${convo.id}/messages`, {
                body: trimmed,
                attachments,
            });
            const msg = { ...m, attachments: parseAttachments(m.attachments) };
            setMessages((prev) => [...prev, msg]);
            setDraft('');
            setAttachments([]);
            queueMicrotask(() => {
                const el = listRef.current;
                if (el) el.scrollTop = el.scrollHeight;
            });
        } catch (e: any) { console.warn(e?.message); }
        finally { setSending(false); }
    }

    async function deleteMessage(id: string) {
        if (!confirm('Delete this message?')) return;
        try {
            await api.delete(`/messaging/messages/${id}`);
            setMessages((prev) => prev.filter((m) => m.id !== id));
        } catch (e: any) { console.warn(e?.message); }
    }

    return (
        <>
            <header className="px-4 py-3 border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex items-center gap-3">
                <button onClick={onBack} className={[hideHeaderBack ? 'flex' : 'md:hidden', 'p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800'].join(' ')} aria-label="Back">
                    <ArrowLeft className="size-4" />
                </button>
                <Avatar name={d.title} url={d.avatarUrl} kind={convo.kind} />
                <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{d.title}</div>
                    <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{d.subtitle}</div>
                </div>
                <button onClick={() => setShowInfo((s) => !s)} className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500" title="Info" aria-label="Info">
                    <UsersIcon className="size-4" />
                </button>
            </header>

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
                {nextCursor && (
                    <div className="text-center">
                        <button onClick={loadOlder} disabled={loadingMore} className="text-xs text-brand-600 hover:underline">
                            {loadingMore ? 'Loading…' : 'Load older messages'}
                        </button>
                    </div>
                )}
                {loading && messages.length === 0 ? (
                    <div className="text-center text-sm text-ink-500"><Loader2 className="size-4 animate-spin inline" /> Loading…</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-ink-400 mt-12">No messages yet — say hi.</div>
                ) : (
                    messages.map((m, i) => {
                        const mine = m.sender.id === viewerId;
                        const prev = messages[i - 1];
                        const sameSenderAsPrev = prev && prev.sender.id === m.sender.id
                            && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
                        return (
                            <MessageBubble
                                key={m.id}
                                msg={m}
                                mine={mine}
                                showAvatar={!sameSenderAsPrev}
                                isGroup={convo.kind === 'GROUP'}
                                onDelete={() => deleteMessage(m.id)}
                            />
                        );
                    })
                )}
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {attachments.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs">
                                {isImage(a) ? <ImageIcon className="size-3.5 text-brand-500" /> : <FileIcon className="size-3.5 text-ink-500" />}
                                <span className="max-w-[10rem] truncate">{a.name}</span>
                                <span className="text-ink-400">{humanSize(a.size)}</span>
                                <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-ink-400 hover:text-rose-500">
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <label className="size-9 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800 cursor-pointer shrink-0">
                        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                        <input type="file" multiple className="hidden" onChange={(e) => { onPickFiles(e.target.files); e.target.value = ''; }} />
                    </label>
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                        }}
                        rows={1}
                        placeholder="Write a message…"
                        className="flex-1 resize-none max-h-32 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                    <button
                        onClick={send}
                        disabled={sending || (!draft.trim() && attachments.length === 0)}
                        className="size-9 grid place-items-center rounded-lg bg-grad-brand text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95 transition shrink-0"
                        title="Send"
                        aria-label="Send"
                    >
                        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </button>
                </div>
            </div>

            {showInfo && (
                <ConvoInfoDrawer
                    convo={convo}
                    viewerId={viewerId}
                    onClose={() => setShowInfo(false)}
                    onConvoUpdated={onConvoUpdated}
                />
            )}
        </>
    );
}

/* ────────────────────────────────────────────────────────────── */
/* Message bubble                                                   */
/* ────────────────────────────────────────────────────────────── */

function MessageBubble({
    msg, mine, showAvatar, isGroup, onDelete,
}: { msg: Message; mine: boolean; showAvatar: boolean; isGroup: boolean; onDelete: () => void }) {
    return (
        <div className={['flex gap-2', mine ? 'justify-end' : 'justify-start'].join(' ')}>
            {!mine && (
                <div className="w-8 shrink-0">
                    {showAvatar && <Avatar name={msg.sender.name} url={msg.sender.avatarUrl} small />}
                </div>
            )}
            <div className={['max-w-[78%] group', mine ? 'items-end' : 'items-start', 'flex flex-col'].join(' ')}>
                {!mine && isGroup && showAvatar && (
                    <div className="text-[11px] text-ink-500 mb-0.5 px-1">{msg.sender.name}</div>
                )}
                <div className={[
                    'px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm',
                    mine
                        ? 'bg-grad-brand text-white rounded-br-md'
                        : 'bg-white dark:bg-ink-900 text-ink-800 dark:text-ink-100 border border-ink-200 dark:border-ink-800 rounded-bl-md',
                ].join(' ')}>
                    {msg.body && <div>{msg.body}</div>}
                    {msg.attachments.length > 0 && (
                        <div className={['mt-2 grid gap-1.5', msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'].join(' ')}>
                            {msg.attachments.map((a, i) => isImage(a) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                                    <img src={a.url} alt={a.name} className="rounded-md max-h-56 object-cover w-full" />
                                </a>
                            ) : (
                                <a
                                    key={i}
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={[
                                        'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs',
                                        mine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-ink-50 dark:bg-ink-800 hover:bg-ink-100 dark:hover:bg-ink-700',
                                    ].join(' ')}
                                >
                                    <FileIcon className="size-3.5 shrink-0" />
                                    <span className="truncate flex-1">{a.name}</span>
                                    <span className="opacity-70">{humanSize(a.size)}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                <div className={['mt-0.5 flex items-center gap-1.5 px-1 text-[10px]', mine ? 'text-ink-400 flex-row-reverse' : 'text-ink-400'].join(' ')}>
                    <span>{formatTime(msg.createdAt)}{msg.editedAt && ' · edited'}</span>
                    {mine && (
                        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition" title="Delete">
                            <Trash2 className="size-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────── */
/* New conversation modal                                           */
/* ────────────────────────────────────────────────────────────── */

function NewConversationModal({
    onClose, onCreated,
}: { onClose: () => void; onCreated: (c: Conversation) => void }) {
    const [kind, setKind] = useState<'DIRECT' | 'GROUP'>('DIRECT');
    const [query, setQuery] = useState('');
    const [contacts, setContacts] = useState<ConvoUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Record<string, ConvoUser>>({});
    const [title, setTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const r = await api.get<{ items: ConvoUser[] }>(`/messaging/contacts${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
                if (!cancelled) setContacts(r.items ?? []);
            } catch { /* ignore */ }
            finally { if (!cancelled) setLoading(false); }
        }, 200);
        return () => { cancelled = true; clearTimeout(t); };
    }, [query]);

    function toggle(u: ConvoUser) {
        if (kind === 'DIRECT') {
            setSelected({ [u.id]: u });
            return;
        }
        setSelected((prev) => {
            const next = { ...prev };
            if (next[u.id]) delete next[u.id]; else next[u.id] = u;
            return next;
        });
    }

    async function create() {
        const ids = Object.keys(selected);
        if (ids.length === 0) return;
        if (kind === 'DIRECT' && ids.length !== 1) return;
        setCreating(true);
        setError(null);
        try {
            const c = await api.post<Conversation>('/messaging/conversations', {
                kind,
                participantIds: ids,
                title: kind === 'GROUP' && title.trim() ? title.trim() : undefined,
            });
            onCreated(c);
        } catch (e: any) { setError(e?.message ?? 'Failed to create'); }
        finally { setCreating(false); }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="px-5 py-4 border-b border-ink-200 dark:border-ink-800 flex items-center gap-3">
                    <div className="font-semibold flex-1">New conversation</div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"><X className="size-4" /></button>
                </div>
                <div className="px-5 py-3 border-b border-ink-200 dark:border-ink-800 flex gap-2">
                    <button
                        onClick={() => { setKind('DIRECT'); setSelected({}); }}
                        className={['px-3 py-1.5 rounded-lg text-sm', kind === 'DIRECT' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 font-medium' : 'text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800'].join(' ')}
                    >Direct</button>
                    <button
                        onClick={() => setKind('GROUP')}
                        className={['px-3 py-1.5 rounded-lg text-sm', kind === 'GROUP' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 font-medium' : 'text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800'].join(' ')}
                    >Group</button>
                </div>
                {kind === 'GROUP' && (
                    <div className="px-5 pt-3">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Group name (optional)"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 outline-none"
                        />
                    </div>
                )}
                <div className="px-5 pt-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm">
                        <Search className="size-4 text-ink-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search people…"
                            className="bg-transparent outline-none flex-1"
                        />
                    </div>
                </div>
                {Object.keys(selected).length > 0 && (
                    <div className="px-5 pt-2 flex flex-wrap gap-1.5">
                        {Object.values(selected).map((u) => (
                            <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                                {u.name}
                                <button onClick={() => toggle(u)} className="hover:text-rose-500"><X className="size-3" /></button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto mt-2">
                    {loading && contacts.length === 0 ? (
                        <div className="p-6 text-center text-sm text-ink-500"><Loader2 className="size-4 animate-spin inline" /></div>
                    ) : contacts.length === 0 ? (
                        <div className="p-6 text-center text-sm text-ink-500">No people found.</div>
                    ) : contacts.map((u) => {
                        const sel = !!selected[u.id];
                        return (
                            <button
                                key={u.id}
                                onClick={() => toggle(u)}
                                className={['w-full text-left px-5 py-2 flex items-center gap-3 hover:bg-ink-50 dark:hover:bg-ink-800', sel ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''].join(' ')}
                            >
                                <Avatar name={u.name} url={u.avatarUrl} small />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{u.name}</div>
                                    <div className="text-xs text-ink-500 truncate">{u.email}{u.role ? ` · ${u.role.toLowerCase()}` : ''}</div>
                                </div>
                                {sel && <Check className="size-4 text-brand-600" />}
                            </button>
                        );
                    })}
                </div>
                {error && <div className="px-5 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-200">{error}</div>}
                <div className="px-5 py-3 border-t border-ink-200 dark:border-ink-800 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-800">Cancel</button>
                    <button
                        onClick={create}
                        disabled={creating || Object.keys(selected).length === 0 || (kind === 'DIRECT' && Object.keys(selected).length !== 1)}
                        className="px-4 py-1.5 rounded-lg text-sm bg-grad-brand text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >{creating ? 'Creating…' : 'Start conversation'}</button>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────── */
/* Conversation info drawer                                         */
/* ────────────────────────────────────────────────────────────── */

function ConvoInfoDrawer({
    convo, viewerId, onClose, onConvoUpdated,
}: { convo: Conversation; viewerId: string | undefined; onClose: () => void; onConvoUpdated: (c: Conversation) => void }) {
    const [title, setTitle] = useState(convo.title ?? '');
    const [saving, setSaving] = useState(false);

    async function rename() {
        if (convo.kind !== 'GROUP') return;
        setSaving(true);
        try {
            const c = await api.patch<Conversation>(`/messaging/conversations/${convo.id}`, { title: title.trim() || null });
            onConvoUpdated(c);
        } catch { /* ignore */ }
        finally { setSaving(false); }
    }

    async function leave() {
        if (!confirm('Leave this conversation?')) return;
        try {
            await api.post(`/messaging/conversations/${convo.id}/leave`);
            window.location.reload();
        } catch { /* ignore */ }
    }

    return (
        <div className="fixed inset-0 z-40 bg-black/40 grid place-items-end" onClick={onClose}>
            <aside onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm h-full bg-white dark:bg-ink-900 border-l border-ink-200 dark:border-ink-800 shadow-2xl flex flex-col">
                <div className="px-5 py-4 border-b border-ink-200 dark:border-ink-800 flex items-center gap-3">
                    <div className="font-semibold flex-1">Conversation info</div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"><X className="size-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {convo.kind === 'GROUP' && (
                        <div>
                            <label className="text-xs text-ink-500 uppercase tracking-wider mb-1 block">Group name</label>
                            <div className="flex gap-2">
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 outline-none"
                                />
                                <button onClick={rename} disabled={saving} className="px-3 py-1.5 text-sm rounded-lg bg-grad-brand text-white disabled:opacity-40">Save</button>
                            </div>
                        </div>
                    )}
                    <div>
                        <div className="text-xs text-ink-500 uppercase tracking-wider mb-2">Members ({convo.participants.length})</div>
                        <div className="space-y-1">
                            {convo.participants.map((p) => (
                                <div key={p.userId} className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
                                    <Avatar name={p.user.name} url={p.user.avatarUrl} small />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate">{p.user.name}{p.userId === viewerId && ' (you)'}</div>
                                        <div className="text-xs text-ink-500 truncate">{p.user.email}</div>
                                    </div>
                                    {p.role !== 'member' && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 uppercase">{p.role}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-ink-200 dark:border-ink-800">
                    <button onClick={leave} className="w-full px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
                        Leave conversation
                    </button>
                </div>
            </aside>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────── */
/* Avatar                                                           */
/* ────────────────────────────────────────────────────────────── */

export function Avatar({ name, url, kind, small }: { name: string; url?: string | null; kind?: 'DIRECT' | 'GROUP'; small?: boolean }) {
    const cls = small ? 'size-8 text-[11px]' : 'size-10 text-xs';
    if (url) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={url} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
    }
    return (
        <div className={`${cls} rounded-full bg-grad-brand text-white grid place-items-center font-semibold shrink-0`}>
            {kind === 'GROUP' ? <UsersIcon className="size-4" /> : initials(name)}
        </div>
    );
}
