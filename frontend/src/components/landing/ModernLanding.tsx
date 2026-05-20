import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    CalendarDays, ArrowRight,
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
 * Modern: light, airy, image-forward. Full-width cover banner + centered hero text below.
 * Light background; uses the standard ink palette for readability.
 */
export default function ModernLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-100">
            {/* nav */}
            <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 md:px-10 lg:px-12 py-3 sm:py-4 bg-white/85 dark:bg-ink-900/85 backdrop-blur-md border-b border-ink-200 dark:border-ink-800">
                <div className="flex items-center gap-2 sm:gap-3 font-semibold tracking-tight min-w-0 flex-1">
                    {inst?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.logoUrl} alt={name} className="size-9 sm:size-10 rounded-xl object-cover bg-ink-100 dark:bg-ink-800 shrink-0" />
                    ) : (
                        <div className="size-9 sm:size-10 rounded-xl bg-grad-brand grid place-items-center text-white shrink-0">
                            <GraduationCap className="size-5" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="text-sm sm:text-base md:text-lg leading-tight truncate">{name}</div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400 truncate">{category}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <LandingNav hasGallery={gallery.length > 0} />
                    <AccessCTA variant="nav" />
                </div>
            </header>

            {/* Cover banner */}
            <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
                {inst?.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inst.coverUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-grad-brand" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-ink-50 dark:to-ink-950" />
            </div>

            {/* Hero (centered, overlapping the cover) */}
            <section className="relative z-10 -mt-32 sm:-mt-40 md:-mt-48 px-4 sm:px-6 md:px-10 lg:px-12 max-w-4xl mx-auto text-center">
                {inst?.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inst.logoUrl} alt={name} className="mx-auto size-20 sm:size-24 md:size-28 rounded-2xl object-cover bg-white shadow-2xl ring-4 ring-white dark:ring-ink-900" />
                )}
                <h1 className="mt-5 sm:mt-7 font-extrabold tracking-tight leading-[1.05] text-[clamp(1.75rem,6vw,4rem)] text-white drop-shadow-lg">
                    {name}
                </h1>
                <div className="mt-2 sm:mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-ink-900/90 text-xs sm:text-sm font-medium text-ink-700 dark:text-ink-200 backdrop-blur">
                    <CalendarDays className="size-3.5" />
                    {inst?.foundedYear ? `Founded ${inst.foundedYear}` : category}
                </div>
                {inst?.description && (
                    <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-ink-700 dark:text-ink-300 max-w-2xl mx-auto leading-relaxed">
                        {inst.description.split('\n')[0]}
                    </p>
                )}
                <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-2 sm:gap-3">
                    <AccessCTA variant="hero" />
                    {inst?.description && (
                        <a href="#about" className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 font-medium hover:bg-ink-100 dark:hover:bg-ink-700 transition text-sm sm:text-base shadow-sm">
                            Learn more <ArrowRight className="size-4" />
                        </a>
                    )}
                </div>
            </section>

            {/* Facts */}
            <section className="mt-10 sm:mt-14 md:mt-20 px-4 sm:px-6 md:px-10 lg:px-12 max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Stat icon={CalendarDays} label="Founded" value={inst?.foundedYear ? String(inst.foundedYear) : '—'} />
                    <Stat icon={GraduationCap} label="Type" value={category} />
                    <Stat icon={MapPin} label="City" value={primaryAddress?.city ?? '—'} />
                    <Stat icon={Globe} label="Country" value={primaryAddress?.country ?? '—'} />
                </div>
            </section>

            {/* About */}
            {inst?.description && (
                <section id="about" className="mt-12 sm:mt-16 md:mt-20 px-4 sm:px-6 md:px-10 lg:px-12 max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 tracking-tight">About {name}</h2>
                    <p className="text-ink-700 dark:text-ink-300 leading-relaxed text-base sm:text-lg whitespace-pre-line">{inst.description}</p>
                    {inst.legalName && inst.legalName !== inst.name && (
                        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-ink-500">Legal name: {inst.legalName}</p>
                    )}
                </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
                <section id="gallery" className="mt-12 sm:mt-16 md:mt-20 px-4 sm:px-6 md:px-10 lg:px-12 max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 tracking-tight">Campus</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {gallery.map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover rounded-2xl shadow-md" />
                        ))}
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="mt-12 sm:mt-16 md:mt-20 px-4 sm:px-6 md:px-10 lg:px-12 max-w-6xl mx-auto pb-16 sm:pb-20 md:pb-24">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 tracking-tight">Get in touch</h2>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    {(inst?.addresses ?? []).length > 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-ink-500 dark:text-ink-400">
                                <MapPin className="size-4" /> <span className="uppercase tracking-wider text-xs">Addresses</span>
                            </div>
                            <ul className="space-y-3 sm:space-y-4">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="text-sm">
                                        {a.label && <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">{a.label}</div>}
                                        <div className="break-words">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-ink-500 dark:text-ink-400 break-words">
                                            {[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <EmptyCard icon={MapPin} text="No address published yet." />
                    )}

                    {(inst?.contacts ?? []).length > 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-ink-500 dark:text-ink-400">
                                <Phone className="size-4" /> <span className="uppercase tracking-wider text-xs">Channels</span>
                            </div>
                            <ul className="space-y-1">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    return (
                                        <li key={c.id}>
                                            <a href={contactHref(c.type, c.value)} target={contactHref(c.type, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition">
                                                <Icon className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
                                                <span className="text-sm flex-1 truncate">{c.value}</span>
                                                {c.label && <span className="text-xs text-ink-500 hidden sm:inline shrink-0">{c.label}</span>}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <EmptyCard icon={Phone} text="No contact channels published yet." />
                    )}
                </div>
            </section>

            <footer className="border-t border-ink-200 dark:border-ink-800 px-4 sm:px-6 md:px-10 lg:px-12 py-5 sm:py-6 text-xs sm:text-sm text-ink-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-4 shadow-sm">
            <Icon className="size-4 text-brand-600 dark:text-brand-400" />
            <div className="mt-2 text-base sm:text-lg md:text-xl font-bold truncate">{value}</div>
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400 mt-0.5">{label}</div>
        </div>
    );
}

function EmptyCard({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-dashed border-ink-300 dark:border-ink-700 p-6 text-ink-500 text-sm flex items-center gap-3">
            <Icon className="size-4" /> {text}
        </div>
    );
}
