import { describe, it, expect } from 'vitest';
import { PaginationQuery, skipTake } from './pagination.js';

describe('PaginationQuery schema', () => {
    it('applies defaults when no input given', () => {
        const result = PaginationQuery.parse({});
        expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('coerces string numbers', () => {
        const result = PaginationQuery.parse({ page: '3', limit: '50' });
        expect(result.page).toBe(3);
        expect(result.limit).toBe(50);
    });

    it('rejects page < 1', () => {
        expect(() => PaginationQuery.parse({ page: 0 })).toThrow();
        expect(() => PaginationQuery.parse({ page: -1 })).toThrow();
    });

    it('rejects limit > 100', () => {
        expect(() => PaginationQuery.parse({ limit: 101 })).toThrow();
    });

    it('accepts optional search query', () => {
        const result = PaginationQuery.parse({ q: '  hello  ' });
        expect(result.q).toBe('hello');
    });
});

describe('skipTake', () => {
    it('calculates correct skip and take for page 1', () => {
        expect(skipTake({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
    });

    it('calculates correct skip and take for page 3', () => {
        expect(skipTake({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
    });

    it('calculates correct skip and take for page 5 with limit 25', () => {
        expect(skipTake({ page: 5, limit: 25 })).toEqual({ skip: 100, take: 25 });
    });
});
