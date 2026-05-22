import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    BookOpen, ScrollText, Award, Building2, CalendarDays,
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

export default function AcademicLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    const motto = inst?.description?.split(/[.!?]/)[0]?.trim() || 'Veritas · Lux · Scientia';
    return (
        <main className="min-h-screen bg-[#fbf8f1] text-slate-900 font-serif">
            <header className="sticky top-0 z-30 bg-[#fbf8f1]/95 backdrop-blur border-b-2 border-double border-brand-700/40">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-4 md:py-5">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-12 rounded-full object-cover ring-2 ring-brand-700/30 shrink-0" />
                        ) : (
                            <div className="size-12 rounded-full bg-brand-700 grid place-items-center text-amber-100 shrink-0 ring-2 ring-amber-300/40">
                                <GraduationCap className="size-6" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-lg md:text-xl font-bold tracking-wide truncate">{name}</div>
                            <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-slate-500 truncate">{category} · Est. {inst?.foundedYear ?? '—'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-slate-700">
                            <LandingNav hasGallery={gallery.length > 0} />
                        </div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative max-w-5xl mx-auto px-5 md:px-10 pt-14 md:pt-24 pb-14 md:pb-20 text-center">
                <div className="inline-flex items-center gap-3 text-xs md:text-sm tracking-[0.3em] uppercase text-brand-700">
                    <span className="h-px w-10 bg-brand-700/40" />
                    {category}
                    <span className="h-px w-10 bg-brand-700/40" />
                </div>
                <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight font-bold">
                    {name}
                </h1>
                <p className="mt-6 text-lg md:text-xl italic text-slate-600 max-w-2xl mx-auto">&ldquo;{motto}&rdquo;</p>
                {inst?.description && (
                    <p className="mt-8 text-base md:text-lg leading-relaxed text-slate-700 max-w-3xl mx-auto">{inst.description}</p>
                )}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <AccessCTA variant="hero" />
                </div>
            </section>

            {/* Pillars */}
            <section className="bg-white border-y border-slate-200">
                <div className="max-w-6xl mx-auto px-5 md:px-10 py-12 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                    <Pillar icon={BookOpen} title="Scholarship" body="Rigorous curricula crafted by distinguished faculty." />
                    <Pillar icon={ScrollText} title="Tradition" body="A legacy of academic excellence and integrity." />
                    <Pillar icon={Award} title="Distinction" body="Graduates recognized across industry and academia." />
                    <Pillar icon={Building2} title="Community" body="Mentorship, residential life and lifelong networks." />
                </div>
            </section>

            {/* About */}
            {inst?.description && (
                <section id="about" className="max-w-5xl mx-auto px-5 md:px-10 py-14 md:py-20">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="h-px flex-1 bg-slate-300" />
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">About the Institution</h2>
                        <span className="h-px flex-1 bg-slate-300" />
                    </div>
                    <div className="md:columns-2 md:gap-10 text-slate-800 leading-relaxed text-base md:text-lg whitespace-pre-line">
                        <span className="float-left text-6xl md:text-7xl font-bold leading-[0.85] mr-2 mt-1 text-brand-700">
                            {inst.description.trim()[0]}
                        </span>
                        {inst.description.trim().slice(1)}
                    </div>
                    {inst.legalName && inst.legalName !== inst.name && (
                        <p className="mt-8 text-sm text-slate-500 text-center italic">Legal name: {inst.legalName}</p>
                    )}
                </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
                <section id="gallery" className="bg-slate-50 border-y border-slate-200 py-14 md:py-20">
                    <div className="max-w-6xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">Campus & Halls</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gallery.map((m) => (
                                <figure key={m.id} className="overflow-hidden border-4 border-white shadow-md">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover" />
                                    {m.caption && <figcaption className="px-3 py-2 text-xs italic text-slate-600 bg-white">{m.caption}</figcaption>}
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="max-w-5xl mx-auto px-5 md:px-10 py-14 md:py-20">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">Correspondence</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {(inst?.addresses ?? []).length > 0 && (
                        <div className="border border-slate-300 bg-white p-6">
                            <div className="text-[11px] tracking-[0.25em] uppercase text-brand-700 mb-4 flex items-center gap-2"><MapPin className="size-4" /> Addresses</div>
                            <ul className="space-y-4 text-sm">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id}>
                                        {a.label && <div className="text-xs italic text-slate-500 mb-0.5">{a.label}</div>}
                                        <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-slate-600">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(inst?.contacts ?? []).length > 0 && (
                        <div className="border border-slate-300 bg-white p-6">
                            <div className="text-[11px] tracking-[0.25em] uppercase text-brand-700 mb-4 flex items-center gap-2"><Phone className="size-4" /> Channels</div>
                            <ul className="space-y-2 text-sm">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    const href = contactHref(c.type, c.value);
                                    return (
                                        <li key={c.id}>
                                            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-slate-100 transition">
                                                <Icon className="size-4 text-brand-700" />
                                                <span className="flex-1 truncate">{c.value}</span>
                                                {c.label && <span className="text-xs italic text-slate-500">{c.label}</span>}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <footer className="border-t-2 border-double border-brand-700/40 bg-white">
                <div className="max-w-6xl mx-auto px-5 md:px-10 py-6 text-xs md:text-sm text-slate-500 flex flex-col md:flex-row gap-2 md:justify-between items-center">
                    <span className="flex items-center gap-2"><CalendarDays className="size-3.5" /> © {new Date().getFullYear()} {name}</span>
                    <span className="italic">Powered by AKD-MI</span>
                </div>
            </footer>
        </main>
    );
}

function Pillar({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
    return (
        <div className="text-center">
            <div className="mx-auto size-12 grid place-items-center rounded-full bg-amber-50 text-brand-700 ring-1 ring-brand-700/20">
                <Icon className="size-5" />
            </div>
            <div className="mt-3 font-bold text-base md:text-lg">{title}</div>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{body}</p>
        </div>
    );
}
