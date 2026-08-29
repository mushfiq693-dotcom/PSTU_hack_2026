/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        }
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
      }
    },
  },
  plugins: [],
}
