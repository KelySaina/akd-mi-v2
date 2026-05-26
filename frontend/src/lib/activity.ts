// Shared types + helpers for the platform activity feed.

export type ActivityKind = 'student' | 'teacher' | 'course' | 'enrollment' | 'grade' | 'media' | 'status' | 'deletion' | 'settings';

export type ActivityItem = {
    id: string;
    kind: ActivityKind;
    title: string;
    subtitle: string;
    at: string; // ISO timestamp
    href?: string;
};

/** Format a timestamp as a compact relative string ("2m ago", "3h ago", "Yesterday", "Mar 12"). */
export function formatRelative(iso: string, now: Date = new Date()): string {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diffMs = now.getTime() - t;
    const sec = Math.round(diffMs / 1000);
    if (sec < 45) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.round(hr / 24);
    if (day === 1) return 'Yesterday';
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
