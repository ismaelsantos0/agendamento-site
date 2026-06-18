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
          light: '#E0F2F1', // Teal 50
          DEFAULT: '#009688', // Teal 500
          dark: '#00796B', // Teal 700
        },
        secondary: {
          light: '#E1F5FE', // Light Blue 50
          DEFAULT: '#03A9F4', // Light Blue 500
        }
      },
    },
  },
  plugins: [],
}
