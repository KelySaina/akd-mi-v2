'use client';
import { ReactNode, useEffect } from 'react';
import { X, AlertTriangle, Info, Sparkles } from 'lucide-react';

type ModalIntent = 'default' | 'primary' | 'danger' | 'info';

/**
 * Modal — supports an optional `description`, `icon`, `intent` and a sticky
 * footer. The body scrolls when content overflows; sizes are responsive.
 */
export function Modal({
  open, onClose, title, description, icon, intent = 'default',
  children, footer, size = 'lg', dismissOnBackdrop = true,
}: {
  open: boolean; onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  intent?: ModalIntent;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  dismissOnBackdrop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const maxW = {
    sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl',
    xl: 'max-w-3xl', '2xl': 'max-w-4xl', '3xl': 'max-w-5xl', '4xl': 'max-w-6xl',
  }[size];

  const intentBar = {
    default: 'bg-ink-300 dark:bg-ink-700',
    primary: 'bg-grad-brand',
    danger:  'bg-rose-500',
    info:    'bg-sky-500',
  }[intent];
  const intentIconWrap = {
    default: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
    primary: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    danger:  'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    info:    'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  }[intent];
  const defaultIcon =
    intent === 'danger' ? <AlertTriangle className="size-5" /> :
    intent === 'info'   ? <Info className="size-5" /> :
    intent === 'primary'? <Sparkles className="size-5" /> :
    null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-900/40 dark:bg-black/60 backdrop-blur-sm"
      onClick={() => dismissOnBackdrop && onClose()}
    >
      <div
        className={`w-full ${maxW} max-h-[90vh] flex flex-col bg-white dark:bg-ink-900 rounded-2xl shadow-2xl border border-ink-200 dark:border-ink-800 overflow-hidden animate-in fade-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Accent stripe communicates the modal's intent */}
        <div className={`h-1 w-full ${intentBar}`} />

        <div className="px-5 sm:px-6 py-4 flex items-start gap-3 border-b border-ink-200 dark:border-ink-800">
          {(icon || defaultIcon) && (
            <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${intentIconWrap}`}>
              {icon ?? defaultIcon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 id="modal-title" className="font-semibold text-base leading-tight">{title}</h3>
            {description && (
              <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3 bg-ink-50 dark:bg-ink-800/50 border-t border-ink-200 dark:border-ink-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Visual grouping inside a Modal: gives a section a title + optional hint. */
export function FormSection({
  title, description, children, required,
}: { title: string; description?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <section className="space-y-3">
      <header>
        <h4 className="text-sm font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
          {title}
          {required && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </h4>
        {description && <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{description}</p>}
      </header>
      <div>{children}</div>
    </section>
  );
}

/** Responsive grid for laying out fields side-by-side. */
export function FormGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: ReactNode }) {
  const cls = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }[cols];
  return <div className={`grid grid-cols-1 gap-4 ${cls}`}>{children}</div>;
}

/** Use to span the full row inside a FormGrid. */
export function FormFull({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2 lg:col-span-3">{children}</div>;
}

export function TextInput({
  label, value, onChange, type = 'text', required, placeholder, hint, error, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
  hint?: ReactNode; error?: string | null; maxLength?: number;
}) {
  const showCount = typeof maxLength === 'number';
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
        <span>{label}{required && <span className="text-rose-500"> *</span>}</span>
        {showCount && (
          <span className="text-[11px] tabular-nums text-ink-400 dark:text-ink-500">
            {value.length}/{maxLength}
          </span>
        )}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        className={`mt-1 w-full px-3 py-2 rounded-lg border bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none transition focus:ring-2 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-500/30'
            : 'border-ink-200 dark:border-ink-700 focus:border-brand-500 focus:ring-brand-200 dark:focus:ring-brand-500/30'
        }`}
      />
      {error
        ? <span className="block text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</span>
        : hint ? <span className="block text-xs text-ink-500 dark:text-ink-400 mt-1">{hint}</span> : null
      }
    </label>
  );
}

export function TextAreaInput({
  label, value, onChange, required, placeholder, hint, error, rows = 3, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; hint?: ReactNode; error?: string | null;
  rows?: number; maxLength?: number;
}) {
  const showCount = typeof maxLength === 'number';
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
        <span>{label}{required && <span className="text-rose-500"> *</span>}</span>
        {showCount && (
          <span className="text-[11px] tabular-nums text-ink-400 dark:text-ink-500">
            {value.length}/{maxLength}
          </span>
        )}
      </span>
      <textarea
        value={value}
        required={required}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        className={`mt-1 w-full px-3 py-2 rounded-lg border bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none transition focus:ring-2 resize-y ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-500/30'
            : 'border-ink-200 dark:border-ink-700 focus:border-brand-500 focus:ring-brand-200 dark:focus:ring-brand-500/30'
        }`}
      />
      {error
        ? <span className="block text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</span>
        : hint ? <span className="block text-xs text-ink-500 dark:text-ink-400 mt-1">{hint}</span> : null
      }
    </label>
  );
}

export function SelectInput({
  label, value, onChange, options, required, placeholder, hint, error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: ReactNode;
  error?: string | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}{required && <span className="text-rose-500"> *</span>}</span>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        className={`mt-1 w-full px-3 py-2 rounded-lg border bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none transition focus:ring-2 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-500/30'
            : 'border-ink-200 dark:border-ink-700 focus:border-brand-500 focus:ring-brand-200 dark:focus:ring-brand-500/30'
        }`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error
        ? <span className="block text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</span>
        : hint ? <span className="block text-xs text-ink-500 dark:text-ink-400 mt-1">{hint}</span> : null
      }
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
