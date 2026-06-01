/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#D32F2F',
          900: '#7f1d1d',
        },
        warm: {
          50: '#faf7f4',
          100: '#f3eeea',
          white: '#fefcf9',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          hover: '#128C7E',
        },
        receipt: '#fffdf8',
      }
    },
  },
  plugins: [],
}
