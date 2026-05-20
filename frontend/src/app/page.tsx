import ClassicLanding from '@/components/landing/ClassicLanding';
import ModernLanding from '@/components/landing/ModernLanding';
import MinimalLanding from '@/components/landing/MinimalLanding';
import { CATEGORY_LABEL, type Institution, type LandingTemplateId } from '@/components/landing/types';

export const dynamic = 'force-dynamic';

async function getInstitution(): Promise<Institution | null> {
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

function pickTemplate(id?: string): LandingTemplateId {
    if (id === 'modern' || id === 'minimal' || id === 'classic') return id;
    return 'classic';
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ template?: string }> }) {
    const fallbackName = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'Institution';
    const inst = await getInstitution();
    const name = inst?.name ?? fallbackName;
    const category = inst?.category ? (CATEGORY_LABEL[inst.category] ?? inst.category) : 'Institution';
    const primaryAddress = inst?.addresses?.find((a) => a.isPrimary) ?? inst?.addresses?.[0] ?? null;
    const gallery = (inst?.media ?? []).filter((m) => m.kind === 'gallery').slice(0, 6);

    // `?template=` query string overrides the saved setting (used by /admin/site preview).
    const sp = searchParams ? await searchParams : undefined;
    const tplId = pickTemplate(sp?.template ?? inst?.settings?.landingTemplate);

    const props = { inst, name, category, primaryAddress, gallery };

    if (tplId === 'modern')  return <ModernLanding  {...props} />;
    if (tplId === 'minimal') return <MinimalLanding {...props} />;
    return <ClassicLanding {...props} />;
}
