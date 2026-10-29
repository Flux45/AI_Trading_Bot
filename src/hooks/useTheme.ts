import { useState, useEffect } from 'react';

export type AppTheme = 'dark' | 'light';

export function useTheme(): [AppTheme, () => void, (theme: AppTheme) => void] {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('app_theme', theme);
    } catch {
      // Ignore local storage write errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return [theme, toggleTheme, setTheme];
}
