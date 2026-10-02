import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'marketing-insights-theme';

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Fallback if localStorage or window is inaccessible
  }
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply theme attributes to <html>
  const applyTheme = useCallback((targetTheme: Theme) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', targetTheme);
    if (targetTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (err) {
        console.error('Failed to save theme in localStorage:', err);
      }
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {}
      setTheme(newTheme);
      applyTheme(newTheme);
    },
  };
}
