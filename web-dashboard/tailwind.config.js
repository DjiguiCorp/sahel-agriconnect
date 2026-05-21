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
          forest: '#1B4332',
          forestLight: '#1a5c35',
          sage: '#52B788',
          amber: '#B5850A',
          amberDeep: '#9a7109',
          cream: '#F8F4E3',
          iconBg: 'rgba(255,255,255,0.08)',
          gold: '#B5850A',
          goldLight: '#f59e0b',
          teal: '#1D9E75',
          navy: '#142e60',
          darkBase: '#0f2218',
          midGreen: '#1a4028',
        },
        primary: {
          green: '#1B4332',
          lightgreen: '#52B788',
          orange: '#E9C46A',
          lightorange: '#F4A261',
          blue: '#52B788',
          darkblue: '#1B4332',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'hero-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'hero-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'hero-float': 'hero-float 7s ease-in-out infinite',
        'hero-float-delayed': 'hero-float 9s ease-in-out 1.2s infinite',
        'hero-pulse': 'hero-pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
