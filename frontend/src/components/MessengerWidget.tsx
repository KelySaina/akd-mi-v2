'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, X, Search, ChevronLeft, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEnabledModules } from '@/lib/modules';
import {
    ConversationThread,
    Avatar,
    conversationDisplay,
    formatTime,
    parseAttachments,
    type Conversation,
} from './MessagesView';

const POLL_MS = 15_000;

function messagesPathFor(role: string | undefined): string {
    switch (role) {
        case 'STUDENT': return '/student/messages';
        case 'TEACHER': return '/teacher/messages';
        default: return '/admin/messages';
    }
}

export function MessengerWidget() {
    const { user, loaded } = useAuth();
    const { isEnabled, ready: modulesReady } = useEnabledModules();
    const pathname = usePathname() || '';

    const [open, setOpen] = useState(false);
    const [convos, setConvos] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        try {
            const r = await api.get<{ items: Conversation[] }>('/messaging/conversations');
            setConvos(r.items ?? []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    // Poll regardless of open state so the unread badge stays accurate.
    useEffect(() => {
        if (!loaded || !user) return;
        if (modulesReady && !isEnabled('messaging')) return;
        load();
        const t = setInterval(load, POLL_MS);
        return () => clearInterval(t);
    }, [loaded, user, modulesReady, isEnabled, load]);

    const totalUnread = useMemo(
        () => convos.reduce((sum, c) => sum + (c.unread || 0), 0),
        [convos],
    );

    const filtered = useMemo(() => {
        if (!query.trim()) return convos;
        const q = query.trim().toLowerCase();
        return convos.filter((c) => {
            const d = conversationDisplay(c, user?.id);
            return d.title.toLowerCase().includes(q) || (d.subtitle ?? '').toLowerCase().includes(q);
        });
    }, [convos, query, user?.id]);

    const selected = convos.find((c) => c.id === selectedId) ?? null;
    const messagesHref = messagesPathFor(user?.role);

    // Hide on auth pages and on the full Messages page itself (redundant there).
    const hiddenOn = ['/login', '/register', '/forgot-password'];
    if (!loaded || !user) return null;
    if (modulesReady && !isEnabled('messaging')) return null;
    if (hiddenOn.some((p) => pathname.startsWith(p))) return null;
    if (pathname.endsWith('/messages') || pathname.includes('/messages/')) return null;

    function onConvoUpdated(c: Conversation) {
        setConvos((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    }

    function clearUnread(id: string) {
        setConvos((prev) => prev.map((x) => (x.id === id ? { ...x, unread: 0 } : x)));
    }

    return (
        <>
            {/* Floating button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-grad-brand text-white shadow-xl shadow-brand-500/40 hover:shadow-brand-500/60 active:scale-95 transition grid place-items-center"
                    aria-label="Open messages"
                >
                    <MessageSquare className="size-6" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold grid place-items-center ring-2 ring-white dark:ring-ink-900">
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                    )}
                </button>
            )}

            {/* Panel */}
            {open && (
                <div className="fixed bottom-5 right-5 z-40 w-[min(22rem,calc(100vw-2.5rem))] h-[min(34rem,calc(100vh-2.5rem))] rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xl shadow-black/20 flex flex-col overflow-hidden">
                    {selected ? (
                        <ConversationThread
                            key={selected.id}
                            convo={selected}
                            viewerId={user.id}
                            hideHeaderBack
                            onBack={() => setSelectedId(null)}
                            onConvoUpdated={onConvoUpdated}
                            onUnreadCleared={() => clearUnread(selected.id)}
                        />
                    ) : (
                        <>
                            <header className="px-4 py-3 border-b border-ink-200 dark:border-ink-800 flex items-center gap-2">
                                <MessageSquare className="size-4 text-brand-500" />
                                <div className="font-semibold flex-1">Messages</div>
                                <Link
                                    href={messagesHref}
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"
                                    title="Open full view"
                                    aria-label="Open full view"
                                >
                                    <ExternalLink className="size-4" />
                                </Link>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"
                                    aria-label="Close"
                                >
                                    <X className="size-4" />
                                </button>
                            </header>
                            <div className="px-3 py-2 border-b border-ink-200 dark:border-ink-800">
                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-sm">
                                    <Search className="size-4 text-ink-400" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search"
                                        className="bg-transparent outline-none flex-1 placeholder:text-ink-400"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                {loading && convos.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-ink-500">Loading…</div>
                                ) : filtered.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-ink-500 dark:text-ink-400">
                                        <MessageSquare className="size-7 mx-auto mb-2 opacity-30" />
                                        {query ? 'No matches.' : 'No conversations yet.'}
                                        {!query && (
                                            <div className="mt-3">
                                                <Link
                                                    href={messagesHref}
                                                    onClick={() => setOpen(false)}
                                                    className="text-brand-600 hover:underline text-xs"
                                                >Start a conversation →</Link>
                                            </div>
                                        )}
                                    </div>
                                ) : filtered.map((c) => {
                                    const d = conversationDisplay(c, user.id);
                                    const preview = c.lastMessage
                                        ? (c.lastMessage.body
                                            || (parseAttachments(c.lastMessage.attachments).length ? '📎 Attachment' : '—'))
                                        : 'No messages yet';
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedId(c.id)}
                                            className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-ink-50 dark:hover:bg-ink-800 border-b border-ink-100 dark:border-ink-800/60"
                                        >
                                            <Avatar name={d.title} url={d.avatarUrl} kind={c.kind} small />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className={['text-sm truncate flex-1', c.unread > 0 ? 'font-semibold' : 'font-medium'].join(' ')}>{d.title}</div>
                                                    {c.lastMessageAt && (
                                                        <div className="text-[10px] text-ink-400 shrink-0">{formatTime(c.lastMessageAt)}</div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className={['text-xs truncate flex-1', c.unread > 0 ? 'text-ink-700 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400'].join(' ')}>
                                                        {preview}
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
                        </>
                    )}
                </div>
            )}
        </>
    );
}
