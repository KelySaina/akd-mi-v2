import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    CalendarDays, Sparkles,
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

export default function ClassicLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-mesh text-white overflow-x-hidden relative">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 bg-ink-950/70 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3 font-semibold tracking-tight min-w-0 flex-1">
                    {inst?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.logoUrl} alt={name} className="size-9 sm:size-10 rounded-xl object-cover bg-white/10 shrink-0" />
                    ) : (
                        <div className="size-9 sm:size-10 rounded-xl bg-grad-brand grid place-items-center shadow-lg shadow-brand-500/30 shrink-0">
                            <GraduationCap className="size-5" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="text-sm sm:text-base md:text-lg leading-tight truncate">{name}</div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 truncate">{category}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <LandingNav hasGallery={gallery.length > 0} />
                    <AccessCTA variant="nav" />
                </div>
            </header>

            <section className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-12 pt-6 sm:pt-10 md:pt-16 lg:pt-20 pb-10 sm:pb-14 md:pb-20 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-[1.2fr_1fr] gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full glass text-[11px] sm:text-xs text-white/80 mb-4 sm:mb-5 md:mb-6">
                            <Sparkles className="size-3 sm:size-3.5 text-cyan-300" />
                            {inst?.foundedYear ? `Founded ${inst.foundedYear}` : 'Welcome'}
                        </div>
                        <h1 className="font-extrabold tracking-tight leading-[1.05] text-[clamp(1.75rem,6vw,4.5rem)] break-words">
                            {name.split(' ').slice(0, -1).join(' ')}{' '}
                            <span className="text-grad-brand">{name.split(' ').slice(-1)[0]}</span>
                        </h1>
                        {inst?.description && (
                            <p className="mt-3 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg lg:text-xl text-white/70 max-w-2xl leading-relaxed">{inst.description}</p>
                        )}
                        <div className="mt-5 sm:mt-8 md:mt-10 flex flex-wrap items-center gap-2 sm:gap-3">
                            <AccessCTA variant="hero" />
                            {inst?.description && (
                                <a href="#about" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl glass font-medium hover:bg-white/15 transition text-xs sm:text-base">
                                    Learn more
                                </a>
                            )}
                            {inst?.websiteUrl && (
                                <a href={inst.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl glass font-medium hover:bg-white/15 transition text-xs sm:text-base">
                                    <Globe className="size-4" /> <span className="hidden sm:inline">Official website</span><span className="sm:hidden">Website</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:block">
                        {inst?.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.coverUrl} alt={name} className="w-full aspect-[4/5] object-cover rounded-3xl border border-white/10 shadow-2xl shadow-brand-500/20" />
                        ) : inst?.logoUrl ? (
                            <div className="glass rounded-3xl p-8 lg:p-12 aspect-[4/5] grid place-items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={inst.logoUrl} alt={name} className="max-w-[60%] max-h-[60%] object-contain" />
                            </div>
                        ) : (
                            <div className="glass rounded-3xl p-8 lg:p-12 aspect-[4/5] grid place-items-center">
                                <GraduationCap className="size-24 lg:size-32 text-white/30" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                    <Fact icon={CalendarDays} label="Founded" value={inst?.foundedYear ? String(inst.foundedYear) : '—'} />
                    <Fact icon={GraduationCap} label="Type" value={category} />
                    <Fact icon={MapPin} label="City" value={primaryAddress?.city ?? '—'} />
                    <Fact icon={Globe} label="Country" value={primaryAddress?.country ?? '—'} />
                </div>
            </section>

            {inst?.description && (
                <section id="about" className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-12 pb-12 sm:pb-16 md:pb-20 max-w-7xl mx-auto">
                    <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 max-w-4xl">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 tracking-tight">About {name}</h2>
                        <p className="text-white/80 leading-relaxed text-base sm:text-lg whitespace-pre-line">{inst.description}</p>
                        {inst.legalName && inst.legalName !== inst.name && (
                            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/50">Legal name: {inst.legalName}</p>
                        )}
                    </div>
                </section>
            )}

            {gallery.length > 0 && (
                <section id="gallery" className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-12 pb-12 sm:pb-16 md:pb-20 max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 tracking-tight">Campus</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {gallery.map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover rounded-2xl border border-white/10" />
                        ))}
                    </div>
                </section>
            )}

            <section id="contact" className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-12 pb-16 sm:pb-20 md:pb-24 max-w-7xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 tracking-tight">Get in touch</h2>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    {(inst?.addresses ?? []).length > 0 ? (
                        <div className="glass rounded-2xl p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-white/70">
                                <MapPin className="size-4" /> <span className="uppercase tracking-wider text-xs">Addresses</span>
                            </div>
                            <ul className="space-y-3 sm:space-y-4">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="text-sm">
                                        {a.label && <div className="text-xs uppercase tracking-wider text-cyan-300 mb-1">{a.label}</div>}
                                        <div className="break-words">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-white/70 break-words">
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
                        <div className="glass rounded-2xl p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-white/70">
                                <Phone className="size-4" /> <span className="uppercase tracking-wider text-xs">Channels</span>
                            </div>
                            <ul className="space-y-2">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    return (
                                        <li key={c.id}>
                                            <a href={contactHref(c.type, c.value)} target={contactHref(c.type, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition">
                                                <Icon className="size-4 text-cyan-300 shrink-0" />
                                                <span className="text-sm flex-1 truncate">{c.value}</span>
                                                {c.label && <span className="text-xs text-white/50 hidden sm:inline shrink-0">{c.label}</span>}
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

            <footer className="relative z-10 border-t border-white/10 px-4 sm:px-6 md:px-10 lg:px-12 py-5 sm:py-6 text-xs sm:text-sm text-white/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Fact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="glass rounded-2xl p-3 sm:p-4">
            <Icon className="size-4 text-cyan-300" />
            <div className="mt-2 text-base sm:text-lg md:text-xl font-bold truncate">{value}</div>
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 mt-0.5">{label}</div>
        </div>
    );
}

function EmptyCard({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="glass rounded-2xl p-6 text-white/60 text-sm flex items-center gap-3">
            <Icon className="size-4" /> {text}
        </div>
    );
}
