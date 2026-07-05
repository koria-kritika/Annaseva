/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
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