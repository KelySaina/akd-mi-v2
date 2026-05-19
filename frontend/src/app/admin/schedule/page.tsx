'use client';
import { Topbar } from '@/components/Topbar';
import { Calendar, Sparkles } from 'lucide-react';

export default function SchedulePage() {
  return (
    <>
      <Topbar title="Schedule" />
      <main className="p-6 lg:p-8 max-w-5xl w-full mx-auto">
        <ComingSoon icon={Calendar} title="Schedule" blurb="Build weekly time tables, assign rooms and teachers, and publish to students." />
      </main>
    </>
  );
}

function ComingSoon({ icon: Icon, title, blurb }: { icon: any; title: string; blurb: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-12 text-center relative overflow-hidden">
      <div className="absolute -top-20 -right-20 size-60 rounded-full bg-grad-brand opacity-10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-grad-brand opacity-10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto size-16 rounded-2xl bg-grad-brand grid place-items-center text-white shadow-xl shadow-brand-500/30">
          <Icon className="size-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-ink-500 max-w-md mx-auto">{blurb}</p>
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm">
          <Sparkles className="size-3.5" /> Coming soon
        </div>
      </div>
    </div>
  );
}
