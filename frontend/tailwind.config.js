/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1f1f1f',
        },
        primary: {
          500: '#3b82f6',
          400: '#60a5fa',
        }
      }
    },
  },
  plugins: [],
}
