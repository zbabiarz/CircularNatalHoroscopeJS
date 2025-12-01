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
        magenta: '#8d1246',
        rose: '#c6beba',
      },
    },
  },
  plugins: [],
}