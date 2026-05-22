import {
    MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Languages, MessageCircle, BookOpen, Plane,
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

const GREETINGS = [
    { hi: 'Hello',    lang: 'English',    flag: '🇬🇧' },
    { hi: 'Bonjour',  lang: 'Français',   flag: '🇫🇷' },
    { hi: 'Hola',     lang: 'Español',    flag: '🇪🇸' },
    { hi: '你好',     lang: '中文',        flag: '🇨🇳' },
    { hi: 'こんにちは', lang: '日本語',     flag: '🇯🇵' },
    { hi: 'مرحبا',    lang: 'العربية',    flag: '🇸🇦' },
    { hi: 'Olá',      lang: 'Português',  flag: '🇵🇹' },
    { hi: 'Привет',   lang: 'Русский',    flag: '🇷🇺' },
    { hi: 'Hallo',    lang: 'Deutsch',    flag: '🇩🇪' },
    { hi: 'Ciao',     lang: 'Italiano',   flag: '🇮🇹' },
    { hi: 'Salam',    lang: 'Bahasa',     flag: '🇮🇩' },
    { hi: 'Jambo',    lang: 'Swahili',    flag: '🇰🇪' },
];

export default function LanguageLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-white text-ink-900">
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 md:px-10 py-3 md:py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 rounded-xl object-cover shrink-0" />
                        ) : (
                            <div className="size-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 grid place-items-center text-white shadow shrink-0">
                                <Languages className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-bold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-ink-500 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block text-ink-700"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-5 md:px-10 pt-12 md:pt-20 pb-10 md:pb-16">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
                            <Plane className="size-3.5" /> Speak the world
                        </div>
                        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                            Hello. <span className="text-sky-600">Bonjour.</span> <span className="text-indigo-600">Hola.</span> <span className="text-pink-600">你好.</span>
                        </h1>
                        <p className="mt-5 text-lg text-ink-600 max-w-lg">
                            {inst?.description ?? `At ${name}, every conversation is a passport. Learn, speak, connect.`}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <AccessCTA variant="hero" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {GREETINGS.map((g, i) => (
                            <div
                                key={i}
                                className={`rounded-2xl p-3 md:p-4 text-center border ${i % 3 === 0 ? 'bg-sky-50 border-sky-200' : i % 3 === 1 ? 'bg-indigo-50 border-indigo-200' : 'bg-pink-50 border-pink-200'} hover:scale-105 transition`}
                            >
                                <div className="text-2xl md:text-3xl">{g.flag}</div>
                                <div className="mt-1 font-bold text-sm md:text-base truncate">{g.hi}</div>
                                <div className="text-[10px] uppercase tracking-wider text-ink-500 truncate">{g.lang}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="about" className="bg-ink-50 border-y border-ink-200 py-14 md:py-20">
                <div className="max-w-6xl mx-auto px-5 md:px-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-10">How you learn at {name}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: MessageCircle, t: 'Small classes', d: 'Max 8 students per room.' },
                            { icon: Languages,    t: 'Native teachers', d: 'Certified instructors only.' },
                            { icon: BookOpen,     t: 'Real materials', d: 'Books, podcasts, films.' },
                            { icon: Plane,        t: 'Cultural trips', d: 'Immersion abroad each year.' },
                        ].map((c, i) => (
                            <div key={i} className="rounded-2xl border border-ink-200 bg-white p-5">
                                <c.icon className="size-7 text-sky-600" />
                                <h3 className="mt-3 text-lg font-bold tracking-tight">{c.t}</h3>
                                <p className="mt-1 text-sm text-ink-600">{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {gallery.length > 0 && (
                <section id="gallery" className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-20">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center mb-8">Around the school</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gallery.map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={m.id} src={m.url} alt={m.caption ?? name} className="aspect-[4/3] w-full object-cover rounded-2xl border border-ink-200" />
                        ))}
                    </div>
                </section>
            )}

            <section id="contact" className="bg-ink-50 border-t border-ink-200 py-14 md:py-20">
                <div className="max-w-5xl mx-auto px-5 md:px-10">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center mb-10">Say hello</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(inst?.addresses ?? []).length > 0 && (
                            <div className="rounded-2xl border border-ink-200 bg-white p-6">
                                <div className="text-xs uppercase tracking-wider text-sky-700 font-semibold mb-3 flex items-center gap-2"><MapPin className="size-3.5" /> Campus</div>
                                <ul className="space-y-3 text-sm">
                                    {inst!.addresses.map((a) => (
                                        <li key={a.id}>
                                            <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                                            <div className="text-ink-600">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')} — {a.country}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(inst?.contacts ?? []).length > 0 && (
                            <div className="rounded-2xl border border-ink-200 bg-white p-6">
                                <div className="text-xs uppercase tracking-wider text-sky-700 font-semibold mb-3 flex items-center gap-2"><Phone className="size-3.5" /> Reach us</div>
                                <ul className="space-y-1.5 text-sm">
                                    {inst!.contacts.map((c) => {
                                        const Icon = icon(c.type);
                                        const href = contactHref(c.type, c.value);
                                        return (
                                            <li key={c.id}>
                                                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-ink-50 transition">
                                                    <Icon className="size-3.5 text-sky-600" />
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

            <footer className="border-t border-ink-200 px-5 md:px-10 py-6 text-xs md:text-sm text-ink-500 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name}</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}
