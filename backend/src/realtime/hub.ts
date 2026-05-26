// In-process realtime hub: maps userId -> Set<WebSocket>.
// Single-instance API (one container per akd-mi instance) — no Redis fanout
// needed for now; if we scale horizontally later, subscribe a duplicate Redis
// client here and call `deliverLocal()` from the subscriber.

import type { WebSocket } from '@fastify/websocket';

export type RealtimeEvent =
    | { type: 'message.new'; conversationId: string; messageId: string }
    | { type: 'message.updated'; conversationId: string; messageId: string }
    | { type: 'message.deleted'; conversationId: string; messageId: string }
    | { type: 'conversation.updated'; conversationId: string }
    | { type: 'conversation.read'; conversationId: string; userId: string }
    | { type: 'notification.new'; id: string };

const sockets = new Map<string, Set<WebSocket>>();

export function register(userId: string, ws: WebSocket): () => void {
    let set = sockets.get(userId);
    if (!set) {
        set = new Set();
        sockets.set(userId, set);
    }
    set.add(ws);
    return () => {
        const s = sockets.get(userId);
        if (!s) return;
        s.delete(ws);
        if (s.size === 0) sockets.delete(userId);
    };
}

export function publishToUser(userId: string, event: RealtimeEvent): void {
    const set = sockets.get(userId);
    if (!set || set.size === 0) return;
    const payload = JSON.stringify(event);
    for (const ws of set) {
        try {
            if (ws.readyState === 1 /* OPEN */) ws.send(payload);
        } catch { /* ignore broken sockets */ }
    }
}

export function publishToUsers(userIds: Iterable<string>, event: RealtimeEvent): void {
    for (const id of userIds) publishToUser(id, event);
}
