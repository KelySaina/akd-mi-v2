import ClassicLanding from '@/components/landing/ClassicLanding';
import ModernLanding from '@/components/landing/ModernLanding';
import MinimalLanding from '@/components/landing/MinimalLanding';
import EditorialLanding from '@/components/landing/EditorialLanding';
import VibrantLanding from '@/components/landing/VibrantLanding';
import CorporateLanding from '@/components/landing/CorporateLanding';
import {
    CATEGORY_LABEL, type Institution, type LandingTemplateId,
    resolveTheme, themeStyle, LANDING_THEME_PRESETS, isHex,
} from '@/components/landing/types';

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

const TEMPLATE_IDS: LandingTemplateId[] = ['classic', 'modern', 'minimal', 'editorial', 'vibrant', 'corporate'];

function pickTemplate(id?: string): LandingTemplateId {
    return (TEMPLATE_IDS as string[]).includes(id ?? '') ? (id as LandingTemplateId) : 'classic';
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ template?: string; theme?: string; primary?: string; accent?: string }> }) {
    const fallbackName = process.env.NEXT_PUBLIC_INSTANCE_NAME ?? 'Institution';
    const inst = await getInstitution();
    const name = inst?.name ?? fallbackName;
    const category = inst?.category ? (CATEGORY_LABEL[inst.category] ?? inst.category) : 'Institution';
    const primaryAddress = inst?.addresses?.find((a) => a.isPrimary) ?? inst?.addresses?.[0] ?? null;
    const gallery = (inst?.media ?? []).filter((m) => m.kind === 'gallery').slice(0, 6);

    // `?template=` and `?theme=` (or `?primary=&accent=`) query strings override
    // the saved settings — used by /admin/site for live preview.
    const sp = searchParams ? await searchParams : undefined;
    const tplId = pickTemplate(sp?.template ?? inst?.settings?.landingTemplate);

    // Theme resolution: per-request override wins over saved setting.
    let primary: string, accent: string;
    if (sp?.primary && sp?.accent && isHex(sp.primary) && isHex(sp.accent)) {
        primary = sp.primary; accent = sp.accent;
    } else if (sp?.theme) {
        const p = LANDING_THEME_PRESETS.find((x) => x.id === sp.theme);
        const r = p ? { primary: p.primary, accent: p.accent } : resolveTheme(inst?.settings?.landingTheme);
        primary = r.primary; accent = r.accent;
    } else {
        const r = resolveTheme(inst?.settings?.landingTheme);
        primary = r.primary; accent = r.accent;
    }

    const props = { inst, name, category, primaryAddress, gallery };
    const wrap = (child: React.ReactNode) => <div style={themeStyle(primary, accent)}>{child}</div>;

    if (tplId === 'modern')    return wrap(<ModernLanding    {...props} />);
    if (tplId === 'minimal')   return wrap(<MinimalLanding   {...props} />);
    if (tplId === 'editorial') return wrap(<EditorialLanding {...props} />);
    if (tplId === 'vibrant')   return wrap(<VibrantLanding   {...props} />);
    if (tplId === 'corporate') return wrap(<CorporateLanding {...props} />);
    return wrap(<ClassicLanding {...props} />);
}
