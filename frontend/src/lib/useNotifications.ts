'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api';

export type NotificationItem = {
    kind: 'enrollment_request' | 'password_reset_request' | 'student_application' | 'enrollment_status' | 'password_reset_status';
    id: string;
    title: string;
    subtitle?: string;
    createdAt: string;
    href?: string;
};

export type NotificationSummary = {
    total: number;
    pendingEnrollments: number;
    pendingPasswordResets: number;
    pendingStudentApplications: number;
    items: NotificationItem[];
};

const EMPTY: NotificationSummary = { total: 0, pendingEnrollments: 0, pendingPasswordResets: 0, pendingStudentApplications: 0, items: [] };

export function useNotifications(intervalMs = 30000) {
    const [data, setData] = useState<NotificationSummary>(EMPTY);
    const [loading, setLoading] = useState(false);
    const aliveRef = useRef(true);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get<NotificationSummary>('/notifications/summary');
            if (aliveRef.current) setData(res ?? EMPTY);
        } catch { /* ignore — may be unauthenticated */ }
        finally { if (aliveRef.current) setLoading(false); }
    }, []);

    useEffect(() => {
        aliveRef.current = true;
        refresh();
        const t = setInterval(refresh, intervalMs);
        return () => { aliveRef.current = false; clearInterval(t); };
    }, [refresh, intervalMs]);

    return { ...data, loading, refresh };
}
