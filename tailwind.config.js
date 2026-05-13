/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.tsx', './App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        nav: '#1e3a5f',
        navBorder: '#0f172a',
      },
    },
  },
  plugins: [],
};
