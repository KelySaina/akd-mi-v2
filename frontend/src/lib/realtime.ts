'use client';
/**
 * Realtime WebSocket client (singleton).
 *
 * Connects to `/api/v1/ws?token=<JWT>` and dispatches events to subscribers.
 * Used to replace setInterval polling — the messenger widget and full
 * messages view subscribe to "message.new", "conversation.read", etc. and
 * reload only when something actually happened.
 *
 * Auto-reconnects with exponential backoff. Reconnects on token change and
 * tears down when the token disappears (logout).
 */
import { useEffect, useRef } from 'react';
import { getToken } from './auth';

export type RealtimeEvent =
    | { type: 'hello' }
    | { type: 'message.new'; conversationId: string; messageId: string }
    | { type: 'message.updated'; conversationId: string; messageId: string }
    | { type: 'message.deleted'; conversationId: string; messageId: string }
    | { type: 'conversation.updated'; conversationId: string }
    | { type: 'conversation.read'; conversationId: string; userId: string }
    | { type: 'notification.new'; id: string };

type Listener = (e: RealtimeEvent) => void;

const ENV_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveWsUrl(token: string): string {
    let base = ENV_BASE;
    if (typeof window !== 'undefined') {
        try {
            const u = new URL(ENV_BASE);
            const pageHost = window.location.hostname;
            if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && pageHost && pageHost !== u.hostname) {
                u.hostname = pageHost;
                base = u.toString().replace(/\/$/, '');
            }
        } catch { /* ignore */ }
    }
    const wsBase = base.replace(/^http/, 'ws');
    return `${wsBase}/api/v1/ws/?token=${encodeURIComponent(token)}`;
}

class RealtimeClient {
    private ws: WebSocket | null = null;
    private listeners = new Set<Listener>();
    private currentToken: string | null = null;
    private retryDelay = 1000;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private refCount = 0;

    /** Increment ref count; first ref opens the socket. Returns disposer. */
    acquire(listener: Listener): () => void {
        this.listeners.add(listener);
        this.refCount += 1;
        if (this.refCount === 1) this.ensureConnected();
        else this.ensureConnected(); // also handle token change
        return () => {
            this.listeners.delete(listener);
            this.refCount -= 1;
            if (this.refCount <= 0) {
                this.refCount = 0;
                this.close();
            }
        };
    }

    private ensureConnected() {
        if (typeof window === 'undefined') return;
        const token = getToken();
        if (!token) { this.close(); return; }
        if (this.ws && this.currentToken === token &&
            (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        // Token changed or socket gone → reconnect.
        this.teardownSocket();
        this.currentToken = token;
        try {
            this.ws = new WebSocket(resolveWsUrl(token));
        } catch {
            this.scheduleReconnect();
            return;
        }
        this.ws.onopen = () => {
            this.retryDelay = 1000;
            this.pingTimer = setInterval(() => {
                try { this.ws?.send('ping'); } catch { /* ignore */ }
            }, 25_000);
        };
        this.ws.onmessage = (ev) => {
            const text = typeof ev.data === 'string' ? ev.data : '';
            if (!text || text === 'pong') return;
            let parsed: RealtimeEvent | null = null;
            try { parsed = JSON.parse(text) as RealtimeEvent; } catch { return; }
            if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) return;
            for (const l of this.listeners) {
                try { l(parsed); } catch { /* ignore listener errors */ }
            }
        };
        this.ws.onclose = () => {
            this.teardownSocket();
            if (this.refCount > 0 && getToken()) this.scheduleReconnect();
        };
        this.ws.onerror = () => { /* onclose handles retry */ };
    }

    private scheduleReconnect() {
        if (this.retryTimer) return;
        const delay = this.retryDelay;
        this.retryDelay = Math.min(this.retryDelay * 2, 30_000);
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.ensureConnected();
        }, delay);
    }

    private teardownSocket() {
        if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
        if (this.ws) {
            try { this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null; } catch { /* ignore */ }
            try { this.ws.close(); } catch { /* ignore */ }
            this.ws = null;
        }
    }

    private close() {
        if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
        this.teardownSocket();
        this.currentToken = null;
        this.retryDelay = 1000;
    }
}

const client = new RealtimeClient();

/**
 * Subscribe to realtime events for the current user. Returns nothing — the
 * `onEvent` callback fires on every event. The hook keeps the same callback
 * ref alive via useRef so consumers can pass an inline closure without
 * causing reconnects on every render.
 */
export function useRealtime(onEvent: (e: RealtimeEvent) => void): void {
    const cbRef = useRef(onEvent);
    cbRef.current = onEvent;
    useEffect(() => {
        const dispose = client.acquire((e) => cbRef.current(e));
        return dispose;
    }, []);
}
