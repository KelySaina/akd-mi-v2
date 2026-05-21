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

export type LandingTemplateId = 'classic' | 'modern' | 'minimal' | 'editorial' | 'vibrant' | 'corporate';

export type LandingTone = 'dark' | 'light' | 'mono' | 'editorial' | 'vibrant' | 'corporate';

export const LANDING_TEMPLATES: { id: LandingTemplateId; name: string; description: string; tone: LandingTone }[] = [
    { id: 'classic',   name: 'Classic',   description: 'Dark mesh gradient with glass cards. Bold and immersive.',         tone: 'dark' },
    { id: 'modern',    name: 'Modern',    description: 'Light & airy with a full-width cover banner and centered hero.',   tone: 'light' },
    { id: 'minimal',   name: 'Minimal',   description: 'Monochrome typography-first layout. Big space, thin rules.',       tone: 'mono' },
    { id: 'editorial', name: 'Editorial', description: 'Magazine feel — serif headlines, drop cap, two-column body.',      tone: 'editorial' },
    { id: 'vibrant',   name: 'Vibrant',   description: 'Bold full-bleed color blocks and big gradient titles.',            tone: 'vibrant' },
    { id: 'corporate', name: 'Corporate', description: 'Structured & trustworthy with a left rail and brand accents.',     tone: 'corporate' },
];

// ---------------------------------------------------------------------------
// Color themes
// ---------------------------------------------------------------------------

export type LandingThemePresetId = 'ocean' | 'forest' | 'sunset' | 'lavender' | 'slate' | 'amber' | 'custom';

/** Stored shape in Institution.settings.landingTheme. */
export type LandingThemeSettings =
    | { preset: Exclude<LandingThemePresetId, 'custom'> }
    | { preset: 'custom'; primary: string; accent: string };

export type LandingThemePreset = {
    id: LandingThemePresetId;
    name: string;
    primary: string; // hex
    accent: string;  // hex
};

export const LANDING_THEME_PRESETS: LandingThemePreset[] = [
    { id: 'ocean',    name: 'Ocean',    primary: '#2563eb', accent: '#06b6d4' },
    { id: 'forest',   name: 'Forest',   primary: '#059669', accent: '#14b8a6' },
    { id: 'sunset',   name: 'Sunset',   primary: '#ea580c', accent: '#f43f5e' },
    { id: 'lavender', name: 'Lavender', primary: '#7c3aed', accent: '#ec4899' },
    { id: 'slate',    name: 'Slate',    primary: '#334155', accent: '#0ea5e9' },
    { id: 'amber',    name: 'Amber',    primary: '#b45309', accent: '#f59e0b' },
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
