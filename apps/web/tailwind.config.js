/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        title: ['Backed', 'sans-serif'],
        number: ['Gehors', 'sans-serif'],
        body: ['Play', 'sans-serif'],
      },
      colors: {
        menu: '#262626',
        panel: '#333333',
        base: '#333333',
        card: '#262626',
        accent: '#AF9150',
        'text-primary': '#D9D9D9',
        'text-secondary': '#A3A3A3',
        border: '#4A4A4A',
        transparent: 'transparent',
        current: 'currentColor',
        black: '#000000',
        white: '#ffffff',
      },
    },
  },
  plugins: [],
};
