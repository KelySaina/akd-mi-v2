import { describe, it, expect, vi } from 'vitest';

// Mock external dependencies before importing the module
vi.mock('../../config/prisma.js', () => ({ prisma: {} }));
vi.mock('../../config/env.js', () => ({
    loadEnv: () => ({ JWT_REFRESH_TTL: '7d' }),
}));

// We can test the pure functions by importing after mocking
const { hashPassword, verifyPassword } = await import('./auth.service.js');

describe('hashPassword + verifyPassword', () => {
    it('hashes a password and verifies it correctly', async () => {
        const plain = 'MySecureP@ss123';
        const hash = await hashPassword(plain);

        expect(hash).not.toBe(plain);
        expect(hash.length).toBeGreaterThan(50);
        expect(await verifyPassword(hash, plain)).toBe(true);
    });

    it('rejects wrong password', async () => {
        const hash = await hashPassword('correctPassword');
        expect(await verifyPassword(hash, 'wrongPassword')).toBe(false);
    });

    it('returns false for invalid hash', async () => {
        expect(await verifyPassword('not-a-hash', 'password')).toBe(false);
    });
});
