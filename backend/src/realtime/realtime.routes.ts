import type { FastifyInstance } from 'fastify';
import { register } from './hub.js';

/**
 * WebSocket endpoint: `GET /api/v1/ws?token=<JWT>`.
 *
 * Authenticates via the access token in the query string (browsers can't set
 * `Authorization` on WebSocket upgrades). Keeps the connection registered with
 * the realtime hub for the user; the hub fans out events from REST handlers.
 *
 * Wire format: server -> client JSON `{ type, ...payload }`. Client -> server
 * is currently ignored except for a `"ping"` text frame answered with `"pong"`.
 */
export async function realtimeRoutes(app: FastifyInstance) {
    app.get('/', { websocket: true }, (socket, req) => {
        const token = (req.query as { token?: string } | undefined)?.token;
        if (!token) {
            try { socket.close(4401, 'missing token'); } catch { /* ignore */ }
            return;
        }
        let userId: string;
        try {
            const decoded = app.jwt.verify<{ sub: string }>(token);
            userId = decoded.sub;
        } catch {
            try { socket.close(4401, 'invalid token'); } catch { /* ignore */ }
            return;
        }

        const unregister = register(userId, socket);
        try { socket.send(JSON.stringify({ type: 'hello' })); } catch { /* ignore */ }

        socket.on('message', (raw) => {
            const text = raw.toString();
            if (text === 'ping') {
                try { socket.send('pong'); } catch { /* ignore */ }
            }
        });
        socket.on('close', () => unregister());
        socket.on('error', () => unregister());
    });
}
