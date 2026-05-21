import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Sparkles, ArrowRight,
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
 * Vibrant: full-bleed color blocks, oversized gradient headlines, playful
 * chunky cards. Drops the muted palette for big saturated brand surfaces.
 */
export default function VibrantLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-100 overflow-x-hidden">
            {/* Floating pill nav */}
            <header className="sticky top-0 z-30 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
                <div className="mx-auto max-w-6xl bg-white/85 dark:bg-ink-900/85 backdrop-blur-md rounded-full border-2 border-ink-900 dark:border-ink-100 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] dark:shadow-[6px_6px_0_0_rgba(241,245,249,0.6)]">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-8 sm:size-9 rounded-full object-cover bg-grad-brand shrink-0" />
                        ) : (
                            <div className="size-8 sm:size-9 rounded-full bg-grad-brand grid place-items-center text-white shrink-0">
                                <GraduationCap className="size-4" />
                            </div>
                        )}
                        <div className="text-sm sm:text-base font-bold truncate">{name}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <LandingNav hasGallery={gallery.length > 0} />
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero: gigantic gradient title on a bold block */}
            <section className="relative px-4 sm:px-6 md:px-10 lg:px-14 pt-12 sm:pt-20 md:pt-28 pb-16 sm:pb-24 max-w-7xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-bold mb-6 sm:mb-8 border-2 border-brand-200 dark:border-brand-500/30">
                    <Sparkles className="size-3.5" />
                    {inst?.foundedYear ? `Since ${inst.foundedYear}` : 'Hello there'}
                </div>
                <h1 className="font-black tracking-tighter leading-[0.9] text-[clamp(2.5rem,10vw,8rem)]">
                    <span className="block">Welcome to</span>
                    <span className="block text-grad-brand break-words">{name}.</span>
                </h1>
                {inst?.description && (
                    <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-ink-700 dark:text-ink-300 max-w-2xl leading-relaxed font-medium">
                        {inst.description.split('\n')[0]}
                    </p>
                )}
                <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3">
                    <AccessCTA variant="hero" />
                    {inst?.description && (
                        <a href="#about" className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-ink-900 border-2 border-ink-900 dark:border-ink-100 font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] dark:hover:shadow-[4px_4px_0_0_rgba(241,245,249,0.6)] transition text-sm sm:text-base">
                            Learn more <ArrowRight className="size-4" />
                        </a>
                    )}
                </div>
                {/* Decorative chunky blobs */}
                <div className="hidden md:block absolute top-20 right-10 size-40 lg:size-56 rounded-full bg-grad-brand opacity-90 -z-0" />
                <div className="hidden md:block absolute bottom-10 right-40 size-20 lg:size-32 rounded-full bg-accent-500 opacity-80 -z-0" />
            </section>

            {/* Facts in colored chunky cards */}
            <section className="px-4 sm:px-6 md:px-10 lg:px-14 pb-12 sm:pb-16 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <ChunkyStat tone="brand"  label="Founded" value={inst?.foundedYear ? String(inst.foundedYear) : '—'} />
                    <ChunkyStat tone="accent" label="Type"    value={category} />
                    <ChunkyStat tone="ink"    label="City"    value={primaryAddress?.city ?? '—'} />
                    <ChunkyStat tone="brand"  label="Country" value={primaryAddress?.country ?? '—'} />
                </div>
            </section>

            {/* About on a full-bleed brand block */}
            {inst?.description && (
                <section id="about" className="bg-grad-brand text-white">
                    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-16 sm:py-20 md:py-24 max-w-5xl mx-auto">
                        <div className="text-xs uppercase tracking-[0.25em] text-white/80 mb-4 font-bold">About</div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6 sm:mb-8">{name}</h2>
                        <p className="text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-line text-white/95 max-w-3xl">
                            {inst.description}
                        </p>
                        {inst.legalName && inst.legalName !== inst.name && (
                            <p className="mt-6 text-xs sm:text-sm text-white/70">Legal name: {inst.legalName}</p>
                        )}
                    </div>
                </section>
            )}

            {/* Gallery: oversized cards with offsets */}
            {gallery.length > 0 && (
                <section id="gallery" className="px-4 sm:px-6 md:px-10 lg:px-14 py-16 sm:py-20 md:py-24 max-w-7xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-8 sm:mb-10">
                        On <span className="text-grad-brand">campus</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {gallery.map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={m.id}
                                src={m.url}
                                alt={m.caption ?? name}
                                className="aspect-[4/3] w-full object-cover rounded-3xl border-2 border-ink-900 dark:border-ink-100 shadow-[8px_8px_0_0_rgba(15,23,42,0.9)] dark:shadow-[8px_8px_0_0_rgba(241,245,249,0.4)]"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Contact: side-by-side chunky panels */}
            <section id="contact" className="px-4 sm:px-6 md:px-10 lg:px-14 py-16 sm:py-20 md:py-24 max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-8 sm:mb-10">
                    Say <span className="text-grad-brand">hi</span>.
                </h2>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    {(inst?.addresses ?? []).length > 0 ? (
                        <ChunkyPanel>
                            <div className="flex items-center gap-2 mb-4 font-bold uppercase tracking-wider text-xs">
                                <MapPin className="size-4 text-brand-600 dark:text-brand-400" /> Addresses
                            </div>
                            <ul className="space-y-4">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="text-sm">
                                        {a.label && <div className="text-[10px] uppercase tracking-wider text-brand-700 dark:text-brand-400 mb-1 font-bold">{a.label}</div>}
                                        <div className="break-words font-medium">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-ink-500 break-words">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        </ChunkyPanel>
                    ) : (
                        <ChunkyPanel><p className="text-sm text-ink-500">No address published yet.</p></ChunkyPanel>
                    )}

                    {(inst?.contacts ?? []).length > 0 ? (
                        <ChunkyPanel>
                            <div className="flex items-center gap-2 mb-4 font-bold uppercase tracking-wider text-xs">
                                <Phone className="size-4 text-brand-600 dark:text-brand-400" /> Channels
                            </div>
                            <ul className="space-y-1.5">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    return (
                                        <li key={c.id}>
                                            <a href={contactHref(c.type, c.value)} target={contactHref(c.type, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10 transition">
                                                <Icon className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
                                                <span className="text-sm flex-1 truncate font-medium">{c.value}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </ChunkyPanel>
                    ) : (
                        <ChunkyPanel><p className="text-sm text-ink-500">No contact channels yet.</p></ChunkyPanel>
                    )}
                </div>
            </section>

            <footer className="px-4 sm:px-6 md:px-10 lg:px-14 py-5 sm:py-6 text-xs sm:text-sm text-ink-500 border-t-2 border-ink-900 dark:border-ink-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="font-bold">© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function ChunkyStat({ tone, label, value }: { tone: 'brand' | 'accent' | 'ink'; label: string; value: string }) {
    const bg =
        tone === 'brand'  ? 'bg-brand-100 dark:bg-brand-500/15' :
        tone === 'accent' ? 'bg-accent-500/15 dark:bg-accent-500/15' :
        'bg-ink-100 dark:bg-ink-800';
    return (
        <div className={`rounded-2xl border-2 border-ink-900 dark:border-ink-100 p-4 sm:p-5 ${bg}`}>
            <div className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 font-bold">{label}</div>
            <div className="mt-2 text-xl sm:text-2xl md:text-3xl font-black truncate">{value}</div>
        </div>
    );
}

function ChunkyPanel({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border-2 border-ink-900 dark:border-ink-100 bg-white dark:bg-ink-900 p-5 sm:p-6 shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] dark:shadow-[6px_6px_0_0_rgba(241,245,249,0.4)]">
            {children}
        </div>
    );
}
