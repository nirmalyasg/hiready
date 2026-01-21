/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#042c4c',
          primary: '#042c4c',
          light: '#768c9c',
          accent: '#ee7e65',
          'accent-light': '#f5a594',
          muted: '#6c8194',
          background: '#f8f9fb',
        }
      }
    },
  },
  plugins: [],
}
