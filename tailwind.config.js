/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.tsx', './App.tsx', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        nav: '#0f766e',
        navBorder: '#0f172a',
      },
    },
  },
  plugins: [],
};
