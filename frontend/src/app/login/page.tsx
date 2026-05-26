// Server shell — fetches the live institution settings (with the chosen
// landing template) + public stats and passes them down to the client form.
// The login UI therefore visually matches whichever theme the admin picked
// under /admin/site (music, agri, tech, …) and shows real counts.

import { LoginForm, type LoginStats } from './LoginForm';

const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function getInstitution(): Promise<{ name?: string; settings?: { landingTemplate?: string } | null } | null> {
    if (!API_BASE) return null;
    try {
        const res = await fetch(`${API_BASE}/api/v1/institution`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getStats(): Promise<LoginStats | null> {
    if (!API_BASE) return null;
    try {
        const res = await fetch(`${API_BASE}/api/v1/institution/stats`, { cache: 'no-store' });
        if (!res.ok) return null;
        const j = await res.json();
        return {
            students:  Number(j.students  ?? 0),
            teachers:  Number(j.teachers  ?? 0),
            courses:   Number(j.courses   ?? 0),
            documents: Number(j.documents ?? 0),
        };
    } catch {
        return null;
    }
}

export default async function LoginPage() {
    const [inst, stats] = await Promise.all([getInstitution(), getStats()]);
    const name = inst?.name ?? process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';
    const template = inst?.settings?.landingTemplate ?? 'classic';
    return <LoginForm name={name} template={template} stats={stats} />;
}

