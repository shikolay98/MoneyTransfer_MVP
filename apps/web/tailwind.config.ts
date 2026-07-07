import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
        },
        navy: {
          DEFAULT: 'rgb(var(--navy) / <alpha-value>)',
          soft: 'rgb(var(--navy-soft) / <alpha-value>)',
        },
        sky: 'rgb(var(--sky) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      boxShadow: {
        panel: '0 1px 3px rgba(15,27,52,0.05), 0 8px 24px rgba(15,27,52,0.07)',
        'panel-hover': '0 4px 12px rgba(15,27,52,0.08), 0 16px 40px rgba(15,27,52,0.12)',
        float: '0 8px 32px rgba(15,27,52,0.14)',
        glow: '0 0 0 4px rgba(37,99,235,0.14)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '5xl': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        '7xl': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
