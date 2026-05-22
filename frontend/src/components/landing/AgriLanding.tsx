import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Leaf, Sprout, Sun, Tractor, Wheat,
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

export default function AgriLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-[#f5f3e7] text-[#2d3a1f]">
            <header className="px-5 md:px-10 py-4 md:py-5 border-b border-[#cdd5a8]">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-11 rounded-full object-cover ring-2 ring-emerald-600/30 shrink-0" />
                        ) : (
                            <div className="size-11 rounded-full bg-emerald-700 grid place-items-center text-amber-200 ring-2 ring-emerald-500/30 shrink-0">
                                <Leaf className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-bold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-800/70 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-[#2d3a1f]"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute -top-10 -right-10 size-72 rounded-full bg-amber-300/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-10 size-80 rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />
                <div className="relative max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur text-emerald-800 text-xs font-semibold border border-emerald-200">
                            <Sun className="size-3.5 text-amber-500" /> Grow with the land
                        </div>
                        <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                            Cultivate <span className="text-emerald-700">knowledge</span>.<br />
                            Harvest <span className="italic text-amber-700">tomorrow</span>.
                        </h1>
                        <p className="mt-5 text-base md:text-lg text-[#3a4a2a] max-w-lg leading-relaxed">
                            {inst?.description ?? `${name} trains tomorrow's farmers, agronomists and stewards of the land.`}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                        </div>
                    </div>
                    <div className="relative">
                        {inst?.coverUrl || inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-xl shadow-emerald-700/20 ring-1 ring-emerald-200" />
                        ) : (
                            <div className="w-full aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-700 to-amber-600 grid place-items-center text-white shadow-xl shadow-emerald-700/20">
                                <Tractor className="size-32" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section id="about" className="bg-emerald-800 text-amber-50 py-14 md:py-20">
                <div className="max-w-6xl mx-auto px-5 md:px-10">
                    <div className="text-center mb-10">
                        <div className="text-xs uppercase tracking-[0.3em] text-amber-300">— Fields of study —</div>
                        <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Where we plant ideas</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Sprout,  t: 'Agronomy',         d: 'Soils, crops, plant science.' },
                            { icon: Tractor, t: 'Farm management',  d: 'Operations, economics, tooling.' },
                            { icon: Leaf,    t: 'Sustainability',   d: 'Permaculture · agroecology.' },
                            { icon: Wheat,   t: 'Agribusiness',     d: 'Market, supply chains, trade.' },
                        ].map((c, i) => (
                            <div key={i} className="rounded-2xl bg-emerald-900/40 border border-amber-300/20 p-5">
                                <c.icon className="size-7 text-amber-300" />
                                <h3 className="mt-3 text-lg font-bold tracking-tight">{c.t}</h3>
                                <p className="mt-1 text-sm text-amber-50/70">{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {gallery.length > 0 && (
                <section id="gallery" className="py-14 md:py-20">
                    <div className="max-w-6xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8">From our fields</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {gallery.map((m) => (
                                <figure key={m.id} className="overflow-hidden rounded-2xl border border-[#cdd5a8]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover" />
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="contact" className="bg-[#f5f3e7] border-t border-[#cdd5a8] py-14 md:py-20">
                <div className="max-w-5xl mx-auto px-5 md:px-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">Visit the farm</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(inst?.addresses ?? []).length > 0 && (
                            <div className="rounded-2xl border border-[#cdd5a8] bg-white p-6">
                                <div className="text-xs uppercase tracking-[0.25em] text-emerald-800 mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> Estate</div>
                                <ul className="space-y-3 text-sm">
                                    {inst!.addresses.map((a) => (
                                        <li key={a.id}>
                                            <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                            <div className="text-[#3a4a2a]">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(inst?.contacts ?? []).length > 0 && (
                            <div className="rounded-2xl border border-[#cdd5a8] bg-white p-6">
                                <div className="text-xs uppercase tracking-[0.25em] text-emerald-800 mb-3 flex items-center gap-2"><Phone className="size-3.5" /> Reach us</div>
                                <ul className="space-y-1.5 text-sm">
                                    {inst!.contacts.map((c) => {
                                        const Icon = icon(c.type);
                                        const href = contactHref(c.type, c.value);
                                        return (
                                            <li key={c.id}>
                                                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#f5f3e7] transition">
                                                    <Icon className="size-3.5 text-emerald-700" />
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

            <footer className="px-5 md:px-10 py-6 text-xs md:text-sm text-emerald-800/70 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span className="flex items-center gap-2"><Sprout className="size-3.5" /> © {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
