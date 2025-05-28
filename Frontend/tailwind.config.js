/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-bg': '#e0e5ec',
        'neo-shadow': '#bec3c9',
        'neo-light': '#ffffff',
      },
    },
  },
  plugins: [],
} 