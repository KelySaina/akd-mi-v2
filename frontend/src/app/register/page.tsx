// Server shell — fetches institution + the admin-chosen landingTemplate
// so the register UI brand mark and copy reflect the site theme.

import { RegisterForm } from './RegisterForm';

async function getInstitution(): Promise<{ name?: string; settings?: { landingTemplate?: string } | null } | null> {
    const base = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    if (!base) return null;
    try {
        const res = await fetch(`${base}/api/v1/institution`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function RegisterPage() {
    const inst = await getInstitution();
    const name = inst?.name ?? process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'AKD-MI';
    const template = inst?.settings?.landingTemplate ?? 'classic';
    return <RegisterForm name={name} template={template} />;
}
