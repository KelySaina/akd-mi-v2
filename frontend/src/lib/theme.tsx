'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('theme', next);
  }

  return { theme, toggle, ready };
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle, ready } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={ready ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
      className={`size-9 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700 transition ${className}`}
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/** Inline script: applied before React hydrates to prevent FOUC. */
export const themeBootScript = `
(function(){try{
  var t=localStorage.getItem('theme');
  if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  document.documentElement.setAttribute('data-theme',t);
}catch(e){}})();
`;
