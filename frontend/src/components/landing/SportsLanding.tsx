import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Trophy, Zap, Timer, Dumbbell, Flame, Target,
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

export default function SportsLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-ink-950 text-white overflow-x-hidden">
            {/* diagonal stripes */}
            <div
                className="fixed inset-0 -z-10 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: 'repeating-linear-gradient(-45deg, currentColor 0 2px, transparent 2px 18px)',
                }}
            />

            <header className="sticky top-0 z-30 bg-ink-950/90 backdrop-blur border-b-2 border-amber-400">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-3 md:py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 rounded object-cover ring-2 ring-amber-400 shrink-0" />
                        ) : (
                            <div className="size-10 rounded bg-amber-400 grid place-items-center text-ink-950 ring-2 ring-amber-300 shrink-0">
                                <Trophy className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-black uppercase tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative max-w-7xl mx-auto px-5 md:px-10 py-14 md:py-24">
                <div className="text-amber-400 text-xs md:text-sm uppercase tracking-[0.35em] mb-4">No shortcuts · No excuses</div>
                <h1 className="font-black uppercase tracking-tighter leading-[0.85] text-[clamp(3rem,13vw,11rem)]">
                    Train.<br />
                    Compete.<br />
                    <span className="text-amber-400">Conquer.</span>
                </h1>
                <p className="mt-8 max-w-2xl text-lg md:text-2xl text-white/70 leading-snug">
                    {inst?.description ?? `${name} forges athletes. Discipline, strength, mindset — built daily.`}
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                    <AccessCTA variant="hero" />
                </div>
            </section>

            {/* Numbers */}
            <section className="border-y border-white/10 bg-white/5">
                <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <Stat icon={Trophy} value="100+" label="Champions trained" />
                    <Stat icon={Flame} value="365" label="Days a year" />
                    <Stat icon={Timer} value="6:00" label="Morning sessions" />
                    <Stat icon={Target} value="98%" label="Placement rate" />
                </div>
            </section>

            {/* Programs */}
            <section id="about" className="max-w-7xl mx-auto px-5 md:px-10 py-14 md:py-20">
                <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
                    <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-amber-400">— Disciplines —</div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mt-1">Pick your fight</h2>
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { icon: Dumbbell, title: 'Strength', desc: 'Power-lifting & conditioning' },
                        { icon: Zap, title: 'Speed', desc: 'Sprint & agility training' },
                        { icon: Trophy, title: 'Team sports', desc: 'Football · Basketball · Rugby' },
                        { icon: Target, title: 'Combat', desc: 'Boxing · MMA · Wrestling' },
                    ].map((p, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-amber-400 transition p-5">
                            <p.icon className="size-7 text-amber-400" />
                            <h3 className="mt-3 text-xl font-black uppercase tracking-tight">{p.title}</h3>
                            <p className="mt-1 text-sm text-white/60">{p.desc}</p>
                            <div className="absolute -bottom-10 -right-10 size-32 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/30 transition" />
                        </div>
                    ))}
                </div>
            </section>

            {gallery.length > 0 && (
                <section id="gallery" className="bg-white/5 border-y border-white/10 py-14 md:py-20">
                    <div className="max-w-7xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6">In action</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {gallery.map((m) => (
                                <div key={m.id} className="relative overflow-hidden rounded-xl">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover saturate-[1.1] contrast-[1.05]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="contact" className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-20">
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-8">Get in</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {(inst?.addresses ?? []).length > 0 && (
                        <div className="border-l-4 border-amber-400 pl-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-2">Facility</div>
                            <ul className="space-y-3 text-sm">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id}>
                                        <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-white/60">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(inst?.contacts ?? []).length > 0 && (
                        <div className="border-l-4 border-amber-400 pl-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-2">Coach line</div>
                            <ul className="space-y-1.5 text-sm">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    const href = contactHref(c.type, c.value);
                                    return (
                                        <li key={c.id}>
                                            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5 transition">
                                                <Icon className="size-3.5 text-amber-400" />
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

            <footer className="border-t-2 border-amber-400 px-5 md:px-10 py-5 text-xs uppercase tracking-[0.3em] text-white/60 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
    return (
        <div className="flex items-center gap-4">
            <Icon className="size-9 text-amber-400" />
            <div>
                <div className="text-3xl md:text-4xl font-black tracking-tighter">{value}</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">{label}</div>
            </div>
        </div>
    );
}
