import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Palette, Brush, Camera, Scissors as ScissorsIcon, ArrowUpRight,
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

export default function ArtLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-stone-50 text-stone-900 selection:bg-fuchsia-300/60">
            <header className="px-5 md:px-10 py-5 md:py-7 border-b border-stone-900">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 object-cover shrink-0" />
                        ) : (
                            <div className="size-10 bg-stone-900 grid place-items-center text-fuchsia-300 shrink-0">
                                <Palette className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-black uppercase tracking-tighter truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-stone-700"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero — type-led brutalist */}
            <section className="border-b border-stone-900">
                <div className="max-w-7xl mx-auto px-5 md:px-10 py-10 md:py-16 grid lg:grid-cols-12 gap-6 lg:gap-10 items-end">
                    <div className="lg:col-span-7">
                        <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-stone-500 mb-6">Est. {inst?.foundedYear ?? '—'} · {primaryAddress?.city ?? 'Worldwide'}</div>
                        <h1 className="font-black uppercase tracking-tighter leading-[0.85] text-[clamp(3rem,12vw,10rem)]">
                            Make.<br />Break.<br /><span className="text-fuchsia-600">Remake.</span>
                        </h1>
                        <p className="mt-8 text-lg md:text-2xl max-w-xl leading-snug">
                            {inst?.description ?? `A space to learn, dissent, and craft. ${name} trains the next generation of makers.`}
                        </p>
                        <div className="mt-10 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                        </div>
                    </div>
                    <div className="lg:col-span-5">
                        {inst?.coverUrl || inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="w-full aspect-square object-cover border border-stone-900 grayscale hover:grayscale-0 transition duration-700" />
                        ) : (
                            <div className="w-full aspect-square bg-fuchsia-600 grid place-items-center text-stone-50">
                                <Brush className="size-32" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Disciplines */}
            <section className="border-b border-stone-900">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-stone-900">
                    <Disc icon={Palette} label="Fine Arts" />
                    <Disc icon={Brush} label="Design" />
                    <Disc icon={Camera} label="Photography" />
                    <Disc icon={ScissorsIcon} label="Fashion" />
                </div>
            </section>

            {/* Gallery as showcase */}
            {gallery.length > 0 && (
                <section id="gallery" className="border-b border-stone-900">
                    <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-16">
                        <div className="flex items-end justify-between mb-8">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Works</h2>
                            <span className="text-xs uppercase tracking-[0.3em] text-stone-500 hidden md:block">— student & faculty selection</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                            {gallery.map((m, i) => (
                                <figure key={m.id} className={`relative overflow-hidden ${i % 5 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'} bg-stone-200 border border-stone-900`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.url} alt={m.caption ?? name} className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* About manifesto */}
            {inst?.description && (
                <section id="about" className="border-b border-stone-900">
                    <div className="max-w-5xl mx-auto px-5 md:px-10 py-14 md:py-20">
                        <div className="text-xs uppercase tracking-[0.35em] text-fuchsia-600 mb-4">Manifesto</div>
                        <p className="text-2xl md:text-4xl leading-tight font-medium whitespace-pre-line">{inst.description}</p>
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="border-b border-stone-900">
                <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-16 grid md:grid-cols-2 gap-10">
                    <div>
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6">Visit</h2>
                        <ul className="space-y-4 text-base md:text-lg">
                            {(inst?.addresses ?? []).map((a) => (
                                <li key={a.id} className="border-l-2 border-stone-900 pl-4">
                                    {a.label && <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500">{a.label}</div>}
                                    <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                    <div className="text-stone-600">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6">Reach out</h2>
                        <ul className="space-y-2">
                            {(inst?.contacts ?? []).map((c) => {
                                const Icon = icon(c.type);
                                const href = contactHref(c.type, c.value);
                                return (
                                    <li key={c.id}>
                                        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="group flex items-center justify-between gap-3 border-b border-stone-300 py-3 hover:border-stone-900 transition">
                                            <span className="flex items-center gap-3"><Icon className="size-4" /><span className="font-medium">{c.value}</span></span>
                                            <ArrowUpRight className="size-4 group-hover:rotate-45 transition" />
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </section>

            <footer className="px-5 md:px-10 py-5 text-xs uppercase tracking-[0.3em] text-stone-500 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Disc({ icon: Icon, label }: { icon: any; label: string }) {
    return (
        <div className="px-5 md:px-10 py-8 md:py-12 flex items-center gap-4 hover:bg-stone-900 hover:text-stone-50 transition">
            <Icon className="size-6 md:size-7" />
            <span className="font-black uppercase tracking-tighter text-lg md:text-2xl">{label}</span>
        </div>
    );
}
