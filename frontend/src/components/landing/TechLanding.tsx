import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Terminal, Code2, Cpu, Zap, ChevronRight,
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

export default function TechLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    const slug = (inst?.slug ?? name).toLowerCase().replace(/\s+/g, '-');
    return (
        <main className="min-h-screen bg-[#0a0f1c] text-emerald-50 font-mono overflow-x-hidden">
            {/* grid background */}
            <div
                className="fixed inset-0 -z-10 opacity-30 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <header className="sticky top-0 z-30 bg-[#0a0f1c]/90 backdrop-blur border-b border-emerald-500/20">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-9 rounded object-cover ring-1 ring-emerald-400/40 shrink-0" />
                        ) : (
                            <div className="size-9 rounded bg-emerald-500/15 grid place-items-center text-emerald-300 ring-1 ring-emerald-400/40 shrink-0">
                                <Terminal className="size-4" />
                            </div>
                        )}
                        <div className="min-w-0 leading-tight">
                            <div className="text-sm md:text-base text-emerald-100 truncate">
                                <span className="text-emerald-400">~/</span>{slug}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-emerald-500/70 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero — terminal block */}
            <section className="relative px-5 md:px-10 py-14 md:py-24 max-w-6xl mx-auto">
                <div className="rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur shadow-2xl shadow-emerald-500/10 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/20 text-xs text-emerald-300/70">
                        <span className="size-3 rounded-full bg-red-500/70" />
                        <span className="size-3 rounded-full bg-amber-400/70" />
                        <span className="size-3 rounded-full bg-emerald-500/70" />
                        <span className="ml-3">{slug} — zsh</span>
                    </div>
                    <div className="p-6 md:p-10 text-sm md:text-base leading-relaxed">
                        <div className="text-emerald-400">$ whoami</div>
                        <div className="text-emerald-200/80 mb-4">{name}</div>
                        <div className="text-emerald-400">$ cat about.md</div>
                        <h1 className="mt-2 text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-emerald-50 leading-tight">
                            Build the future.<br />
                            <span className="text-emerald-400">$ ./learn-by-doing</span>
                        </h1>
                        {inst?.description && (
                            <p className="mt-6 text-emerald-200/70 max-w-2xl whitespace-pre-line">{inst.description}</p>
                        )}
                        <div className="mt-8 text-emerald-400">$ ./start --register</div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                        </div>
                        <div className="mt-6 text-emerald-500/60 flex items-center gap-2">
                            <span className="size-2 bg-emerald-400 animate-pulse rounded-full" />
                            <span className="text-xs">_ awaiting input</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stack */}
            <section className="px-5 md:px-10 pb-14 md:pb-20 max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat icon={Code2} label="Practice" value="100%" hint="project-based" />
                    <Stat icon={Cpu} label="Stack" value="Modern" hint="latest tooling" />
                    <Stat icon={Zap} label="Velocity" value="Ship fast" hint="weekly demos" />
                    <Stat icon={Terminal} label="Format" value={category} hint={primaryAddress?.city ?? '—'} />
                </div>
            </section>

            {/* Tracks (uses gallery if present, else fallback) */}
            {gallery.length > 0 && (
                <section id="gallery" className="px-5 md:px-10 pb-14 md:pb-20 max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-100 mb-6">
                        <span className="text-emerald-400">$</span> ls ./tracks
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {gallery.map((m) => (
                            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-emerald-500/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover saturate-50 group-hover:saturate-100 transition" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 text-xs text-emerald-200/90 flex items-center gap-2">
                                    <ChevronRight className="size-3 text-emerald-400" />
                                    {m.caption ?? 'track'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* About */}
            {inst?.description && (
                <section id="about" className="px-5 md:px-10 pb-14 md:pb-20 max-w-4xl mx-auto">
                    <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-6 md:p-8">
                        <div className="text-emerald-400 text-sm mb-2">// README.md</div>
                        <p className="text-emerald-100/90 leading-relaxed whitespace-pre-line">{inst.description}</p>
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="px-5 md:px-10 pb-16 md:pb-24 max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-100 mb-6">
                    <span className="text-emerald-400">$</span> contact --me
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {(inst?.addresses ?? []).length > 0 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-5">
                            <div className="text-emerald-400 text-xs mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> addresses</div>
                            <ul className="space-y-3 text-sm">
                                {inst!.addresses.map((a) => (
                                    <li key={a.id} className="text-emerald-100/90">
                                        {a.label && <div className="text-[10px] uppercase tracking-wider text-emerald-400/80">{a.label}</div>}
                                        <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                        <div className="text-emerald-200/60">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(inst?.contacts ?? []).length > 0 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-5">
                            <div className="text-emerald-400 text-xs mb-3 flex items-center gap-2"><Phone className="size-3.5" /> channels</div>
                            <ul className="space-y-1.5 text-sm">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    const href = contactHref(c.type, c.value);
                                    return (
                                        <li key={c.id}>
                                            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-emerald-500/10 transition">
                                                <Icon className="size-3.5 text-emerald-400" />
                                                <span className="flex-1 truncate text-emerald-100/90">{c.value}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <footer className="border-t border-emerald-500/20 px-5 md:px-10 py-5 text-xs text-emerald-500/60 flex flex-col md:flex-row md:justify-between gap-2 max-w-6xl mx-auto">
                <span>// © {new Date().getFullYear()} {name}</span>
                <span>// powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Stat({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
    return (
        <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-4">
            <div className="flex items-center justify-between text-emerald-400">
                <Icon className="size-4" />
                <span className="text-[10px] uppercase tracking-wider text-emerald-500/70">{label}</span>
            </div>
            <div className="mt-2 text-lg md:text-xl font-bold text-emerald-100 truncate">{value}</div>
            <div className="text-xs text-emerald-500/60 truncate">{hint}</div>
        </div>
    );
}
