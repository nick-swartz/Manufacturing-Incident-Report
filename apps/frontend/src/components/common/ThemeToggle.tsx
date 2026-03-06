import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark'; label: string; icon: string }> = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-surface-card border border-line rounded-md p-0.5" role="group" aria-label="Theme selector">
      {themes.map((themeOption) => {
        // If theme is 'system', highlight based on effectiveTheme
        const isActive = theme === 'system'
          ? effectiveTheme === themeOption.value
          : theme === themeOption.value;

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
                : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-label={`${themeOption.label} theme${isActive ? ' (active)' : ''}`}
            aria-pressed={isActive}
            title={`Switch to ${themeOption.label.toLowerCase()} theme`}
          >
            <span className="text-sm" aria-hidden="true">{themeOption.icon}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
