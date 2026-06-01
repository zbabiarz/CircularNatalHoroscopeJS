/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f9f2eb',
        brown: '#382a25',
        magenta: '#437e78',
        rose: '#c6beba',
        teal: '#437e78',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  plugins: [],
}