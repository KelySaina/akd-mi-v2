'use client';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open, onClose, title, children, footer, size = 'md',
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const maxW = {
    sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl',
    xl: 'max-w-3xl', '2xl': 'max-w-4xl', '3xl': 'max-w-5xl', '4xl': 'max-w-6xl',
  }[size];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full ${maxW} bg-white dark:bg-ink-900 rounded-2xl shadow-2xl border border-ink-200 dark:border-ink-800 overflow-hidden animate-in fade-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-ink-200 dark:border-ink-800">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"><X className="size-4" /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-3 bg-ink-50 dark:bg-ink-800/50 border-t border-ink-200 dark:border-ink-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function TextInput({
  label, value, onChange, type = 'text', required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}{required && <span className="text-rose-500"> *</span>}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 transition"
      />
    </label>
  );
}

export function SelectInput({
  label, value, onChange, options, required, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}{required && <span className="text-rose-500"> *</span>}</span>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/30 transition"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Button({
  children, onClick, variant = 'primary', type = 'button', disabled,
}: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean }) {
  const cls =
    variant === 'primary'  ? 'bg-grad-brand text-white shadow-md shadow-brand-500/25 hover:shadow-brand-500/40' :
    variant === 'danger'   ? 'bg-rose-600 text-white hover:bg-rose-700' :
                             'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition active:scale-[0.98] disabled:opacity-60 ${cls}`}
    >
      {children}
    </button>
  );
}
