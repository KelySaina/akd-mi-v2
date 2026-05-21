import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    CalendarDays, BadgeCheck, ArrowUpRight, Shield, Building2,
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
 * Corporate: structured, trustworthy. Tight grid, brand accent stripe down the left,
 * disciplined typography, badge-style trust markers.
 */
export default function CorporateLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-100">
            {/* Top utility strip */}
            <div className="bg-ink-900 text-white text-[11px] sm:text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                        <Shield className="size-3.5 text-accent-400 shrink-0" />
                        <span className="truncate">Official site of {name}.</span>
                    </div>
                    {inst?.websiteUrl && (
                        <a href={inst.websiteUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1 hover:text-accent-400 transition shrink-0">
                            {inst.websiteUrl.replace(/^https?:\/\//, '')} <ArrowUpRight className="size-3" />
                        </a>
                    )}
                </div>
            </div>

            {/* Main header */}
            <header className="sticky top-0 z-30 bg-white/95 dark:bg-ink-900/95 backdrop-blur border-b border-ink-200 dark:border-ink-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-3 sm:py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 sm:size-11 rounded-md object-cover bg-ink-100 dark:bg-ink-800 shrink-0" />
                        ) : (
                            <div className="size-10 sm:size-11 rounded-md bg-brand-600 grid place-items-center text-white shrink-0">
                                <Building2 className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-sm sm:text-base md:text-lg font-bold leading-tight truncate">{name}</div>
                            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <LandingNav hasGallery={gallery.length > 0} />
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero with brand stripe */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 pt-10 sm:pt-14 md:pt-20 pb-12 sm:pb-16">
                <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 items-stretch">
                    <div className="relative pl-5 sm:pl-8 border-l-4 border-brand-600">
                        <div className="text-xs sm:text-sm uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400 font-bold mb-4">
                            {category}{inst?.foundedYear ? ` · Established ${inst.foundedYear}` : ''}
                        </div>
                        <h1 className="font-bold tracking-tight leading-[1.05] text-[clamp(2rem,5.5vw,4rem)] break-words">
                            {name}
                        </h1>
                        {inst?.description && (
                            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-ink-700 dark:text-ink-300 max-w-2xl leading-relaxed">
                                {inst.description.split('\n')[0]}
                            </p>
                        )}
                        <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                            {inst?.description && (
                                <a href="#about" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white dark:bg-ink-800 border border-ink-300 dark:border-ink-700 font-semibold hover:bg-ink-100 dark:hover:bg-ink-700 transition text-sm sm:text-base">
                                    Read more <ArrowUpRight className="size-4" />
                                </a>
                            )}
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-ink-600 dark:text-ink-400">
                            <Trust label="Accredited institution" />
                            <Trust label="Recognized programs" />
                            <Trust label="Verified contacts" />
                        </div>
                    </div>

                    <div className="relative">
                        {inst?.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.coverUrl} alt={name} className="w-full h-full aspect-[4/5] object-cover rounded-md border border-ink-200 dark:border-ink-800 shadow-lg" />
                        ) : (
                            <div className="w-full h-full min-h-64 aspect-[4/5] rounded-md bg-grad-brand grid place-items-center text-white shadow-lg">
                                <GraduationCap className="size-24" />
                            </div>
                        )}
                        <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-md p-3 sm:p-4 shadow-xl">
                            <div className="text-[10px] uppercase tracking-wider text-ink-500">Founded</div>
                            <div className="text-2xl sm:text-3xl font-bold text-brand-700 dark:text-brand-400">
                                {inst?.foundedYear ?? '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key figures bar */}
            <section className="bg-white dark:bg-ink-900 border-y border-ink-200 dark:border-ink-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <Figure icon={CalendarDays} label="Founded" value={inst?.foundedYear ? String(inst.foundedYear) : '—'} />
                    <Figure icon={GraduationCap} label="Type" value={category} />
                    <Figure icon={MapPin} label="City" value={primaryAddress?.city ?? '—'} />
                    <Figure icon={Globe} label="Country" value={primaryAddress?.country ?? '—'} />
                </div>
            </section>

            {/* About — disciplined 2-col with sidebar */}
            {inst?.description && (
                <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16 md:py-20">
                    <div className="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
                        <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400 font-bold mb-3">About us</div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">Who we are</h2>
                            {inst.legalName && inst.legalName !== inst.name && (
                                <p className="text-sm text-ink-500">Legally registered as <span className="font-medium text-ink-700 dark:text-ink-300">{inst.legalName}</span>.</p>
                            )}
                        </div>
                        <div className="bg-white dark:bg-ink-900 rounded-md border border-ink-200 dark:border-ink-800 p-6 sm:p-8 shadow-sm">
                            <p className="text-ink-700 dark:text-ink-300 leading-relaxed text-base sm:text-lg whitespace-pre-line">{inst.description}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery — disciplined grid */}
            {gallery.length > 0 && (
                <section id="gallery" className="bg-white dark:bg-ink-900 border-y border-ink-200 dark:border-ink-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16">
                        <div className="text-xs uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400 font-bold mb-3">Facilities</div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-8">Our campus</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {gallery.map((m) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover rounded-md border border-ink-200 dark:border-ink-800" />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact — directory style */}
            <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16 md:py-20">
                <div className="text-xs uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400 font-bold mb-3">Get in touch</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-8">Contact directory</h2>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <Card title="Locations" icon={MapPin}>
                        {(inst?.addresses ?? []).length > 0 ? (
                            <ul className="divide-y divide-ink-200 dark:divide-ink-800">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="py-3 first:pt-0 last:pb-0 text-sm">
                                        {a.label && <div className="text-[10px] uppercase tracking-wider text-brand-700 dark:text-brand-400 mb-1 font-bold">{a.label}</div>}
                                        <div className="break-words font-medium">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-ink-500 break-words">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-ink-500">No address published yet.</p>}
                    </Card>
                    <Card title="Channels" icon={Phone}>
                        {(inst?.contacts ?? []).length > 0 ? (
                            <ul className="divide-y divide-ink-200 dark:divide-ink-800">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    return (
                                        <li key={c.id}>
                                            <a href={contactHref(c.type, c.value)} target={contactHref(c.type, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700 dark:hover:text-brand-400 transition">
                                                <Icon className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
                                                <span className="text-sm flex-1 truncate font-medium">{c.value}</span>
                                                {c.label && <span className="text-xs text-ink-500 hidden sm:inline shrink-0">{c.label}</span>}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : <p className="text-sm text-ink-500">No contact channels yet.</p>}
                    </Card>
                </div>
            </section>

            <footer className="bg-ink-900 text-ink-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-6 sm:py-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm">
                    <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
                    <span className="text-ink-500">Powered by AKD-MI</span>
                </div>
            </footer>
        </main>
    );
}

function Trust({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-4 text-brand-600 dark:text-brand-400" />
            {label}
        </span>
    );
}

function Figure({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="size-5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400">{label}</div>
                <div className="text-base sm:text-lg md:text-xl font-bold truncate">{value}</div>
            </div>
        </div>
    );
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-ink-900 rounded-md border border-ink-200 dark:border-ink-800 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-200 dark:border-ink-800">
                <Icon className="size-4 text-brand-600 dark:text-brand-400" />
                <span className="uppercase tracking-wider text-xs font-bold">{title}</span>
            </div>
            {children}
        </div>
    );
}
