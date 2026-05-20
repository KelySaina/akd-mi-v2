'use client';
import { useState } from 'react';
import { Copy, Check, KeyRound } from 'lucide-react';

/** One-time generated-password reveal with copy-to-clipboard. */
export function PasswordReveal({ password, label }: { password: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('generated-password-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
        <KeyRound className="size-4 shrink-0 mt-0.5" />
        <span>{label ?? 'Shown only once. Copy and share it now — it cannot be recovered later.'}</span>
      </div>
      <div className="flex items-stretch gap-2">
        <code
          id="generated-password-text"
          className="flex-1 block px-3 py-2.5 bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-100 rounded-lg font-mono text-sm select-all break-all"
          onClick={(e) => {
            const range = document.createRange();
            range.selectNodeContents(e.currentTarget);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }}
        >
          {password}
        </code>
        <button
          onClick={copy}
          type="button"
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg text-sm font-medium transition border ${
            copied
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700'
          }`}
        >
          {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy</>}
        </button>
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400">Click the password to select it, or use the Copy button.</p>
    </div>
  );
}
