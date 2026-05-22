import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Music as MusicIcon, Disc3, Mic2, Headphones, Piano,
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

export default function MusicLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-[#0a0612] text-white overflow-x-hidden relative">
            {/* spotlight */}
            <div
                className="fixed inset-0 -z-10 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244,114,182,0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(168,85,247,0.18), transparent 60%)',
                }}
            />

            <header className="sticky top-0 z-30 bg-[#0a0612]/80 backdrop-blur border-b border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-3 md:py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 rounded-full object-cover ring-2 ring-pink-400/40 shrink-0" />
                        ) : (
                            <div className="size-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 grid place-items-center text-white shrink-0">
                                <MusicIcon className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-bold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-pink-300/80 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero with vinyl */}
            <section className="relative max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs">
                        <span className="size-1.5 rounded-full bg-pink-400 animate-pulse" /> Now playing
                    </div>
                    <h1 className="mt-5 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1]">
                        Find your <br />
                        <span className="bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">sound</span>.
                    </h1>
                    <p className="mt-6 text-base md:text-lg text-white/70 max-w-lg">
                        {inst?.description ?? `${name} — where instruments speak and voices carry. Compose, perform, record.`}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <AccessCTA variant="hero" />
                    </div>
                </div>
                <div className="relative flex items-center justify-center">
                    <div className="relative size-64 md:size-80 lg:size-96">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 via-violet-500 to-cyan-400 blur-2xl opacity-40 animate-pulse" />
                        <div className="relative size-full rounded-full bg-black border border-white/10 grid place-items-center" style={{ background: 'repeating-radial-gradient(circle at center, #18121e 0 4px, #0a0612 4px 8px)' }}>
                            <div className="size-1/3 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 grid place-items-center">
                                {inst?.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={inst.logoUrl} alt={name} className="size-1/2 rounded-full object-cover" />
                                ) : (
                                    <Disc3 className="size-1/2 text-white animate-spin" style={{ animationDuration: '12s' }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="about" className="border-y border-white/10 bg-white/[0.03] py-14 md:py-20">
                <div className="max-w-6xl mx-auto px-5 md:px-10">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">Programs in tune with you</h2>
                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { icon: Piano, title: 'Classical', desc: 'Piano · strings · theory' },
                            { icon: Mic2, title: 'Voice', desc: 'Pop · jazz · opera' },
                            { icon: Headphones, title: 'Production', desc: 'DAW · mixing · sound design' },
                            { icon: Disc3, title: 'Performance', desc: 'Stage · live ensemble' },
                        ].map((p, i) => (
                            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-pink-400/50 transition">
                                <p.icon className="size-7 text-pink-300" />
                                <h3 className="mt-3 text-lg font-bold tracking-tight">{p.title}</h3>
                                <p className="mt-1 text-sm text-white/60">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {gallery.length > 0 && (
                <section id="gallery" className="py-14 md:py-20">
                    <div className="max-w-6xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">On stage</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {gallery.map((m) => (
                                <div key={m.id} className="relative overflow-hidden rounded-2xl border border-white/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="contact" className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-20">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8">Come hear us</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {(inst?.addresses ?? []).length > 0 && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                            <div className="text-xs uppercase tracking-[0.25em] text-pink-300 mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> Concert hall</div>
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
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                            <div className="text-xs uppercase tracking-[0.25em] text-pink-300 mb-3 flex items-center gap-2"><Phone className="size-3.5" /> Front desk</div>
                            <ul className="space-y-1.5 text-sm">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    const href = contactHref(c.type, c.value);
                                    return (
                                        <li key={c.id}>
                                            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5 transition">
                                                <Icon className="size-3.5 text-pink-300" />
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

            <footer className="border-t border-white/10 px-5 md:px-10 py-5 text-xs text-white/50 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
