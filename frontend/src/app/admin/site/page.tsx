'use client';
import { useEffect, useMemo, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/ui';
import { Check, ExternalLink, Loader2, Palette, Save, Sparkles, Paintbrush } from 'lucide-react';
import { api } from '@/lib/api';
import {
    LANDING_TEMPLATES, type LandingTemplateId, type LandingTone,
    LANDING_THEME_PRESETS, type LandingThemePresetId,
    LANDING_THEME_FAMILIES,
    type LandingThemeSettings,
    resolveTheme, isHex,
} from '@/components/landing/types';

type InstSettings = {
    landingTemplate?: LandingTemplateId;
    landingTheme?: LandingThemeSettings | string;
} & Record<string, any>;

export default function SitePage() {
    const [current, setCurrent] = useState<LandingTemplateId>('classic');
    const [selected, setSelected] = useState<LandingTemplateId>('classic');
    const [settings, setSettings] = useState<InstSettings>({});

    // Theme state
    const [savedPreset, setSavedPreset] = useState<LandingThemePresetId>('ocean');
    const [savedPrimary, setSavedPrimary] = useState('#2563eb');
    const [savedAccent, setSavedAccent] = useState('#06b6d4');
    const [preset, setPreset] = useState<LandingThemePresetId>('ocean');
    const [primary, setPrimary] = useState('#2563eb');
    const [accent, setAccent] = useState('#06b6d4');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const inst = await api.get('/institution');
                const s: InstSettings = inst?.settings ?? {};
                const tpl: LandingTemplateId = (s.landingTemplate as LandingTemplateId) ?? 'classic';
                const theme = resolveTheme(s.landingTheme);
                setSettings(s);
                setCurrent(tpl);
                setSelected(tpl);
                setSavedPreset(theme.preset);
                setSavedPrimary(theme.primary);
                setSavedAccent(theme.accent);
                setPreset(theme.preset);
                setPrimary(theme.primary);
                setAccent(theme.accent);
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const themeChanged =
        preset !== savedPreset ||
        (preset === 'custom' && (primary.toLowerCase() !== savedPrimary.toLowerCase() || accent.toLowerCase() !== savedAccent.toLowerCase()));
    const templateChanged = selected !== current;
    const dirty = themeChanged || templateChanged;

    const previewHref = useMemo(() => {
        const qs = new URLSearchParams();
        if (selected) qs.set('template', selected);
        if (preset === 'custom') {
            if (isHex(primary)) qs.set('primary', primary);
            if (isHex(accent)) qs.set('accent', accent);
        } else {
            qs.set('theme', preset);
        }
        return `/?${qs.toString()}`;
    }, [selected, preset, primary, accent]);

    function selectPreset(id: LandingThemePresetId) {
        setPreset(id);
        if (id !== 'custom') {
            const p = LANDING_THEME_PRESETS.find((x) => x.id === id);
            if (p) { setPrimary(p.primary); setAccent(p.accent); }
        }
    }

    async function apply() {
        if (!dirty) return;
        if (preset === 'custom' && (!isHex(primary) || !isHex(accent))) {
            setError('Custom colors must be valid HEX (e.g. #2563eb).');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const themePayload: LandingThemeSettings =
                preset === 'custom' ? { preset: 'custom', primary, accent } : { preset };
            const next = { ...settings, landingTemplate: selected, landingTheme: themePayload };
            await api.patch('/institution', { settings: next });
            setSettings(next);
            setCurrent(selected);
            setSavedPreset(preset);
            setSavedPrimary(primary);
            setSavedAccent(accent);
            setSaved(true);
            setTimeout(() => setSaved(false), 2200);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Topbar title="Site builder" />
            <main className="p-4 lg:p-6 max-w-6xl w-full mx-auto">
                <div className="rounded-2xl bg-grad-brand text-white px-5 py-4 mb-5 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
                            <Palette className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Site appearance</h2>
                            <p className="text-sm text-white/80">Pick a landing template and a color theme. Both apply instantly to your public homepage.</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-72 rounded-2xl shimmer" />)}
                    </div>
                ) : (
                    <>
                        {/* Templates */}
                        <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-200 mb-3 mt-2">Landing template</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {LANDING_TEMPLATES.map((t) => {
                                const isSelected = selected === t.id;
                                const isCurrent = current === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelected(t.id)}
                                        className={`text-left rounded-2xl border-2 transition overflow-hidden bg-white dark:bg-ink-900 ${isSelected ? 'border-brand-500 shadow-lg shadow-brand-500/20' : 'border-ink-200 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700'}`}
                                    >
                                        <ThumbPreview tone={t.tone} primary={primary} accent={accent} />
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-semibold">{t.name}</h3>
                                                {isCurrent && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                        <Check className="size-3" /> Active
                                                    </span>
                                                )}
                                                {isSelected && !isCurrent && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30">
                                                        <Sparkles className="size-3" /> Selected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-ink-500 dark:text-ink-400">{t.description}</p>
                                            <a
                                                href={`/?template=${t.id}${preset === 'custom' ? `&primary=${encodeURIComponent(primary)}&accent=${encodeURIComponent(accent)}` : `&theme=${preset}`}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                                            >
                                                Live preview <ExternalLink className="size-3" />
                                            </a>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Colors */}
                        <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-200 mb-3 mt-8 flex items-center gap-2">
                            <Paintbrush className="size-4" /> Color theme
                        </h3>
                        <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 sm:p-5">
                            {LANDING_THEME_FAMILIES.map((fam) => {
                                const items = LANDING_THEME_PRESETS.filter((p) => p.family === fam.id);
                                if (items.length === 0) return null;
                                return (
                                    <div key={fam.id} className="mb-5 last:mb-0">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-200">{fam.name}</h4>
                                            <span className="text-[11px] text-ink-500 dark:text-ink-400">{fam.description}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                            {items.map((p) => {
                                                const isSel = preset === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => selectPreset(p.id)}
                                                        className={`group flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 border-2 transition ${isSel ? 'border-ink-900 dark:border-ink-100 bg-ink-50 dark:bg-ink-800' : 'border-ink-200 dark:border-ink-800 hover:border-ink-400 dark:hover:border-ink-600'}`}
                                                        title={p.name}
                                                    >
                                                        <span className="flex -space-x-2">
                                                            <span className="size-5 rounded-full ring-2 ring-white dark:ring-ink-900" style={{ background: p.primary }} />
                                                            <span className="size-5 rounded-full ring-2 ring-white dark:ring-ink-900" style={{ background: p.accent }} />
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-medium">{p.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="mb-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-200 mb-2">Your own</h4>
                                <button
                                    type="button"
                                    onClick={() => selectPreset('custom')}
                                    className={`flex items-center gap-2 rounded-full pl-3 pr-3 py-1.5 border-2 transition ${preset === 'custom' ? 'border-ink-900 dark:border-ink-100 bg-ink-50 dark:bg-ink-800' : 'border-dashed border-ink-300 dark:border-ink-700 hover:border-ink-400 dark:hover:border-ink-600'}`}
                                    title="Custom"
                                >
                                    <Paintbrush className="size-4" />
                                    <span className="text-xs sm:text-sm font-medium">Custom</span>
                                </button>
                            </div>

                            {/* Custom HEX inputs */}
                            <div className={`grid sm:grid-cols-2 gap-4 ${preset === 'custom' ? '' : 'opacity-50 pointer-events-none'}`}>
                                <ColorField label="Primary"
                                    hex={primary}
                                    onChange={(v) => { setPrimary(v); if (preset !== 'custom') setPreset('custom'); }} />
                                <ColorField label="Accent"
                                    hex={accent}
                                    onChange={(v) => { setAccent(v); if (preset !== 'custom') setPreset('custom'); }} />
                            </div>

                            {/* Sample */}
                            <div className="mt-5 rounded-xl overflow-hidden border border-ink-200 dark:border-ink-800">
                                <div className="h-16 sm:h-20" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${accent} 100%)` }} />
                                <div className="px-4 py-3 flex items-center gap-3 bg-white dark:bg-ink-900">
                                    <span className="size-4 rounded-full" style={{ background: primary }} />
                                    <span className="text-xs font-mono text-ink-600 dark:text-ink-300">{primary.toUpperCase()}</span>
                                    <span className="text-ink-300 dark:text-ink-700">·</span>
                                    <span className="size-4 rounded-full" style={{ background: accent }} />
                                    <span className="text-xs font-mono text-ink-600 dark:text-ink-300">{accent.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sticky save bar */}
                        <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-3 bg-white/95 dark:bg-ink-900/95 backdrop-blur border border-ink-200 dark:border-ink-800 rounded-2xl px-4 py-3 shadow-lg">
                            {saved && (
                                <span className="text-sm text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
                                    <Check className="size-4" /> Applied
                                </span>
                            )}
                            <a
                                href={previewHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
                            >
                                <ExternalLink className="size-4" /> Preview
                            </a>
                            <Button onClick={apply} disabled={saving || !dirty}>
                                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                {dirty ? 'Apply changes' : 'No changes'}
                            </Button>
                        </div>
                    </>
                )}
            </main>
        </>
    );
}

function ColorField({ label, hex, onChange }: { label: string; hex: string; onChange: (v: string) => void }) {
    const valid = isHex(hex);
    return (
        <label className="block">
            <span className="block text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1.5">{label}</span>
            <div className={`flex items-center gap-2 rounded-lg border ${valid ? 'border-ink-200 dark:border-ink-800' : 'border-rose-400 dark:border-rose-500/50'} bg-white dark:bg-ink-950 px-2 py-1.5`}>
                <input
                    type="color"
                    value={valid ? hex : '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="size-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                    type="text"
                    value={hex}
                    onChange={(e) => onChange(e.target.value.trim())}
                    placeholder="#2563eb"
                    className="flex-1 bg-transparent outline-none text-sm font-mono"
                    spellCheck={false}
                />
            </div>
        </label>
    );
}

function ThumbPreview({ tone, primary, accent }: { tone: LandingTone; primary: string; accent: string }) {
    const grad = `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${accent} 100%)`;
    if (tone === 'dark') {
        return (
            <div className="aspect-[16/10] bg-ink-950 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(at 20% 30%, ${primary}80, transparent 50%), radial-gradient(at 80% 20%, ${accent}66, transparent 50%), radial-gradient(at 60% 80%, ${accent}66, transparent 50%)` }} />
                <div className="relative p-4 h-full flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className="size-4 rounded" style={{ background: grad }} />
                        <div className="h-1.5 w-16 rounded bg-white/40" />
                        <div className="ml-auto h-2 w-8 rounded bg-white/20" />
                    </div>
                    <div className="mt-auto space-y-2">
                        <div className="h-3 w-28 rounded bg-white/80" />
                        <div className="h-2 w-40 rounded bg-white/30" />
                        <div className="flex gap-1.5 mt-2">
                            <div className="h-4 w-12 rounded" style={{ background: grad }} />
                            <div className="h-4 w-12 rounded bg-white/20 border border-white/30" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'light') {
        return (
            <div className="aspect-[16/10] bg-ink-50 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-2/3 opacity-90" style={{ background: grad }} />
                <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-transparent to-ink-50" />
                <div className="relative p-4 h-full flex flex-col items-center text-center">
                    <div className="size-6 rounded-lg bg-white shadow ring-2 ring-white" />
                    <div className="mt-2 h-2.5 w-24 rounded bg-white/90" />
                    <div className="mt-auto space-y-1.5">
                        <div className="h-1.5 w-32 rounded bg-ink-300 mx-auto" />
                        <div className="h-1.5 w-24 rounded bg-ink-300 mx-auto" />
                        <div className="flex gap-1.5 justify-center mt-2">
                            <div className="h-4 w-12 rounded" style={{ background: grad }} />
                            <div className="h-4 w-12 rounded bg-white border border-ink-300" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'mono') {
        return (
            <div className="aspect-[16/10] bg-white relative overflow-hidden border-b border-ink-200">
                <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center gap-2 pb-2 border-b border-ink-200">
                        <div className="size-3 rounded border border-ink-400" />
                        <div className="h-1.5 w-14 rounded bg-ink-700" />
                    </div>
                    <div className="mt-auto space-y-2">
                        <div className="h-1 w-10 rounded bg-ink-400" />
                        <div className="h-4 w-36 rounded bg-ink-900" />
                        <div className="h-1.5 w-28 rounded bg-ink-500" />
                        <div className="h-px w-12 bg-ink-900 mt-2" />
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'editorial') {
        return (
            <div className="aspect-[16/10] bg-[#fbfaf7] relative overflow-hidden border-b border-ink-200">
                <div className="p-3 h-full flex flex-col">
                    <div className="border-b-2 border-ink-900 pb-1.5 text-center">
                        <div className="h-2.5 w-20 rounded bg-ink-900 mx-auto" />
                        <div className="mt-1 h-1 w-12 rounded bg-ink-500 mx-auto" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2 mt-2">
                        <div className="space-y-1">
                            <div className="h-1 w-10 rounded bg-ink-500" />
                            <div className="h-1 w-12 rounded bg-ink-500" />
                            <div className="h-1 w-9 rounded bg-ink-500" />
                            <div className="h-1 w-11 rounded bg-ink-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-1 w-10 rounded bg-ink-500" />
                            <div className="h-1 w-11 rounded bg-ink-500" />
                            <div className="h-1 w-9 rounded bg-ink-500" />
                            <div className="h-1 w-12 rounded bg-ink-500" />
                        </div>
                    </div>
                    <div className="h-3 w-3 rounded-sm absolute bottom-3 left-3" style={{ background: primary }} />
                </div>
            </div>
        );
    }
    if (tone === 'vibrant') {
        return (
            <div className="aspect-[16/10] bg-white relative overflow-hidden">
                <div className="absolute top-3 right-3 size-12 rounded-full" style={{ background: grad }} />
                <div className="absolute bottom-4 right-8 size-6 rounded-full" style={{ background: accent }} />
                <div className="relative p-4 h-full flex flex-col">
                    <div className="rounded-full bg-white/90 border-2 border-ink-900 px-2 py-1 inline-flex items-center gap-1 self-start shadow-[3px_3px_0_0_rgba(15,23,42,0.9)]">
                        <div className="size-2.5 rounded-full" style={{ background: grad }} />
                        <div className="h-1 w-8 rounded bg-ink-900" />
                    </div>
                    <div className="mt-auto space-y-1">
                        <div className="h-1.5 w-12 rounded bg-ink-900" />
                        <div className="h-4 w-32 rounded" style={{ background: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                            <span className="font-black text-sm">WELCOME</span>
                        </div>
                        <div className="h-3 w-12 rounded border-2 border-ink-900 mt-1" />
                    </div>
                </div>
            </div>
        );
    }
    // corporate
    if (tone === 'corporate') {
        return (
            <div className="aspect-[16/10] bg-ink-50 relative overflow-hidden border-b border-ink-200">
                <div className="h-3 bg-ink-900 flex items-center px-2 gap-1">
                    <div className="size-1.5 rounded-full" style={{ background: accent }} />
                    <div className="h-0.5 w-12 rounded bg-white/60" />
                </div>
                <div className="p-3 h-full">
                    <div className="flex items-center gap-2 pb-2 border-b border-ink-200">
                        <div className="size-3 rounded-sm" style={{ background: primary }} />
                        <div className="h-1.5 w-16 rounded bg-ink-900" />
                    </div>
                    <div className="mt-3 pl-2 border-l-2" style={{ borderColor: primary }}>
                        <div className="h-1 w-12 rounded mb-1" style={{ background: primary }} />
                        <div className="h-3 w-28 rounded bg-ink-900" />
                        <div className="h-1 w-24 rounded bg-ink-500 mt-1.5" />
                        <div className="h-1 w-20 rounded bg-ink-500 mt-1" />
                    </div>
                    <div className="absolute bottom-2 right-2 grid grid-cols-3 gap-1">
                        <div className="h-1 w-3 rounded" style={{ background: primary }} />
                        <div className="h-1 w-3 rounded" style={{ background: primary }} />
                        <div className="h-1 w-3 rounded" style={{ background: primary }} />
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'academic') {
        return (
            <div className="aspect-[16/10] bg-[#fbf8f1] relative overflow-hidden" style={{ fontFamily: 'serif' }}>
                <div className="absolute inset-x-3 top-2 border-b-2 border-double" style={{ borderColor: primary, opacity: 0.5 }} />
                <div className="p-3 h-full flex flex-col items-center text-center justify-center">
                    <div className="size-5 rounded-full ring-2 ring-amber-400/50" style={{ background: primary }} />
                    <div className="mt-2 h-2 w-1 rounded" style={{ background: primary, height: '0.5rem' }} />
                    <div className="flex items-center gap-1 mt-1">
                        <div className="h-px w-4" style={{ background: primary }} />
                        <div className="h-1 w-10 rounded bg-ink-900" />
                        <div className="h-px w-4" style={{ background: primary }} />
                    </div>
                    <div className="mt-2 h-3 w-32 rounded bg-ink-900" />
                    <div className="mt-1.5 h-1 w-20 rounded italic bg-ink-500" />
                </div>
                <div className="absolute inset-x-3 bottom-2 border-t-2 border-double" style={{ borderColor: primary, opacity: 0.5 }} />
            </div>
        );
    }
    if (tone === 'tech') {
        return (
            <div className="aspect-[16/10] bg-[#0a0f1c] relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(16,185,129,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.18) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                    }}
                />
                <div className="relative p-3 h-full flex flex-col text-emerald-300">
                    <div className="flex items-center gap-1">
                        <div className="size-2 rounded-full bg-red-500/70" />
                        <div className="size-2 rounded-full bg-amber-400/70" />
                        <div className="size-2 rounded-full bg-emerald-500/70" />
                    </div>
                    <div className="mt-2 space-y-1.5 font-mono text-[8px]">
                        <div className="flex items-center gap-1"><span className="text-emerald-500">$</span><div className="h-1 w-14 rounded bg-emerald-400/70" /></div>
                        <div className="h-1 w-20 rounded bg-emerald-300/40" />
                        <div className="flex items-center gap-1"><span className="text-emerald-500">$</span><div className="h-1 w-10 rounded bg-emerald-400/70" /></div>
                    </div>
                    <div className="mt-auto">
                        <div className="h-3 w-32 rounded bg-emerald-400" />
                        <div className="flex items-center gap-1 mt-1.5">
                            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <div className="h-1 w-8 rounded bg-emerald-300/60" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'art') {
        return (
            <div className="aspect-[16/10] bg-stone-50 relative overflow-hidden border-b border-stone-900">
                <div className="p-3 h-full grid grid-cols-12 gap-2">
                    <div className="col-span-7 flex flex-col">
                        <div className="h-1 w-10 bg-stone-500" />
                        <div className="mt-auto space-y-0.5">
                            <div className="h-3 w-20 bg-stone-900" />
                            <div className="h-3 w-16 bg-stone-900" />
                            <div className="h-3 w-24" style={{ background: accent }} />
                        </div>
                    </div>
                    <div className="col-span-5" style={{ background: primary }} />
                </div>
                <div className="absolute bottom-0 inset-x-0 h-3 grid grid-cols-4 divide-x divide-stone-900 border-t border-stone-900">
                    <div /><div /><div /><div />
                </div>
            </div>
        );
    }
    if (tone === 'boutique') {
        return (
            <div className="aspect-[16/10] bg-white relative overflow-hidden">
                <div className="h-2" style={{ background: grad }} />
                <div className="p-3 h-full">
                    <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-full" style={{ background: grad }} />
                        <div className="h-1 w-10 rounded bg-ink-900" />
                        <div className="ml-auto h-1.5 w-8 rounded-full" style={{ background: primary }} />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                        <div className="rounded border border-ink-200 p-1">
                            <div className="aspect-square rounded" style={{ background: `${primary}33` }} />
                            <div className="mt-1 h-0.5 w-6 rounded bg-ink-900" />
                        </div>
                        <div className="rounded border border-ink-200 p-1">
                            <div className="aspect-square rounded" style={{ background: `${accent}33` }} />
                            <div className="mt-1 h-0.5 w-5 rounded bg-ink-900" />
                        </div>
                        <div className="rounded border border-ink-200 p-1">
                            <div className="aspect-square rounded" style={{ background: `${primary}44` }} />
                            <div className="mt-1 h-0.5 w-6 rounded bg-ink-900" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'salon') {
        return (
            <div className="aspect-[16/10] relative overflow-hidden bg-[#fdf7f3]" style={{ fontFamily: 'serif' }}>
                <div className="absolute -top-6 -right-6 size-20 rounded-full bg-rose-200/60 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 size-24 rounded-full bg-amber-200/60 blur-2xl" />
                <div className="relative p-3 h-full flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-full ring-2 ring-amber-300/60" style={{ background: grad }} />
                        <div className="h-1 w-10 rounded bg-[#3c2a1f]" />
                    </div>
                    <div className="mt-auto">
                        <div className="h-2.5 w-24 rounded bg-[#3c2a1f]" />
                        <div className="h-2.5 w-16 rounded italic" style={{ background: primary, opacity: 0.85 }} />
                        <div className="mt-1.5 flex gap-1">
                            <div className="h-3 w-10 rounded-full" style={{ background: grad }} />
                            <div className="h-3 w-10 rounded-full bg-white border border-rose-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'kids') {
        return (
            <div className="aspect-[16/10] bg-sky-50 relative overflow-hidden">
                <div className="absolute -top-4 -left-4 size-16 rounded-full bg-yellow-300/60 blur-xl" />
                <div className="absolute top-6 -right-6 size-20 rounded-full bg-pink-300/60 blur-xl" />
                <div className="absolute -bottom-6 left-10 size-16 rounded-full bg-emerald-300/60 blur-xl" />
                <div className="relative p-3 h-full flex flex-col">
                    <div className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 self-start shadow">
                        <div className="size-2.5 rounded-full" style={{ background: grad }} />
                        <div className="h-1 w-8 rounded bg-ink-900" />
                    </div>
                    <div className="mt-auto">
                        <div className="h-3 w-20 rounded bg-pink-500" />
                        <div className="h-3 w-16 rounded bg-sky-500 mt-0.5" />
                        <div className="mt-2 grid grid-cols-4 gap-1">
                            <div className="h-3 rounded-xl bg-yellow-300" />
                            <div className="h-3 rounded-xl bg-pink-300" />
                            <div className="h-3 rounded-xl bg-sky-300" />
                            <div className="h-3 rounded-xl bg-emerald-300" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'culinary') {
        return (
            <div className="aspect-[16/10] bg-[#fbf4e8] relative overflow-hidden" style={{ fontFamily: 'Georgia, serif' }}>
                <div className="p-3 h-full grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <div className="size-3 rounded-full bg-[#3c2415] mb-2" />
                        <div className="mt-auto space-y-1">
                            <div className="h-1 w-8 rounded bg-[#b07a3e]" />
                            <div className="h-3 w-20 rounded bg-[#3c2415]" />
                            <div className="h-1 w-14 rounded italic" style={{ background: primary, opacity: 0.7 }} />
                        </div>
                    </div>
                    <div className="rounded-xl bg-[#b07a3e] grid place-items-center text-[#fbf4e8]">
                        <div className="size-6 rounded-full ring-2 ring-amber-300/60" style={{ background: grad }} />
                    </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-2 bg-[#3c2415]" />
            </div>
        );
    }
    if (tone === 'sports') {
        return (
            <div className="aspect-[16/10] bg-ink-950 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10 text-white"
                    style={{ backgroundImage: 'repeating-linear-gradient(-45deg, currentColor 0 2px, transparent 2px 12px)' }}
                />
                <div className="relative p-3 h-full flex flex-col text-white">
                    <div className="text-[8px] uppercase tracking-[0.3em] text-amber-400">No excuses</div>
                    <div className="mt-1 leading-none font-black uppercase">
                        <div className="text-base">TRAIN.</div>
                        <div className="text-base">COMPETE.</div>
                        <div className="text-base text-amber-400">CONQUER.</div>
                    </div>
                    <div className="mt-auto flex items-center gap-1.5">
                        <div className="h-3 w-10 rounded bg-amber-400" />
                        <div className="h-3 w-10 rounded border border-amber-400" />
                    </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />
            </div>
        );
    }
    if (tone === 'music') {
        return (
            <div className="aspect-[16/10] bg-[#0a0612] relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(244,114,182,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(168,85,247,0.25), transparent 60%)' }} />
                <div className="relative p-3 h-full grid grid-cols-2 gap-2">
                    <div className="flex flex-col text-white">
                        <div className="text-[8px] uppercase tracking-wider text-pink-300">Now playing</div>
                        <div className="mt-auto">
                            <div className="h-2.5 w-16 rounded bg-white" />
                            <div className="h-2.5 w-12 rounded mt-0.5" style={{ background: 'linear-gradient(90deg, #f472b6, #a78bfa, #67e8f9)' }} />
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative size-14 rounded-full bg-black border border-white/20" style={{ background: 'repeating-radial-gradient(circle at center, #18121e 0 2px, #0a0612 2px 4px)' }}>
                            <div className="absolute inset-0 m-auto size-5 rounded-full" style={{ background: grad }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'language') {
        return (
            <div className="aspect-[16/10] bg-white relative overflow-hidden">
                <div className="p-3 h-full grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <div className="size-3 rounded-lg" style={{ background: grad }} />
                        <div className="mt-auto leading-tight">
                            <div className="text-sm font-extrabold">Hello.</div>
                            <div className="text-sm font-extrabold text-sky-600">Bonjour.</div>
                            <div className="text-sm font-extrabold text-indigo-600">Hola.</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 content-center">
                        <div className="aspect-square rounded bg-sky-100 grid place-items-center text-[10px]">🇬🇧</div>
                        <div className="aspect-square rounded bg-indigo-100 grid place-items-center text-[10px]">🇫🇷</div>
                        <div className="aspect-square rounded bg-pink-100 grid place-items-center text-[10px]">🇪🇸</div>
                        <div className="aspect-square rounded bg-sky-100 grid place-items-center text-[10px]">🇯🇵</div>
                        <div className="aspect-square rounded bg-indigo-100 grid place-items-center text-[10px]">🇩🇪</div>
                        <div className="aspect-square rounded bg-pink-100 grid place-items-center text-[10px]">🇮🇹</div>
                    </div>
                </div>
            </div>
        );
    }
    if (tone === 'medical') {
        return (
            <div className="aspect-[16/10] bg-gradient-to-b from-teal-50 to-white relative overflow-hidden">
                <div className="p-3 h-full flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-md bg-teal-500 grid place-items-center text-white">
                            <span className="text-[8px] font-black">+</span>
                        </div>
                        <div className="h-1 w-10 rounded bg-slate-900" />
                    </div>
                    <div className="mt-auto">
                        <div className="h-2.5 w-20 rounded bg-slate-900" />
                        <div className="h-2.5 w-14 rounded bg-teal-500 mt-0.5" />
                        <svg className="mt-2 h-4 w-full text-teal-500" viewBox="0 0 200 20" fill="none" preserveAspectRatio="none">
                            <path d="M0 10 L60 10 L70 3 L80 17 L90 10 L120 10 L130 1 L140 19 L150 10 L200 10" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }
    // agri
    return (
        <div className="aspect-[16/10] bg-[#f5f3e7] relative overflow-hidden">
            <div className="absolute -top-6 -right-6 size-20 rounded-full bg-amber-300/40 blur-2xl" />
            <div className="absolute -bottom-8 -left-6 size-24 rounded-full bg-emerald-400/40 blur-2xl" />
            <div className="relative p-3 h-full grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                    <div className="size-3 rounded-full bg-emerald-700" />
                    <div className="mt-auto">
                        <div className="h-2.5 w-20 rounded bg-emerald-800" />
                        <div className="h-2.5 w-16 rounded italic bg-amber-700 mt-0.5" />
                    </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-600" />
            </div>
            <div className="absolute bottom-1.5 left-3 right-3 flex gap-1">
                <div className="h-1 flex-1 rounded bg-emerald-700/40" />
                <div className="h-1 flex-1 rounded bg-emerald-700/40" />
                <div className="h-1 flex-1 rounded bg-emerald-700/40" />
            </div>
        </div>
    );
}
