/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          cream: '#FAF9F6',
          orange: '#C25E00', // Deep orange from button/logo
          'orange-light': '#FFF7ED',
          dark: '#1C1917',
          gray: '#9CA3AF'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'], // Assuming a serif font for headers if needed, based on "InterioStudio"
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}