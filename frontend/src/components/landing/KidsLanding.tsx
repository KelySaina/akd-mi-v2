import {
    GraduationCap, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin,
    Smile, Sun, Palette, Heart, Sparkles,
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

export default function KidsLanding({ inst, name, category, primaryAddress, gallery }: LandingProps) {
    return (
        <main className="min-h-screen bg-sky-50 text-ink-900 overflow-x-hidden">
            {/* playful blobs */}
            <div className="fixed -top-20 -left-20 size-[24rem] rounded-full bg-yellow-300/40 blur-3xl pointer-events-none -z-10" />
            <div className="fixed top-40 -right-32 size-[28rem] rounded-full bg-pink-300/40 blur-3xl pointer-events-none -z-10" />
            <div className="fixed bottom-0 left-1/3 size-[24rem] rounded-full bg-emerald-300/40 blur-3xl pointer-events-none -z-10" />

            <header className="px-5 md:px-10 py-4 md:py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 rounded-full bg-white/80 backdrop-blur px-4 py-2 shadow-lg shadow-sky-300/30 border border-white">
                    <div className="flex items-center gap-3 min-w-0">
                        {inst?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inst.logoUrl} alt={name} className="size-10 rounded-full object-cover ring-4 ring-yellow-300/60 shrink-0" />
                        ) : (
                            <div className="size-10 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-sky-400 grid place-items-center text-white ring-4 ring-yellow-300/60 shrink-0">
                                <Smile className="size-5" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-extrabold tracking-tight truncate">{name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-ink-500 truncate">{category}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:block"><LandingNav hasGallery={gallery.length > 0} /></div>
                        <AccessCTA variant="nav" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-14 md:pb-20 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-pink-600 text-xs font-bold shadow-sm">
                        <Sparkles className="size-3.5" /> Learning is fun
                    </div>
                    <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1] text-ink-900">
                        Big <span className="text-pink-500">dreams</span><br />
                        start <span className="text-sky-500">small</span>!
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-ink-700 max-w-lg leading-relaxed">
                        {inst?.description ?? `At ${name} every child explores, plays, and grows in a safe, joyful environment.`}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <AccessCTA variant="hero" />
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 -rotate-6 rounded-[3rem] bg-gradient-to-br from-yellow-300 via-pink-300 to-sky-400 blur-2xl opacity-50 pointer-events-none" />
                    {inst?.coverUrl || inst?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.coverUrl ?? inst.logoUrl!} alt={name} className="relative w-full aspect-[4/3] object-cover rounded-[2.5rem] border-8 border-white shadow-2xl" />
                    ) : (
                        <div className="relative w-full aspect-[4/3] rounded-[2.5rem] border-8 border-white shadow-2xl bg-gradient-to-br from-yellow-300 via-pink-300 to-sky-400 grid place-items-center">
                            <GraduationCap className="size-32 text-white" />
                        </div>
                    )}
                    {/* floating stickers */}
                    <div className="absolute -top-4 -left-4 size-16 rounded-full bg-yellow-300 grid place-items-center shadow-lg rotate-[-12deg]">
                        <Sun className="size-8 text-yellow-700" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 size-16 rounded-full bg-pink-400 grid place-items-center shadow-lg rotate-[10deg]">
                        <Heart className="size-7 text-white" />
                    </div>
                </div>
            </section>

            {/* Activity cards */}
            <section className="max-w-6xl mx-auto px-5 md:px-10 pb-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <Activity color="bg-yellow-300" icon={Palette} label="Art & Crafts" />
                    <Activity color="bg-pink-300"   icon={Smile}   label="Story time" />
                    <Activity color="bg-sky-300"    icon={Sun}     label="Outdoor play" />
                    <Activity color="bg-emerald-300" icon={Heart}  label="Music" />
                </div>
            </section>

            {/* About */}
            {inst?.description && (
                <section id="about" className="max-w-4xl mx-auto px-5 md:px-10 pb-14 md:pb-20">
                    <div className="rounded-[2rem] bg-white p-8 md:p-12 shadow-xl border-4 border-yellow-200">
                        <div className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-4">About us</div>
                        <p className="text-lg md:text-xl leading-relaxed text-ink-700 whitespace-pre-line">{inst.description}</p>
                    </div>
                </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
                <section id="gallery" className="max-w-6xl mx-auto px-5 md:px-10 pb-14 md:pb-20">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Look at us!</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gallery.map((m, i) => (
                            <figure key={m.id} className={`rounded-3xl overflow-hidden border-4 border-white shadow-lg ${i % 3 === 1 ? 'rotate-1' : i % 3 === 2 ? '-rotate-1' : ''}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={m.url} alt={m.caption ?? name} className="aspect-square w-full object-cover" />
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" className="max-w-5xl mx-auto px-5 md:px-10 pb-14 md:pb-20">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-8">Come visit!</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {(inst?.addresses ?? []).length > 0 && (
                        <div className="rounded-3xl bg-white p-6 shadow-lg border-4 border-sky-200">
                            <div className="text-xs uppercase tracking-wider text-sky-700 font-bold flex items-center gap-2 mb-3"><MapPin className="size-3.5" /> Where</div>
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
                        <div className="rounded-3xl bg-white p-6 shadow-lg border-4 border-pink-200">
                            <div className="text-xs uppercase tracking-wider text-pink-700 font-bold flex items-center gap-2 mb-3"><Phone className="size-3.5" /> Say hi</div>
                            <ul className="space-y-1.5 text-sm">
                                {inst!.contacts.map((c) => {
                                    const Icon = icon(c.type);
                                    const href = contactHref(c.type, c.value);
                                    return (
                                        <li key={c.id}>
                                            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-2 py-1.5 rounded-full hover:bg-pink-50 transition">
                                                <Icon className="size-3.5 text-pink-600" />
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

            <footer className="px-5 md:px-10 py-6 text-xs md:text-sm text-ink-500 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-2">
                <span>© {new Date().getFullYear()} {name} 🎈</span>
                <span>Powered by AKD-MI</span>
            </footer>
        </main>
    );
}

function Activity({ color, icon: Icon, label }: { color: string; icon: any; label: string }) {
    return (
        <div className={`${color} rounded-3xl p-5 text-ink-900 shadow-md hover:-rotate-2 transition`}>
            <Icon className="size-7" />
            <div className="mt-2 font-extrabold tracking-tight">{label}</div>
        </div>
    );
}
