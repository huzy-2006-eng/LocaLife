import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'localife-theme';

function readStored(): Theme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

// Two-state toggle that defaults to the OS preference until the user
// explicitly picks one, then remembers that choice (localStorage) and
// stops following the OS. Mirrors how most apps handle this: system by
// default, explicit override wins once set.
export function useTheme() {
  const [explicit, setExplicit] = useState<Theme | null>(readStored);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const theme: Theme = explicit ?? (systemPrefersDark ? 'dark' : 'light');

  useEffect(() => {
    if (explicit) document.documentElement.setAttribute('data-theme', explicit);
    else document.documentElement.removeAttribute('data-theme');
  }, [explicit]);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setExplicit(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode etc) -- theme still
      // applies for this session via component state.
    }
  }

  return { theme, toggleTheme };
}
