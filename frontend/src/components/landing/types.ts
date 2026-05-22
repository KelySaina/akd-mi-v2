import type { CSSProperties } from 'react';

export type Address = {
    id: string; label?: string | null; line1: string; line2?: string | null;
    city: string; region?: string | null; postalCode?: string | null; country: string;
    isPrimary: boolean;
};
export type Contact = { id: string; type: string; value: string; label?: string | null; isPrimary: boolean };
export type Media = { id: string; kind: string; url: string; caption?: string | null };
export type Institution = {
    id: string; name: string; legalName?: string | null; slug: string;
    category: string; description?: string | null; foundedYear?: number | null;
    logoUrl?: string | null; coverUrl?: string | null; websiteUrl?: string | null;
    isPublished: boolean;
    addresses: Address[]; contacts: Contact[]; media: Media[];
    settings?: { landingTemplate?: string; landingTheme?: LandingThemeSettings | string } | null;
};

export const CATEGORY_LABEL: Record<string, string> = {
    UNIVERSITY: 'University',
    COLLEGE: 'College',
    HIGH_SCHOOL: 'High school',
    SCHOOL: 'School',
    TRAINING_CENTER: 'Training center',
    OTHER: 'Institution',
};

// ---------------------------------------------------------------------------
// Landing templates
// ---------------------------------------------------------------------------

export type LandingTemplateId =
    | 'classic' | 'modern' | 'minimal' | 'editorial' | 'vibrant' | 'corporate'
    | 'academic' | 'tech' | 'art' | 'boutique' | 'salon' | 'kids'
    | 'culinary' | 'sports' | 'music' | 'language' | 'medical' | 'agri';

export type LandingTone =
    | 'dark' | 'light' | 'mono' | 'editorial' | 'vibrant' | 'corporate'
    | 'academic' | 'tech' | 'art' | 'boutique' | 'salon' | 'kids'
    | 'culinary' | 'sports' | 'music' | 'language' | 'medical' | 'agri';

export const LANDING_TEMPLATES: { id: LandingTemplateId; name: string; description: string; tone: LandingTone }[] = [
    { id: 'classic',   name: 'Classic',   description: 'Dark mesh gradient with glass cards. Bold and immersive.',         tone: 'dark' },
    { id: 'modern',    name: 'Modern',    description: 'Light & airy with a full-width cover banner and centered hero.',   tone: 'light' },
    { id: 'minimal',   name: 'Minimal',   description: 'Monochrome typography-first layout. Big space, thin rules.',       tone: 'mono' },
    { id: 'editorial', name: 'Editorial', description: 'Magazine feel — serif headlines, drop cap, two-column body.',      tone: 'editorial' },
    { id: 'vibrant',   name: 'Vibrant',   description: 'Bold full-bleed color blocks and big gradient titles.',            tone: 'vibrant' },
    { id: 'corporate', name: 'Corporate', description: 'Structured & trustworthy with a left rail and brand accents.',     tone: 'corporate' },
    { id: 'academic',  name: 'Academic',  description: 'Ivy-league serif, navy crest aesthetic, dignified and timeless.',  tone: 'academic' },
    { id: 'tech',      name: 'Tech',      description: 'Bootcamp / coding school. Dark terminal vibe, mono fonts.',        tone: 'tech' },
    { id: 'art',       name: 'Art & Design', description: 'Brutalist big-imagery layout for art / design / fashion schools.', tone: 'art' },
    { id: 'boutique',  name: 'Boutique',  description: 'E-commerce style program catalog. Cards, badges, browse-the-shelf.', tone: 'boutique' },
    { id: 'salon',     name: 'Salon & Wellness', description: 'Warm gold / blush tones for beauty, wellness, hair studios.', tone: 'salon' },
    { id: 'kids',      name: 'Kids',      description: 'Playful colorful blobs for kindergartens and primary schools.',    tone: 'kids' },
    { id: 'culinary',  name: 'Culinary',  description: 'Warm wood & cream tones for cooking and pastry schools.',          tone: 'culinary' },
    { id: 'sports',    name: 'Sports',    description: 'High-energy bold sans for sports academies and fitness schools.',  tone: 'sports' },
    { id: 'music',     name: 'Music',     description: 'Concert-hall dark with stage spotlight for music conservatories.',  tone: 'music' },
    { id: 'language',  name: 'Language',  description: 'Multilingual greeting hero for language schools.',                  tone: 'language' },
    { id: 'medical',   name: 'Medical',   description: 'Calm clinical white & teal for nursing and medical schools.',       tone: 'medical' },
    { id: 'agri',      name: 'Agriculture', description: 'Earthy greens & sun for agriculture and sustainability schools.', tone: 'agri' },
];

// ---------------------------------------------------------------------------
// Color themes
// ---------------------------------------------------------------------------

export type LandingThemePresetId =
    // soft
    | 'ocean' | 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'sand' | 'lilac'
    | 'blossom' | 'seafoam' | 'butter' | 'coral' | 'sage'
    // bold
    | 'sunset' | 'forest' | 'amber' | 'crimson' | 'electric' | 'tropic' | 'royal' | 'neon' | 'plum'
    | 'magenta' | 'flame' | 'jade' | 'cobalt' | 'volt'
    // mono / earth
    | 'slate' | 'graphite' | 'mocha' | 'olive' | 'navy' | 'ink'
    | 'cream' | 'wine' | 'pine' | 'rust' | 'storm'
    // custom
    | 'custom';

export type LandingThemeFamily = 'soft' | 'bold' | 'mono';

export const LANDING_THEME_FAMILIES: { id: LandingThemeFamily; name: string; description: string }[] = [
    { id: 'soft',  name: 'Soft',  description: 'Pastels & airy gradients — friendly and approachable.' },
    { id: 'bold',  name: 'Bold',  description: 'High-energy palettes that pop on a page.' },
    { id: 'mono',  name: 'Mono & Earth', description: 'Quiet, grounded neutrals for a serious tone.' },
];

/** Stored shape in Institution.settings.landingTheme. */
export type LandingThemeSettings =
    | { preset: Exclude<LandingThemePresetId, 'custom'> }
    | { preset: 'custom'; primary: string; accent: string };

export type LandingThemePreset = {
    id: LandingThemePresetId;
    name: string;
    family: LandingThemeFamily;
    primary: string; // hex
    accent: string;  // hex
};

export const LANDING_THEME_PRESETS: LandingThemePreset[] = [
    // ---- Soft ----
    { id: 'ocean',    name: 'Ocean',    family: 'soft', primary: '#2563eb', accent: '#06b6d4' },
    { id: 'lavender', name: 'Lavender', family: 'soft', primary: '#7c3aed', accent: '#ec4899' },
    { id: 'mint',     name: 'Mint',     family: 'soft', primary: '#10b981', accent: '#84cc16' },
    { id: 'peach',    name: 'Peach',    family: 'soft', primary: '#fb7185', accent: '#fb923c' },
    { id: 'sky',      name: 'Sky',      family: 'soft', primary: '#0ea5e9', accent: '#22d3ee' },
    { id: 'rose',     name: 'Rose',     family: 'soft', primary: '#e11d48', accent: '#f472b6' },
    { id: 'sand',     name: 'Sand',     family: 'soft', primary: '#d97706', accent: '#fcd34d' },
    { id: 'lilac',    name: 'Lilac',    family: 'soft', primary: '#a855f7', accent: '#c4b5fd' },
    { id: 'blossom',  name: 'Blossom',  family: 'soft', primary: '#db2777', accent: '#fbcfe8' },
    { id: 'seafoam',  name: 'Seafoam',  family: 'soft', primary: '#0891b2', accent: '#a7f3d0' },
    { id: 'butter',   name: 'Butter',   family: 'soft', primary: '#ca8a04', accent: '#fde68a' },
    { id: 'coral',    name: 'Coral',    family: 'soft', primary: '#f97316', accent: '#fda4af' },
    { id: 'sage',     name: 'Sage',     family: 'soft', primary: '#65a30d', accent: '#bbf7d0' },

    // ---- Bold ----
    { id: 'sunset',   name: 'Sunset',   family: 'bold', primary: '#ea580c', accent: '#f43f5e' },
    { id: 'forest',   name: 'Forest',   family: 'bold', primary: '#059669', accent: '#14b8a6' },
    { id: 'amber',    name: 'Amber',    family: 'bold', primary: '#b45309', accent: '#f59e0b' },
    { id: 'crimson',  name: 'Crimson',  family: 'bold', primary: '#9f1239', accent: '#ef4444' },
    { id: 'electric', name: 'Electric', family: 'bold', primary: '#4f46e5', accent: '#22d3ee' },
    { id: 'tropic',   name: 'Tropic',   family: 'bold', primary: '#0d9488', accent: '#facc15' },
    { id: 'royal',    name: 'Royal',    family: 'bold', primary: '#5b21b6', accent: '#f59e0b' },
    { id: 'neon',     name: 'Neon',     family: 'bold', primary: '#db2777', accent: '#22c55e' },
    { id: 'plum',     name: 'Plum',     family: 'bold', primary: '#7e22ce', accent: '#f97316' },
    { id: 'magenta',  name: 'Magenta',  family: 'bold', primary: '#c026d3', accent: '#f472b6' },
    { id: 'flame',    name: 'Flame',    family: 'bold', primary: '#dc2626', accent: '#fb923c' },
    { id: 'jade',     name: 'Jade',     family: 'bold', primary: '#047857', accent: '#34d399' },
    { id: 'cobalt',   name: 'Cobalt',   family: 'bold', primary: '#1d4ed8', accent: '#f43f5e' },
    { id: 'volt',     name: 'Volt',     family: 'bold', primary: '#16a34a', accent: '#eab308' },

    // ---- Mono / Earth ----
    { id: 'slate',    name: 'Slate',    family: 'mono', primary: '#334155', accent: '#0ea5e9' },
    { id: 'graphite', name: 'Graphite', family: 'mono', primary: '#1f2937', accent: '#94a3b8' },
    { id: 'mocha',    name: 'Mocha',    family: 'mono', primary: '#78350f', accent: '#d6a35a' },
    { id: 'olive',    name: 'Olive',    family: 'mono', primary: '#4d7c0f', accent: '#a3a316' },
    { id: 'navy',     name: 'Navy',     family: 'mono', primary: '#1e3a8a', accent: '#fbbf24' },
    { id: 'ink',      name: 'Ink',      family: 'mono', primary: '#0f172a', accent: '#f43f5e' },
    { id: 'cream',    name: 'Cream',    family: 'mono', primary: '#57534e', accent: '#d6d3d1' },
    { id: 'wine',     name: 'Wine',     family: 'mono', primary: '#7f1d1d', accent: '#a8a29e' },
    { id: 'pine',     name: 'Pine',     family: 'mono', primary: '#064e3b', accent: '#a7f3d0' },
    { id: 'rust',     name: 'Rust',     family: 'mono', primary: '#9a3412', accent: '#d6d3d1' },
    { id: 'storm',    name: 'Storm',    family: 'mono', primary: '#475569', accent: '#cbd5e1' },
];

export const DEFAULT_THEME: LandingThemePreset = LANDING_THEME_PRESETS[0];

/** Resolve any stored shape (string preset id, object, undefined) into an effective pair of HEX colors. */
export function resolveTheme(
    stored: LandingThemeSettings | string | null | undefined,
): { primary: string; accent: string; preset: LandingThemePresetId } {
    const fallback = { primary: DEFAULT_THEME.primary, accent: DEFAULT_THEME.accent, preset: DEFAULT_THEME.id };
    if (!stored) return fallback;
    if (typeof stored === 'string') {
        const p = LANDING_THEME_PRESETS.find((x) => x.id === stored);
        return p ? { primary: p.primary, accent: p.accent, preset: p.id } : fallback;
    }
    if (stored.preset === 'custom') {
        return {
            primary: isHex((stored as any).primary) ? (stored as any).primary : DEFAULT_THEME.primary,
            accent:  isHex((stored as any).accent)  ? (stored as any).accent  : DEFAULT_THEME.accent,
            preset:  'custom',
        };
    }
    const p = LANDING_THEME_PRESETS.find((x) => x.id === stored.preset);
    return p ? { primary: p.primary, accent: p.accent, preset: p.id } : fallback;
}

export function isHex(v: unknown): v is string {
    return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

/* HEX <-> RGB helpers (no external deps; runs server-side too) */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r: number, g: number, b: number): string {
    const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(hex: string, target: string, ratio: number): string {
    const a = hexToRgb(hex), b = hexToRgb(target);
    return rgbToHex(a.r + (b.r - a.r) * ratio, a.g + (b.g - a.g) * ratio, a.b + (b.b - a.b) * ratio);
}
function withAlpha(hex: string, alpha: number): string {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Build a CSS-vars style object that overrides the brand/accent palettes,
 * the gradient endpoints, and the mesh tint colors for whatever wrapper
 * element we attach it to. Tailwind v4 resolves `text-brand-600`, `bg-brand-500`,
 * etc. via these CSS vars, so the entire landing inside the wrapper inherits.
 */
export function themeStyle(primary: string, accent: string): CSSProperties {
    const brand50  = mix(primary, '#ffffff', 0.92);
    const brand100 = mix(primary, '#ffffff', 0.84);
    const brand200 = mix(primary, '#ffffff', 0.70);
    const brand300 = mix(primary, '#ffffff', 0.50);
    const brand400 = mix(primary, '#ffffff', 0.25);
    const brand500 = primary;
    const brand600 = mix(primary, '#000000', 0.10);
    const brand700 = mix(primary, '#000000', 0.22);
    const brand800 = mix(primary, '#000000', 0.34);
    const brand900 = mix(primary, '#000000', 0.46);

    const accent400 = mix(accent, '#ffffff', 0.20);
    const accent500 = accent;
    const accent600 = mix(accent, '#000000', 0.12);

    return {
        ['--color-brand-50' as any]:  brand50,
        ['--color-brand-100' as any]: brand100,
        ['--color-brand-200' as any]: brand200,
        ['--color-brand-300' as any]: brand300,
        ['--color-brand-400' as any]: brand400,
        ['--color-brand-500' as any]: brand500,
        ['--color-brand-600' as any]: brand600,
        ['--color-brand-700' as any]: brand700,
        ['--color-brand-800' as any]: brand800,
        ['--color-brand-900' as any]: brand900,
        ['--color-accent-400' as any]: accent400,
        ['--color-accent-500' as any]: accent500,
        ['--color-accent-600' as any]: accent600,
        ['--grad-from' as any]: brand700,
        ['--grad-mid' as any]:  brand500,
        ['--grad-to' as any]:   accent500,
        ['--mesh-a' as any]: withAlpha(primary, 0.32),
        ['--mesh-b' as any]: withAlpha(accent,  0.28),
        ['--mesh-c' as any]: withAlpha(primary, 0.22),
        ['--mesh-d' as any]: withAlpha(accent,  0.20),
    };
}

// ---------------------------------------------------------------------------
// Shared landing props
// ---------------------------------------------------------------------------

export type LandingProps = {
    inst: Institution | null;
    name: string;
    category: string;
    primaryAddress: Address | null;
    gallery: Media[];
};

export function contactIcon(type: string) {
    return type.toLowerCase();
}

export function contactHref(type: string, value: string) {
    const t = type.toLowerCase();
    if (t.includes('phone')) return `tel:${value.replace(/\s+/g, '')}`;
    if (t.includes('mail')) return `mailto:${value}`;
    if (/^https?:\/\//.test(value)) return value;
    return `https://${value}`;
}
