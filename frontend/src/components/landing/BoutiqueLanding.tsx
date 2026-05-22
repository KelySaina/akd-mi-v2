import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    ShoppingBag, Tag, Star, Heart, ArrowRight,
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

type Program = { title: string; badge?: string; tagline: string };

const DEFAULT_PROGRAMS: Program[] = [
    { title: 'Foundation Track', badge: 'Bestseller', tagline: 'Get the essentials — 12 weeks.' },
    { title: 'Advanced Certificate', badge: 'Popular', tagline: 'Go deeper — 24 weeks.' },
    { title: 'Master Program', badge: 'New', tagline: 'For serious learners — 1 year.' },
];

export default function BoutiqueLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    const programs: Program[] = DEFAULT_PROGRAMS;
    return (
        <main className="min-h-screen bg-white text-ink-900">
            {/* Announcement bar */}
            <div className="bg-grad-brand text-white text-center text-xs md:text-sm py-2 px-4 font-medium">
                ✨ Enrollment open — secure your seat for the next intake
            </div>

            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-3 md:py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-9 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="size-9 rounded-full bg-grad-brand grid place-items-center text-white shadow shrink-0">
                                <ShoppingBag className="size-4" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-sm md:text-base font-bold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-ink-500 truncate">{category} · Shop programs</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-ink-700"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-5 md:px-10 pt-12 md:pt-20 pb-10 md:pb-14 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                        <Tag className="size-3.5" /> Limited seats per cohort
                    </div>
                    <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                        Discover your next <span className="text-grad-brand">chapter</span>.
                    </h1>
                    <p className="mt-5 text-lg text-ink-600 max-w-lg">
                        {inst?.description ?? `Browse the catalog at ${name}. Pick your program. Get learning.`}
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <AccessCTA variant="hero" />
                    </div>
                    <div className="mt-6 flex items-center gap-4 text-sm text-ink-500">
                        <div className="flex items-center gap-1.5 text-amber-500"><Star className="size-4 fill-amber-400" /><Star className="size-4 fill-amber-400" /><Star className="size-4 fill-amber-400" /><Star className="size-4 fill-amber-400" /><Star className="size-4 fill-amber-400" /></div>
                        Rated by alumni
                    </div>
                </div>
                <div className="relative">
                    {inst?.coverUrl || inst?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="w-full aspect-[4/5] object-cover rounded-3xl shadow-2xl shadow-brand-500/20" />
                    ) : (
                        <div className="w-full aspect-[4/5] rounded-3xl bg-grad-brand grid place-items-center text-white shadow-2xl shadow-brand-500/20">
                            <GraduationCap className="size-24" />
                        </div>
                    )}
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-ink-100 px-4 py-3 flex items-center gap-3">
                        <div className="size-9 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center"><Heart className="size-4" /></div>
                        <div className="text-sm"><div className="font-bold">Loved by students</div><div className="text-ink-500 text-xs">Join the community</div></div>
                    </div>
                </div>
            </section>

            {/* Programs grid */}
            <section id="about" className="bg-ink-50 border-y border-ink-200 py-14 md:py-20">
                <div className="max-w-7xl mx-auto px-5 md:px-10">
                    <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
                        <div>
                            <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold">Catalog</div>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">Featured programs</h2>
                        </div>
                        <div className="text-sm text-ink-500">Showing top picks · sorted by popularity</div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {programs.map((p, i) => (
                            <article key={i} className="group rounded-2xl border border-ink-200 bg-white overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition">
                                <div className="aspect-[5/3] bg-grad-brand/10 grid place-items-center relative">
                                    {gallery[i] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={gallery[i].url} alt={p.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <GraduationCap className="size-12 text-brand-500" />
                                    )}
                                    {p.badge && (
                                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white text-brand-700 text-[11px] font-bold shadow">
                                            {p.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-lg tracking-tight">{p.title}</h3>
                                        <div className="flex items-center gap-0.5 text-amber-500"><Star className="size-3.5 fill-amber-400" /><span className="text-xs text-ink-600">4.9</span></div>
                                    </div>
                                    <p className="mt-1.5 text-sm text-ink-600">{p.tagline}</p>
                                    <button type="button" className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-semibold group-hover:bg-grad-brand transition">
                                        Apply <ArrowRight className="size-4" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* About / promise */}
            {inst?.description && (
                <section className="max-w-5xl mx-auto px-5 md:px-10 py-14 md:py-20 text-center">
                    <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold">About {name}</div>
                    <p className="mt-3 text-xl md:text-2xl leading-relaxed text-ink-700 whitespace-pre-line">{inst.description}</p>
                </section>
            )}

            {/* Gallery */}
            {gallery.length > 3 && (
                <section id="gallery" className="bg-ink-50 border-y border-ink-200 py-14">
                    <div className="max-w-7xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">Lookbook</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {gallery.slice(3).map((m) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-square w-full object-cover rounded-2xl border border-ink-200" />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-20">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center mb-8">Customer service</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {(inst?.addresses ?? []).length > 0 && (
                        <div className="rounded-2xl border border-ink-200 p-6">
                            <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold flex items-center gap-2 mb-3"><MapPin className="size-3.5" /> Visit</div>
                            <ul className="space-y-3 text-sm">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id}>
                                        {a.label && <div className="text-[10px] uppercase tracking-wider text-ink-500">{a.label}</div>}
                                        <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-ink-600">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(inst?.contacts ?? []).length > 0 && (
                        <div className="rounded-2xl border border-ink-200 p-6">
                            <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold flex items-center gap-2 mb-3"><Phone className="size-3.5" /> Reach us</div>
                            <ul className="space-y-1.5 text-sm">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    const href = contactHref(c.type, c.value);
                                    return (
                                        <li key={c.id}>
                                            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-ink-50 transition">
                                                <Icon className="size-3.5 text-brand-700" />
                                                <span className="flex-1 truncate">{c.value}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <footer className="border-t border-ink-200 px-5 md:px-10 py-6 text-xs md:text-sm text-ink-500 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
