import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Scissors, Sparkles, Flower2, Clock, Star,
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

type Service = { title: string; duration: string; from: string };

const DEFAULT_SERVICES: Service[] = [
    { title: 'Hair styling masterclass',    duration: '4 weeks',  from: 'Beginner' },
    { title: 'Color & balayage workshop',   duration: '6 weeks',  from: 'Intermediate' },
    { title: 'Bridal & event styling',      duration: '8 weeks',  from: 'Advanced' },
    { title: 'Skincare & makeup essentials',duration: '4 weeks',  from: 'Beginner' },
    { title: 'Nail art & gel techniques',   duration: '3 weeks',  from: 'All levels' },
    { title: 'Salon management',            duration: '10 weeks', from: 'Pro' },
];

export default function SalonLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-[#fdf7f3] text-[#3c2a1f]">
            <header className="px-5 md:px-10 py-4 md:py-5 border-b border-[#e6d5c5]">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-11 rounded-full object-cover ring-2 ring-amber-400/40 shrink-0" />
                        ) : (
                            <div className="size-11 rounded-full bg-gradient-to-br from-amber-300 to-rose-300 grid place-items-center text-white ring-2 ring-amber-300/40 shrink-0">
                                <Sparkles className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-bold tracking-tight truncate" style={{ fontFamily: 'serif' }}>{name}</div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-[#a08572] truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-[#3c2a1f]"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
                <div className="relative max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur text-rose-700 text-xs font-semibold border border-rose-200">
                            <Flower2 className="size-3.5" /> Where craft meets care
                        </div>
                        <h1 className="mt-5 text-4xl md:text-6xl leading-tight tracking-tight font-bold" style={{ fontFamily: 'serif' }}>
                            Beauty is a <span className="italic text-rose-700">craft</span>.<br />Learn it gracefully.
                        </h1>
                        <p className="mt-5 text-base md:text-lg text-[#5a4636] max-w-lg">
                            {inst?.description ?? `Step into ${name} and master the art of styling, color, skincare and presence.`}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                        </div>
                    </div>
                    <div className="relative">
                        {inst?.coverUrl || inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-2xl shadow-rose-200/60" />
                        ) : (
                            <div className="w-full aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-amber-200 via-rose-200 to-rose-300 grid place-items-center text-white shadow-2xl shadow-rose-200/60">
                                <Scissors className="size-24" />
                            </div>
                        )}
                        <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-amber-200 px-4 py-3 flex items-center gap-3">
                            <div className="flex items-center gap-0.5 text-amber-500">
                                <Star className="size-3.5 fill-amber-400" /><Star className="size-3.5 fill-amber-400" /><Star className="size-3.5 fill-amber-400" /><Star className="size-3.5 fill-amber-400" /><Star className="size-3.5 fill-amber-400" />
                            </div>
                            <div className="text-sm"><div className="font-semibold">Loved by alumni</div><div className="text-xs text-[#a08572]">Classes filling up</div></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services menu */}
            <section id="about" className="bg-white border-y border-[#e6d5c5] py-14 md:py-20">
                <div className="max-w-6xl mx-auto px-5 md:px-10">
                    <div className="text-center mb-10">
                        <div className="text-xs uppercase tracking-[0.3em] text-rose-700">— Our offerings —</div>
                        <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'serif' }}>Courses & workshops</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DEFAULT_SERVICES.map((s, i) => (
                            <div key={i} className="rounded-2xl border border-[#e6d5c5] bg-[#fdf7f3] hover:bg-white transition p-5">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <h3 className="font-bold text-base">{s.title}</h3>
                                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">{s.from}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#5a4636]">
                                    <Clock className="size-3.5 text-rose-700" /> {s.duration}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery */}
            {gallery.length > 0 && (
                <section id="gallery" className="py-14 md:py-20">
                    <div className="max-w-6xl mx-auto px-5 md:px-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8" style={{ fontFamily: 'serif' }}>Looks & moments</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {gallery.map((m) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/5] w-full object-cover rounded-3xl shadow-md" />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="bg-white border-y border-[#e6d5c5] py-14 md:py-20">
                <div className="max-w-5xl mx-auto px-5 md:px-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10" style={{ fontFamily: 'serif' }}>Visit us</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(inst?.addresses ?? []).length > 0 && (
                            <div className="rounded-2xl border border-[#e6d5c5] p-6">
                                <div className="text-xs uppercase tracking-[0.25em] text-rose-700 mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> Salon</div>
                                <ul className="space-y-3 text-sm">
                                    {inst!.addresses.map((a) => (
                                        <li key={a.id}>
                                            {a.label && <div className="text-[10px] uppercase tracking-wider text-[#a08572]">{a.label}</div>}
                                            <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                            <div className="text-[#5a4636]">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(inst?.contacts ?? []).length > 0 && (
                            <div className="rounded-2xl border border-[#e6d5c5] p-6">
                                <div className="text-xs uppercase tracking-[0.25em] text-rose-700 mb-3 flex items-center gap-2"><Phone className="size-3.5" /> Book a call</div>
                                <ul className="space-y-1.5 text-sm">
                                    {inst!.contacts.map((c) => {
                                        const Icon = icon(c.type);
                                        const href = contactHref(c.type, c.value);
                                        return (
                                            <li key={c.id}>
                                                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-rose-50 transition">
                                                    <Icon className="size-3.5 text-rose-700" />
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

            <footer className="px-5 md:px-10 py-6 text-xs md:text-sm text-[#a08572] max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span className="italic">Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
