'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, ExternalLink, Building2, Globe2, Sparkles, X } from 'lucide-react';

export type PublicInstance = {
    id: string;
    slug: string;
    name: string;
    category: string;
    description: string | null;
    city: string | null;
    country: string | null;
    logoUrl: string | null;
    publicUrl: string | null;
};

export type CategoryItem = { code: string; label: string };

export function DirectoryClient({
    instances,
    categories,
}: {
    instances: PublicInstance[];
    categories: CategoryItem[];
}) {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<string>('all');
    const [country, setCountry] = useState<string>('all');

    const countries = useMemo(() => {
        const set = new Set<string>();
        for (const i of instances) if (i.country) set.add(i.country);
        return [...set].sort();
    }, [instances]);

    const catLabel = (code: string) =>
        categories.find((c) => c.code === code)?.label ?? code;

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return instances.filter((i) => {
            if (cat !== 'all' && i.category !== cat) return false;
            if (country !== 'all' && i.country !== country) return false;
            if (!needle) return true;
            const hay = [
                i.name,
                i.slug,
                i.city ?? '',
                i.country ?? '',
                i.description ?? '',
                catLabel(i.category),
            ].join(' ').toLowerCase();
            return hay.includes(needle);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, cat, country, instances]);

    const hasFilters = q !== '' || cat !== 'all' || country !== 'all';

    function clearFilters() {
        setQ('');
        setCat('all');
        setCountry('all');
    }

    return (
        <>
            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-[var(--border)]">
                <div className="absolute inset-0 -z-10 opacity-[0.18] dark:opacity-[0.25] gradient-brand" />
                <div className="absolute inset-0 -z-10 [background-image:radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.25),transparent_50%)]" />

                <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur border border-[var(--border)] text-xs font-medium muted">
                        <Sparkles className="size-3.5 text-indigo-500" /> The AKD-MI institution directory
                    </div>
                    <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight">
                        Find your next{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-violet-500">
                            institution
                        </span>
                    </h1>
                    <p className="mt-4 text-base sm:text-lg muted max-w-2xl">
                        Browse and explore every school, training centre and university running on the
                        AKD-MI platform.
                    </p>

                    {/* Search bar */}
                    <div className="mt-8 max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 muted pointer-events-none" />
                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by name, city, country…"
                                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur text-[var(--ink)] text-base outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                            {q && (
                                <button
                                    type="button"
                                    onClick={() => setQ('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                                    aria-label="Clear search"
                                >
                                    <X className="size-4 muted" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                        <Stat icon={<Building2 className="size-4" />} value={instances.length} label="institutions" />
                        <Stat icon={<Globe2 className="size-4" />} value={countries.length} label="countries" />
                        <Stat icon={<Sparkles className="size-4" />} value={categories.length} label="categories" />
                    </div>
                </div>
            </section>

            {/* ── Filters ──────────────────────────────────────────────── */}
            <section className="border-b border-[var(--border)] bg-[var(--panel)]/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <FilterPill
                            active={cat === 'all'}
                            onClick={() => setCat('all')}
                            label="All categories"
                        />
                        {categories.map((c) => (
                            <FilterPill
                                key={c.code}
                                active={cat === c.code}
                                onClick={() => setCat(c.code)}
                                label={c.label}
                            />
                        ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-sm px-3"
                        >
                            <option value="all">All countries</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs muted hover:text-[var(--ink)] underline underline-offset-4"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Results ──────────────────────────────────────────────── */}
            <section className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex items-end justify-between mb-6">
                    <h2 className="text-lg font-semibold">
                        {filtered.length === instances.length
                            ? `${instances.length} institution${instances.length === 1 ? '' : 's'}`
                            : `${filtered.length} of ${instances.length} institution${instances.length === 1 ? '' : 's'}`}
                    </h2>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState hasFilters={hasFilters} onReset={clearFilters} />
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((i) => (
                            <li key={i.id}>
                                <InstanceCard inst={i} categoryLabel={catLabel(i.category)} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
    return (
        <div className="inline-flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[var(--ink)]">{value}</span>
            <span className="muted inline-flex items-center gap-1.5">{icon}{label}</span>
        </div>
    );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'h-9 px-3.5 rounded-full text-sm border transition-colors',
                active
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white border-transparent shadow-sm'
                    : 'border-[var(--border)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
            ].join(' ')}
        >
            {label}
        </button>
    );
}

function InstanceCard({ inst, categoryLabel }: { inst: PublicInstance; categoryLabel: string }) {
    const location = [inst.city, inst.country].filter(Boolean).join(', ');
    const initials = inst.name
        .split(/\s+/).filter(Boolean).slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '').join('') || inst.slug[0]?.toUpperCase();

    const cardInner = (
        <article className="group h-full card overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
            {/* Cover gradient */}
            <div className="relative h-24 gradient-brand overflow-hidden">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/85 text-slate-700 backdrop-blur">
                    {categoryLabel}
                </span>
            </div>

            <div className="px-5 pb-5 -mt-8 relative">
                <div className="size-16 rounded-2xl bg-[var(--panel)] border border-[var(--border)] shadow-sm grid place-items-center text-2xl font-semibold text-indigo-600 dark:text-indigo-300 overflow-hidden">
                    {inst.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={inst.logoUrl} alt="" className="size-full object-cover" />
                        : initials}
                </div>

                <h3 className="mt-3 text-lg font-semibold leading-tight">
                    {inst.name}
                </h3>
                {location && (
                    <p className="mt-1 text-sm muted inline-flex items-center gap-1">
                        <MapPin className="size-3.5" /> {location}
                    </p>
                )}
                {inst.description && (
                    <p className="mt-3 text-sm muted line-clamp-2">{inst.description}</p>
                )}

                <div className="mt-4 flex items-center justify-between text-sm">
                    <code className="text-xs muted">{inst.slug}</code>
                    {inst.publicUrl && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-medium group-hover:gap-1.5 transition-all">
                            Visit <ExternalLink className="size-3.5" />
                        </span>
                    )}
                </div>
            </div>
        </article>
    );

    if (inst.publicUrl) {
        return (
            <a href={inst.publicUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
                {cardInner}
            </a>
        );
    }
    return cardInner;
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
    return (
        <div className="card p-12 text-center">
            <div className="mx-auto size-12 rounded-full bg-indigo-100 dark:bg-indigo-500/15 grid place-items-center text-indigo-600 dark:text-indigo-300 mb-4">
                <Search className="size-5" />
            </div>
            <h3 className="text-lg font-semibold">No institutions match your filters</h3>
            <p className="mt-1 muted text-sm">
                {hasFilters
                    ? 'Try a broader search or reset the filters.'
                    : 'No published institutions yet. Check back soon.'}
            </p>
            {hasFilters && (
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-medium hover:brightness-110"
                >
                    Reset filters
                </button>
            )}
        </div>
    );
}
