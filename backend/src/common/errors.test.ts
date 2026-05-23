import { describe, it, expect, vi } from 'vitest';
import { ZodError, z } from 'zod';
import { handleError } from './errors.js';

function mockReply() {
    const reply: any = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
        log: { error: vi.fn() },
    };
    return reply;
}

describe('handleError', () => {
    it('handles ZodError with 400 status', () => {
        const reply = mockReply();
        const schema = z.object({ name: z.string() });
        let err: ZodError | undefined;
        try { schema.parse({}); } catch (e) { err = e as ZodError; }

        handleError(reply, err);

        expect(reply.code).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'ValidationError' }),
        );
    });

    it('handles Prisma P2002 unique constraint error with 409', () => {
        const reply = mockReply();
        handleError(reply, { code: 'P2002', meta: { target: ['email'] } });

        expect(reply.code).toHaveBeenCalledWith(409);
        expect(reply.send).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Conflict' }),
        );
    });

    it('handles Prisma P2025 not found error with 404', () => {
        const reply = mockReply();
        handleError(reply, { code: 'P2025' });

        expect(reply.code).toHaveBeenCalledWith(404);
        expect(reply.send).toHaveBeenCalledWith({ error: 'NotFound' });
    });

    it('handles unknown errors with 500', () => {
        const reply = mockReply();
        handleError(reply, new Error('something broke'));

        expect(reply.code).toHaveBeenCalledWith(500);
        expect(reply.send).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'InternalError' }),
        );
    });
});
