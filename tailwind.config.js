/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d0f14',
          card: '#161922',
          border: '#2a2f3a',
          hover: '#1e222d',
          elevated: '#1a1f2e',
        },
        accent: {
          cyan: '#06b6d4',
          'cyan-dim': '#0891b2',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(6, 182, 212, 0.25)',
        'glow-sm': '0 0 12px rgba(6, 182, 212, 0.2)',
        card: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      keyframes: {
        dialogPop: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      backgroundImage: {
        'app-gradient': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6, 182, 212, 0.12), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(59, 130, 246, 0.08), transparent)',
      },
    },
  },
  plugins: [],
};
