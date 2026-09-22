import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

/**
 * Light/dark theme, persisted per browser.
 *
 * The initial value is read from the DOM rather than recomputed here: the
 * inline script in index.html has already resolved it and stamped
 * data-theme on <html>, so reading it back keeps React's first render in
 * agreement with what the user is already looking at.
 */
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light'
  );

  // Push changes back to the DOM and to storage. Storage can throw in a
  // private window, so a failure to remember must not break the toggle.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* no-op: the theme still applies for this session */
    }
  }, [theme]);

  // Follow the OS while the user has not made an explicit choice.
  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* treat unreadable storage as "no choice made" */
    }
    if (stored) return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setTheme(event.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    []
  );

  return { theme, toggle };
}
