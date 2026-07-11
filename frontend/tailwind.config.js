/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial dark palette
        'slate-950': '#020617',
        // Semantic tokens
        safe: '#10B981',
        'safe-dim': '#064E3B',
        warn: '#F59E0B',
        'warn-dim': '#451A03',
        danger: '#DC2626',
        'danger-dim': '#450A0A',
        cobalt: '#2563EB',
        // Node type colors
        'node-equipment': '#1D4ED8',
        'node-incident': '#B91C1C',
        'node-worker': '#475569',
        'node-zone': '#0F766E',
        'node-permit': '#B45309',
        'node-regulation': '#7C3AED',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      animation: {
        'critical-pulse': 'criticalPulse 1.5s ease-in-out infinite',
        'warn-pulse': 'warnPulse 2.5s ease-in-out infinite',
        'slide-in': 'slideIn 250ms ease-out',
        'fade-in': 'fadeIn 300ms ease-out',
      },
      keyframes: {
        criticalPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        warnPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
