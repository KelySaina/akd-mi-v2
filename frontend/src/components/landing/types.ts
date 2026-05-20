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
    settings?: { landingTemplate?: string } | null;
};

export const CATEGORY_LABEL: Record<string, string> = {
    UNIVERSITY: 'University',
    COLLEGE: 'College',
    HIGH_SCHOOL: 'High school',
    SCHOOL: 'School',
    TRAINING_CENTER: 'Training center',
    OTHER: 'Institution',
};

export type LandingTemplateId = 'classic' | 'modern' | 'minimal';

export const LANDING_TEMPLATES: { id: LandingTemplateId; name: string; description: string; tone: 'dark' | 'light' | 'mono' }[] = [
    { id: 'classic', name: 'Classic', description: 'Dark mesh gradient with glass cards. Bold, modern, and immersive.', tone: 'dark' },
    { id: 'modern',  name: 'Modern',  description: 'Light & airy with a full-width cover banner and centered hero.',     tone: 'light' },
    { id: 'minimal', name: 'Minimal', description: 'Clean monochrome layout, big typography, no gradients.',             tone: 'mono' },
];

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
