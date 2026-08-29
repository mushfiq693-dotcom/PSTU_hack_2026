/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          accent: '#6366f1',
        },
        dark: {
          bg: '#090d16',
          surface: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        flyMoney: {
          '0%': { transform: 'translate(0, 0) scale(0.9)', opacity: '0' },
          '10%': { opacity: '1', transform: 'translate(10px, -15px) scale(1)' },
          '50%': { transform: 'translate(140px, -35px) scale(1.05)' },
          '85%': { opacity: '1', transform: 'translate(270px, -5px) scale(1)' },
          '100%': { transform: 'translate(280px, 0) scale(0.9)', opacity: '0' },
        },
        pulseGreen: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        }
      },
      animation: {
        flyMoney: 'flyMoney 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        pulseGreen: 'pulseGreen 1.5s ease-out infinite'
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
      }
    },
  },
  plugins: [],
}
