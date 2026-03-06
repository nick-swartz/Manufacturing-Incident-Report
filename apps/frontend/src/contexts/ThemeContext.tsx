import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get initial theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'system';
  });

  // Detect system preference
  const getSystemTheme = (): EffectiveTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Calculate effective theme
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => {
    return theme === 'system' ? getSystemTheme() : theme;
  });

  // Apply theme to document
  const applyTheme = (theme: EffectiveTheme) => {
    const root = document.documentElement;

    // Set data-theme attribute for CSS variables
    root.setAttribute('data-theme', theme);

    // Set dark class for Tailwind
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Handle theme changes
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const effective = newTheme === 'system' ? getSystemTheme() : newTheme;
    setEffectiveTheme(effective);
    applyTheme(effective);
  };

  // Watch for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newEffective = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newEffective);
        applyTheme(newEffective);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Sync theme across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        const effective = newTheme === 'system' ? getSystemTheme() : newTheme;
        setEffectiveTheme(effective);
        applyTheme(effective);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(effectiveTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
