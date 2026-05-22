import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Stethoscope, Heart, Activity, Shield, Plus,
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

export default function MedicalLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-3 md:py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 rounded-xl object-cover ring-1 ring-teal-200 shrink-0" />
                        ) : (
                            <div className="size-10 rounded-xl bg-teal-500 grid place-items-center text-white shadow-sm shadow-teal-500/30 shrink-0">
                                <Plus className="size-5" strokeWidth={3} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-bold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-slate-700"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gradient-to-b from-teal-50 to-white">
                <div className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-semibold shadow-sm">
                            <Heart className="size-3.5" /> Care begins with knowledge
                        </div>
                        <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-tight text-slate-900">
                            Train to <span className="text-teal-600">heal</span>.<br />
                            Train to <span className="text-teal-600">serve</span>.
                        </h1>
                        <p className="mt-5 text-base md:text-lg text-slate-600 max-w-lg leading-relaxed">
                            {inst?.description ?? `${name} prepares the next generation of nurses, medics and health professionals — with rigor and compassion.`}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                        </div>
                    </div>
                    <div className="relative">
                        {inst?.coverUrl || inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="w-full aspect-[4/3] object-cover rounded-3xl shadow-xl shadow-teal-500/20" />
                        ) : (
                            <div className="w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-500 grid place-items-center text-white shadow-xl shadow-teal-500/20">
                                <Stethoscope className="size-32" />
                            </div>
                        )}
                        {/* EKG line */}
                        <svg className="absolute -bottom-6 left-4 right-4 h-12 text-teal-500" viewBox="0 0 400 40" fill="none" preserveAspectRatio="none">
                            <path d="M0 20 L80 20 L100 8 L120 32 L140 20 L200 20 L220 4 L240 36 L260 20 L400 20" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section id="about" className="border-y border-slate-200 py-14 md:py-20">
                <div className="max-w-6xl mx-auto px-5 md:px-10">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-10">A career, a calling</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Heart,        t: 'Compassion',  d: 'Patient-first mindset, every day.' },
                            { icon: Shield,       t: 'Safety',      d: 'Evidence-based, audited practice.' },
                            { icon: Activity,     t: 'Rigor',       d: 'Clinical labs · case studies.' },
                            { icon: Stethoscope,  t: 'Practice',    d: 'Internships in partner hospitals.' },
                        ].map((c, i) => (
                            <div key={i} className="rounded-2xl bg-teal-50 border border-teal-100 p-5">
                                <c.icon className="size-7 text-teal-600" />
                                <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">{c.t}</h3>
                                <p className="mt-1 text-sm text-slate-600">{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {gallery.length > 0 && (
                <section id="gallery" className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-20">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8">Inside our wards</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gallery.map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover rounded-2xl border border-slate-200" />
                        ))}
                    </div>
                </section>
            )}

            <section id="contact" className="bg-teal-50 border-t border-teal-100 py-14 md:py-20">
                <div className="max-w-5xl mx-auto px-5 md:px-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10 text-slate-900">Reach our admissions desk</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(inst?.addresses ?? []).length > 0 && (
                            <div className="rounded-2xl bg-white border border-teal-100 p-6 shadow-sm">
                                <div className="text-xs uppercase tracking-wider text-teal-700 font-semibold mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> Faculty</div>
                                <ul className="space-y-3 text-sm">
                                    {inst!.addresses.map((a) => (
                                        <li key={a.id}>
                                            <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                            <div className="text-slate-600">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(inst?.contacts ?? []).length > 0 && (
                            <div className="rounded-2xl bg-white border border-teal-100 p-6 shadow-sm">
                                <div className="text-xs uppercase tracking-wider text-teal-700 font-semibold mb-3 flex items-center gap-2"><Phone className="size-3.5" /> Admissions</div>
                                <ul className="space-y-1.5 text-sm">
                                    {inst!.contacts.map((c) => {
                                        const Icon = icon(c.type);
                                        const href = contactHref(c.type, c.value);
                                        return (
                                            <li key={c.id}>
                                                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-teal-50 transition">
                                                    <Icon className="size-3.5 text-teal-600" />
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

            <footer className="px-5 md:px-10 py-6 text-xs md:text-sm text-slate-500 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
