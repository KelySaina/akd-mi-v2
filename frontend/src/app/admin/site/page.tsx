'use client';
import { useEffect, useMemo, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/ui';
import { Check, ExternalLink, Loader2, Palette, Save, Sparkles, Paintbrush } from 'lucide-react';
import { api } from '@/lib/api';
import {
    LANDING_TEMPLATES, type LandingTemplateId,
    LANDING_THEME_PRESETS, type LandingThemePresetId,
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
                            <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
                                {LANDING_THEME_PRESETS.map((p) => {
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

function ThumbPreview({ tone, primary, accent }: { tone: 'dark' | 'light' | 'mono' | 'editorial' | 'vibrant' | 'corporate'; primary: string; accent: string }) {
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
