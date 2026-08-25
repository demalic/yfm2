/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          border: 'var(--surface-border)',
        },
        content: {
          DEFAULT: 'var(--content-text)',
          muted: 'var(--content-muted)',
          subtle: 'var(--content-subtle)',
        },
        inset: {
          panel: 'var(--inset-panel)',
        },
        logo: {
          well: 'var(--logo-well)',
        },
        dark: {
          bg: 'var(--surface)',
          card: 'var(--surface-raised)',
          border: 'var(--surface-border)',
          hover: '#171717',
          elevated: '#141414',
        },
        brand: {
          orange: '#f89406',
          'orange-bright': '#fa9f1a',
          'orange-dim': '#e07d00',
          white: '#ffffff',
        },
        muted: {
          DEFAULT: '#1a1a1a',
          foreground: 'var(--content-muted)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          cyan: 'var(--brand-orange)',
          'cyan-dim': 'var(--brand-orange-dim)',
          blue: 'var(--brand-orange-bright)',
          purple: 'var(--brand-orange)',
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
        panel: '1rem',
      },
      boxShadow: {
        glow: '0 0 28px rgba(248, 148, 6, 0.35)',
        'glow-sm': '0 0 14px rgba(248, 148, 6, 0.25)',
        card: '0 4px 24px rgba(0, 0, 0, 0.45)',
        'card-lg': '0 8px 32px rgba(0, 0, 0, 0.55)',
        panel: '0 1px 0 rgba(255, 255, 255, 0.04) inset',
      },
      keyframes: {
        dialogPop: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      backgroundImage: {
        'app-gradient':
          'radial-gradient(ellipse 90% 60% at 50% -15%, rgba(248, 148, 6, 0.12), transparent)',
        'brand-gradient': 'linear-gradient(135deg, #fa9f1a 0%, #f89406 100%)',
        'brand-gradient-subtle':
          'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
      },
    },
  },
  plugins: [],
};
