/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#2d5016',
          lightgreen: '#4a7c2a',
          orange: '#e67e22',
          lightorange: '#f39c12',
          blue: '#3498db',
          darkblue: '#2980b9',
        },
      },
    },
  },
  plugins: [],
}

