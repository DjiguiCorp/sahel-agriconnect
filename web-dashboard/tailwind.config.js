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
          sage: '#52B788',
          amber: '#E9C46A',
          amberDeep: '#F4A261',
          cream: '#F8F4E3',
          iconBg: '#EAF3DE',
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
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
