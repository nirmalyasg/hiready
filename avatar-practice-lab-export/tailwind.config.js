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
          dark: '#012638',
          primary: '#008196',
          light: '#04aac4',
          accent: '#fa6793',
          'accent-light': '#ff97a6',
        }
      }
    },
  },
  plugins: [],
}
