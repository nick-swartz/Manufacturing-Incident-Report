import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: string }> = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-background-card border border-border rounded-md p-0.5" role="group" aria-label="Theme selector">
      {themes.map((themeOption) => {
        const isActive = theme === themeOption.value;
        const isEffective = effectiveTheme === (themeOption.value === 'system' ? effectiveTheme : themeOption.value);

        return (
          <button
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={`
              px-1.5 py-1 rounded text-xs font-medium transition-all duration-200
              focus:outline-none focus:ring-1 focus:ring-primary-500
              dark:focus:ring-primary-400
              min-h-[28px] min-w-[28px]
              ${isActive
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-foreground-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-label={`${themeOption.label} theme${isActive ? ' (active)' : ''}`}
            aria-pressed={isActive}
            title={`Switch to ${themeOption.label.toLowerCase()} theme${themeOption.value === 'system' ? ` (currently ${effectiveTheme})` : ''}`}
          >
            <span className="text-sm" aria-hidden="true">{themeOption.icon}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
