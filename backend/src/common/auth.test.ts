import { describe, it, expect } from 'vitest';
import { effectiveRoles, hasRole, type AuthUser } from './auth.js';

describe('effectiveRoles', () => {
    it('returns primary role when no extra roles', () => {
        expect(effectiveRoles('STUDENT', null)).toEqual(['STUDENT']);
        expect(effectiveRoles('STUDENT', undefined)).toEqual(['STUDENT']);
        expect(effectiveRoles('STUDENT', [])).toEqual(['STUDENT']);
    });

    it('merges primary and extra roles without duplicates', () => {
        const result = effectiveRoles('STUDENT', ['TEACHER', 'STUDENT']);
        expect(result).toContain('STUDENT');
        expect(result).toContain('TEACHER');
        expect(result).toHaveLength(2);
    });

    it('adds extra roles to primary role', () => {
        const result = effectiveRoles('TEACHER', ['INSTANCE_ADMIN']);
        expect(result).toContain('TEACHER');
        expect(result).toContain('INSTANCE_ADMIN');
        expect(result).toHaveLength(2);
    });
});

describe('hasRole', () => {
    const student: AuthUser = { sub: '1', role: 'STUDENT', roles: ['STUDENT'], email: 'a@b.com' };
    const multi: AuthUser = { sub: '2', role: 'STUDENT', roles: ['STUDENT', 'TEACHER'], email: 'b@b.com' };

    it('returns false for undefined user', () => {
        expect(hasRole(undefined, 'STUDENT')).toBe(false);
    });

    it('returns true when user has the required role', () => {
        expect(hasRole(student, 'STUDENT')).toBe(true);
    });

    it('returns false when user does not have the required role', () => {
        expect(hasRole(student, 'TEACHER')).toBe(false);
    });

    it('returns true when user has any of the required roles', () => {
        expect(hasRole(multi, 'TEACHER')).toBe(true);
        expect(hasRole(multi, 'INSTANCE_ADMIN', 'TEACHER')).toBe(true);
    });

    it('falls back to primary role when roles array is empty', () => {
        const user: AuthUser = { sub: '3', role: 'TEACHER', roles: [], email: 'c@b.com' };
        expect(hasRole(user, 'TEACHER')).toBe(true);
    });
});
