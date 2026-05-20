'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/ui';
import { Check, ExternalLink, Loader2, Palette, Save, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { LANDING_TEMPLATES, type LandingTemplateId } from '@/components/landing/types';

type InstSettings = { landingTemplate?: LandingTemplateId } & Record<string, any>;

export default function SitePage() {
    const [current, setCurrent] = useState<LandingTemplateId>('classic');
    const [selected, setSelected] = useState<LandingTemplateId>('classic');
    const [settings, setSettings] = useState<InstSettings>({});
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
                setSettings(s);
                setCurrent(tpl);
                setSelected(tpl);
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function apply() {
        if (selected === current) return;
        setSaving(true);
        setError(null);
        try {
            const next = { ...settings, landingTemplate: selected };
            await api.patch('/institution', { settings: next });
            setSettings(next);
            setCurrent(selected);
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
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Landing page template</h2>
                            <p className="text-sm text-white/80">Choose how your public homepage looks. Changes apply instantly.</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => <div key={i} className="h-72 rounded-2xl shimmer" />)}
                    </div>
                ) : (
                    <>
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
                                        <ThumbPreview tone={t.tone} />
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-1">
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
                                                href={`/?template=${t.id}`}
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

                        <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-3 bg-white/95 dark:bg-ink-900/95 backdrop-blur border border-ink-200 dark:border-ink-800 rounded-2xl px-4 py-3 shadow-lg">
                            {saved && (
                                <span className="text-sm text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
                                    <Check className="size-4" /> Applied
                                </span>
                            )}
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
                            >
                                <ExternalLink className="size-4" /> Open homepage
                            </a>
                            <Button onClick={apply} disabled={saving || selected === current}>
                                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                {selected === current ? 'No changes' : 'Apply template'}
                            </Button>
                        </div>
                    </>
                )}
            </main>
        </>
    );
}

function ThumbPreview({ tone }: { tone: 'dark' | 'light' | 'mono' }) {
    if (tone === 'dark') {
        return (
            <div className="aspect-[16/10] bg-ink-950 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(at 20% 30%, rgba(37,99,235,0.5), transparent 50%), radial-gradient(at 80% 20%, rgba(6,182,212,0.4), transparent 50%), radial-gradient(at 60% 80%, rgba(56,189,248,0.4), transparent 50%)' }} />
                <div className="relative p-4 h-full flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className="size-4 rounded bg-grad-brand" />
                        <div className="h-1.5 w-16 rounded bg-white/40" />
                        <div className="ml-auto h-2 w-8 rounded bg-white/20" />
                    </div>
                    <div className="mt-auto space-y-2">
                        <div className="h-3 w-28 rounded bg-white/80" />
                        <div className="h-2 w-40 rounded bg-white/30" />
                        <div className="flex gap-1.5 mt-2">
                            <div className="h-4 w-12 rounded bg-grad-brand" />
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
                <div className="absolute inset-x-0 top-0 h-2/3 bg-grad-brand opacity-90" />
                <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-transparent to-ink-50" />
                <div className="relative p-4 h-full flex flex-col items-center text-center">
                    <div className="size-6 rounded-lg bg-white shadow ring-2 ring-white" />
                    <div className="mt-2 h-2.5 w-24 rounded bg-white/90" />
                    <div className="mt-auto space-y-1.5">
                        <div className="h-1.5 w-32 rounded bg-ink-300 mx-auto" />
                        <div className="h-1.5 w-24 rounded bg-ink-300 mx-auto" />
                        <div className="flex gap-1.5 justify-center mt-2">
                            <div className="h-4 w-12 rounded bg-grad-brand" />
                            <div className="h-4 w-12 rounded bg-white border border-ink-300" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
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
