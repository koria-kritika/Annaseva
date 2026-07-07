/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    { pattern: /^bg-\[/ },
    { pattern: /^text-\[/ },
    { pattern: /^border-\[/ },
    { pattern: /^from-\[/ },
    { pattern: /^to-\[/ },
    { pattern: /^shadow-/ },
    { pattern: /^ring-/ },
    { pattern: /^accent-/ },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FC8019',
          orangeDark: '#e16f11',
          black: '#1A1A1A',
          grey: '#F5F5F5',
        },
      },
    },
  },
  plugins: [],
};