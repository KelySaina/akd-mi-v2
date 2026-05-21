import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
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
 * Editorial: magazine-style — serif headlines, masthead, drop cap, two-column body,
 * thin rules, dateline-style category strip. Print-feel, but responsive.
 */
export default function EditorialLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    const intro = inst?.description?.split('\n')[0] ?? '';
    const restParas = inst?.description?.split('\n').slice(1).filter(Boolean) ?? [];

    return (
        <main className="min-h-screen bg-[#fbfaf7] dark:bg-ink-950 text-ink-900 dark:text-ink-100 font-serif">
            {/* Masthead */}
            <header className="sticky top-0 z-30 bg-[#fbfaf7]/95 dark:bg-ink-950/95 backdrop-blur border-b-2 border-ink-900 dark:border-ink-100">
                <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-3 flex items-center justify-between gap-3">
                    <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-ink-600 dark:text-ink-300 font-sans">
                        Vol. {inst?.foundedYear ? new Date().getFullYear() - inst.foundedYear + 1 : 'I'} · {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-sans">
                        <LandingNav hasGallery={gallery.length > 0} />
                        <AccessCTA variant="nav" />
                    </div>
                </div>
                <div className="px-4 sm:px-6 md:px-10 lg:px-14 pb-4 text-center">
                    <h1 className="font-serif font-black tracking-tight leading-[0.95] text-[clamp(2.5rem,9vw,7rem)]">{name}</h1>
                    <div className="mt-2 text-xs sm:text-sm uppercase tracking-[0.35em] text-ink-600 dark:text-ink-300 font-sans">
                        {category}{primaryAddress?.city ? ` · ${primaryAddress.city}` : ''}
                    </div>
                </div>
            </header>

            {/* Lede */}
            <section className="px-4 sm:px-6 md:px-10 lg:px-14 pt-10 sm:pt-14 md:pt-20 pb-10 max-w-5xl mx-auto">
                <div className="border-y-2 border-ink-900 dark:border-ink-100 py-6 sm:py-8 md:py-10">
                    {inst?.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.coverUrl} alt={name} className="w-full aspect-[21/9] object-cover mb-6 sm:mb-8" />
                    )}
                    {intro ? (
                        <p className="text-lg sm:text-xl md:text-2xl leading-relaxed first-letter:font-serif first-letter:font-black first-letter:text-5xl sm:first-letter:text-6xl md:first-letter:text-7xl first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:text-brand-700 dark:first-letter:text-brand-400">
                            {intro}
                        </p>
                    ) : (
                        <p className="text-lg sm:text-xl text-ink-500 italic">A short story is yet to be written.</p>
                    )}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 font-sans">
                    <AccessCTA variant="hero" />
                    {restParas.length > 0 && (
                        <a href="#about" className="inline-flex items-center gap-2 px-4 py-2 text-sm border-b-2 border-ink-900 dark:border-ink-100 hover:opacity-60 transition">
                            Continue reading →
                        </a>
                    )}
                </div>
            </section>

            {/* Body in two columns */}
            {restParas.length > 0 && (
                <section id="about" className="px-4 sm:px-6 md:px-10 lg:px-14 pb-12 sm:pb-16 max-w-5xl mx-auto">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400 font-sans mb-4 border-b border-ink-300 dark:border-ink-700 pb-2">
                        About {name}
                    </div>
                    <div className="columns-1 md:columns-2 gap-8 text-base sm:text-lg leading-relaxed text-ink-800 dark:text-ink-200 [&>p]:mb-4 [&>p]:break-inside-avoid">
                        {restParas.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                    {inst?.legalName && inst.legalName !== inst.name && (
                        <p className="mt-6 text-xs text-ink-500 italic font-sans">Legal name: {inst.legalName}</p>
                    )}
                </section>
            )}

            {/* Sidebar-style fact strip */}
            <section className="px-4 sm:px-6 md:px-10 lg:px-14 py-8 sm:py-10 max-w-5xl mx-auto border-y border-ink-300 dark:border-ink-700">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-6 font-sans">
                    <Fact label="Established" value={inst?.foundedYear ? String(inst.foundedYear) : '—'} />
                    <Fact label="Discipline"  value={category} />
                    <Fact label="City"        value={primaryAddress?.city ?? '—'} />
                    <Fact label="Country"     value={primaryAddress?.country ?? '—'} />
                </dl>
            </section>

            {/* Gallery as photo plate */}
            {gallery.length > 0 && (
                <section id="gallery" className="px-4 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16 max-w-6xl mx-auto">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400 font-sans mb-6 border-b border-ink-300 dark:border-ink-700 pb-2">
                        Plates
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {gallery.map((m) => (
                            <figure key={m.id} className="space-y-1.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover border border-ink-300 dark:border-ink-700" />
                                {m.caption && <figcaption className="text-xs text-ink-500 italic font-sans">{m.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* Colophon / contact */}
            <section id="contact" className="px-4 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16 max-w-5xl mx-auto border-t-2 border-ink-900 dark:border-ink-100 font-sans">
                <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400 mb-6">Colophon</div>
                <div className="grid md:grid-cols-2 gap-10">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-ink-500 mb-3">Address</div>
                        {(inst?.addresses ?? []).length > 0 ? (
                            <ul className="space-y-4">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="text-sm leading-relaxed">
                                        {a.label && <div className="text-[10px] uppercase tracking-wider text-brand-700 dark:text-brand-400 mb-1">{a.label}</div>}
                                        <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-ink-500">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-ink-500">—</p>}
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-ink-500 mb-3">Correspondence</div>
                        {(inst?.contacts ?? []).length > 0 ? (
                            <ul className="space-y-2">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    return (
                                        <li key={c.id}>
                                            <a href={contactHref(c.type, c.value)} target={contactHref(c.type, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm hover:opacity-60 transition">
                                                <Icon className="size-4 shrink-0 text-brand-700 dark:text-brand-400" />
                                                <span className="truncate">{c.value}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : <p className="text-sm text-ink-500">—</p>}
                    </div>
                </div>
            </section>

            <footer className="px-4 sm:px-6 md:px-10 lg:px-14 py-5 sm:py-6 text-xs text-ink-500 font-sans border-t border-ink-300 dark:border-ink-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400 mb-1.5">{label}</dt>
            <dd className="text-lg sm:text-xl font-serif font-medium truncate">{value}</dd>
        </div>
    );
}
