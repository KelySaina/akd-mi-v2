import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    ChefHat, Utensils, Soup, Wheat, Flame,
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

type Recipe = { title: string; level: string; time: string };

const DEFAULT_RECIPES: Recipe[] = [
    { title: 'Classic French pastry',   level: 'Foundation',   time: '6 weeks' },
    { title: 'Mediterranean cuisine',   level: 'Intermediate', time: '8 weeks' },
    { title: 'Sourdough & bread craft', level: 'Foundation',   time: '4 weeks' },
    { title: 'Knife skills & butchery', level: 'Foundation',   time: '3 weeks' },
    { title: 'Plating & gastronomy',    level: 'Advanced',     time: '10 weeks' },
    { title: 'Wine & pairings',         level: 'Advanced',     time: '5 weeks' },
];

export default function CulinaryLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-[#fbf4e8] text-[#3c2415]" style={{ fontFamily: 'Georgia, serif' }}>
            <header className="px-5 md:px-10 py-4 md:py-5 border-b border-[#d9b88a]/60">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-11 rounded-full object-cover ring-2 ring-[#b07a3e]/50 shrink-0" />
                        ) : (
                            <div className="size-11 rounded-full bg-[#b07a3e] grid place-items-center text-[#fbf4e8] ring-2 ring-amber-300/40 shrink-0">
                                <ChefHat className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-bold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-[#8a6238] truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-[#3c2415]"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            <section className="relative max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c2415] text-[#fbf4e8] text-xs font-semibold tracking-wide">
                        <Flame className="size-3.5" /> From scratch
                    </div>
                    <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                        Taste, technique <span className="italic text-[#b07a3e]">&amp; tradition</span>.
                    </h1>
                    <p className="mt-5 text-base md:text-lg text-[#5a3a22] max-w-lg leading-relaxed">
                        {inst?.description ?? `Welcome to ${name}. Learn the trade — from the prep table to the pass.`}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <AccessCTA variant="hero" />
                    </div>
                </div>
                <div className="relative">
                    {inst?.coverUrl || inst?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="w-full aspect-[4/5] object-cover rounded-3xl shadow-xl shadow-[#b07a3e]/30 ring-1 ring-[#d9b88a]" />
                    ) : (
                        <div className="w-full aspect-[4/5] rounded-3xl bg-[#b07a3e] grid place-items-center text-[#fbf4e8] shadow-xl shadow-[#b07a3e]/30">
                            <Utensils className="size-32" />
                        </div>
                    )}
                </div>
            </section>

            <section id="about" className="bg-[#3c2415] text-[#fbf4e8] py-14 md:py-20">
                <div className="max-w-6xl mx-auto px-5 md:px-10">
                    <div className="text-center mb-10">
                        <div className="text-xs uppercase tracking-[0.3em] text-amber-300">— Today&apos;s menu —</div>
                        <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Course menu</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {DEFAULT_RECIPES.map((r, i) => (
                            <article key={i} className="border-b border-amber-300/30 pb-4">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <h3 className="font-bold text-lg">{r.title}</h3>
                                    <span className="text-xs text-amber-300 uppercase tracking-wider">{r.level}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-[#fbf4e8]/70">
                                    <span className="italic">{i % 2 === 0 ? 'Hands-on lab + service' : 'Lecture + tasting'}</span>
                                    <span>{r.time}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {gallery.length > 0 && (
                <section id="gallery" className="py-14 md:py-20">
                    <div className="max-w-6xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8">From the kitchen</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {gallery.map((m) => (
                                <figure key={m.id} className="overflow-hidden rounded-2xl border border-[#d9b88a]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover" />
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="contact" className="bg-[#fbf4e8] border-t border-[#d9b88a]/60 py-14 md:py-20">
                <div className="max-w-5xl mx-auto px-5 md:px-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">Pay us a visit</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(inst?.addresses ?? []).length > 0 && (
                            <div className="rounded-2xl border border-[#d9b88a] bg-white p-6">
                                <div className="text-xs uppercase tracking-[0.25em] text-[#b07a3e] mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> Kitchen</div>
                                <ul className="space-y-3 text-sm">
                                    {inst!.addresses.map((a) => (
                                        <li key={a.id}>
                                            {a.label && <div className="text-[10px] uppercase tracking-wider text-[#8a6238]">{a.label}</div>}
                                            <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                            <div className="text-[#5a3a22]">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(inst?.contacts ?? []).length > 0 && (
                            <div className="rounded-2xl border border-[#d9b88a] bg-white p-6">
                                <div className="text-xs uppercase tracking-[0.25em] text-[#b07a3e] mb-3 flex items-center gap-2"><Soup className="size-3.5" /> Reservations</div>
                                <ul className="space-y-1.5 text-sm">
                                    {inst!.contacts.map((c) => {
                                        const Icon = icon(c.type);
                                        const href = contactHref(c.type, c.value);
                                        return (
                                            <li key={c.id}>
                                                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#fbf4e8] transition">
                                                    <Icon className="size-3.5 text-[#b07a3e]" />
                                                    <span className="flex-1 truncate">{c.value}</span>
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className="px-5 md:px-10 py-6 text-xs md:text-sm text-[#8a6238] max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2 items-center">
                <span className="flex items-center gap-2"><Wheat className="size-3.5" /> © {new Date().getFullYear()} {name}</span>
                <span className="italic">Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
