/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'], // Enable dark mode with data-theme attribute
  theme: {
    extend: {
      colors: {
        // Primary color palette (blue)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Theme tokens using CSS variables
        surface: {
          DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
          card: 'rgb(var(--color-background-card) / <alpha-value>)',
          elevated: 'rgb(var(--color-background-elevated) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--color-foreground) / <alpha-value>)',
          secondary: 'rgb(var(--color-foreground-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-foreground-muted) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          hover: 'rgb(var(--color-border-hover) / <alpha-value>)',
        },
        // Semantic severity colors (fixed across themes)
        severity: {
          critical: '#dc2626', // red-600
          high: '#ea580c',     // orange-600
          medium: '#ca8a04',   // yellow-600
          low: '#16a34a',      // green-600
        },
      },
    },
  },
  plugins: [],
}
