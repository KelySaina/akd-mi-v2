import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
} from 'lucide-react';
import AccessCTA from '@/components/AccessCTA';
import LandingNav from '@/components/LandingNav';
import { contactHref, type LandingProps } from './types';

function icon(type: string) {
    const t = type.toLowerCase();
    if (t.includes('phone')) return Phone;
    if (t.includes('mail')) return Mail;
    if (t.includes('web')) return Globe;
    if (t.includes('facebook')) return Facebook;
    if (t.includes('instagram')) return Instagram;
    if (t.includes('twitter') || t === 'x') return Twitter;
    if (t.includes('linkedin')) return Linkedin;
    return Globe;
}

/**
 * Minimal: monochrome, typography-first, no gradients, no glass.
 * Just text, thin rules, and big space.
 */
export default function MinimalLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-100">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 md:px-10 lg:px-16 py-3 sm:py-4 bg-white/95 dark:bg-ink-950/95 backdrop-blur border-b border-ink-200 dark:border-ink-800">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {inst?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.logoUrl} alt={name} className="size-8 sm:size-9 rounded-md object-cover shrink-0" />
                    ) : (
                        <div className="size-8 sm:size-9 rounded-md border border-ink-300 dark:border-ink-700 grid place-items-center shrink-0">
                            <GraduationCap className="size-4" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="text-sm sm:text-base font-medium leading-tight truncate">{name}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <LandingNav hasGallery={gallery.length > 0} />
                    <AccessCTA variant="nav" />
                </div>
            </header>

            {/* Hero */}
            <section className="px-4 sm:px-6 md:px-10 lg:px-16 pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 max-w-5xl mx-auto">
                <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400 mb-4 sm:mb-6">
                    {category}{inst?.foundedYear ? ` · est. ${inst.foundedYear}` : ''}
                </div>
                <h1 className="font-serif font-normal tracking-tight leading-[1.05] text-[clamp(2rem,7vw,5rem)] break-words">
                    {name}.
                </h1>
                {inst?.description && (
                    <p className="mt-6 sm:mt-8 md:mt-10 text-base sm:text-lg md:text-xl text-ink-700 dark:text-ink-300 max-w-2xl leading-relaxed">
                        {inst.description.split('\n')[0]}
                    </p>
                )}
                <div className="mt-8 sm:mt-10 md:mt-12 flex flex-wrap items-center gap-3">
                    <AccessCTA variant="hero" />
                    {inst?.description && (
                        <a href="#about" className="inline-flex items-center gap-2 px-4 py-2 text-sm sm:text-base border-b border-ink-900 dark:border-ink-100 hover:opacity-60 transition">
                            Learn more →
                        </a>
                    )}
                </div>
            </section>

            <hr className="border-ink-200 dark:border-ink-800" />

            {/* Facts (inline) */}
            <section className="px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 max-w-5xl mx-auto">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                    <Row label="Founded" value={inst?.foundedYear ? String(inst.foundedYear) : '—'} />
                    <Row label="Type"    value={category} />
                    <Row label="City"    value={primaryAddress?.city ?? '—'} />
                    <Row label="Country" value={primaryAddress?.country ?? '—'} />
                </dl>
            </section>

            {inst?.description && (
                <>
                    <hr className="border-ink-200 dark:border-ink-800" />
                    <section id="about" className="px-4 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-16 md:py-20 max-w-3xl mx-auto">
                        <div className="text-xs uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400 mb-4">About</div>
                        <p className="text-ink-700 dark:text-ink-300 leading-relaxed text-base sm:text-lg whitespace-pre-line">{inst.description}</p>
                        {inst.legalName && inst.legalName !== inst.name && (
                            <p className="mt-6 text-xs text-ink-500">Legal name: {inst.legalName}</p>
                        )}
                    </section>
                </>
            )}

            {gallery.length > 0 && (
                <>
                    <hr className="border-ink-200 dark:border-ink-800" />
                    <section id="gallery" className="px-4 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-16 md:py-20 max-w-6xl mx-auto">
                        <div className="text-xs uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400 mb-6 sm:mb-8">Campus</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {gallery.map((m) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover" />
                            ))}
                        </div>
                    </section>
                </>
            )}

            <hr className="border-ink-200 dark:border-ink-800" />
            <section id="contact" className="px-4 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-16 md:py-20 max-w-5xl mx-auto">
                <div className="text-xs uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400 mb-6 sm:mb-8">Get in touch</div>
                <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">Addresses</div>
                        {(inst?.addresses ?? []).length > 0 ? (
                            <ul className="space-y-4">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="text-sm leading-relaxed">
                                        {a.label && <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">{a.label}</div>}
                                        <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-ink-500">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-ink-500">—</p>
                        )}
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">Channels</div>
                        {(inst?.contacts ?? []).length > 0 ? (
                            <ul className="space-y-2">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    return (
                                        <li key={c.id}>
                                            <a href={contactHref(c.type, c.value)} target={contactHref(c.type, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm hover:opacity-60 transition">
                                                <Icon className="size-4 shrink-0" />
                                                <span className="truncate">{c.value}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-ink-500">—</p>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-ink-200 dark:border-ink-800 px-4 sm:px-6 md:px-10 lg:px-16 py-5 sm:py-6 text-xs text-ink-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400 mb-1.5">{label}</dt>
            <dd className="text-base sm:text-lg font-medium truncate">{value}</dd>
        </div>
    );
}
