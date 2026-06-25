/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          card: '#0f0f0f',
          border: '#1f1f1f',
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
          foreground: '#a3a3a3',
        },
        primary: {
          DEFAULT: '#f89406',
          foreground: '#ffffff',
        },
        accent: {
          cyan: '#f89406',
          'cyan-dim': '#e07d00',
          blue: '#fa9f1a',
          purple: '#f89406',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 28px rgba(248, 148, 6, 0.35)',
        'glow-sm': '0 0 14px rgba(248, 148, 6, 0.25)',
        card: '0 8px 32px rgba(0, 0, 0, 0.65)',
        'card-lg': '0 16px 48px rgba(0, 0, 0, 0.75)',
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
