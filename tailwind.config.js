/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f3ff',
        'neon-orange': '#ff9000',
        'dark-bg': '#000919',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'brightness(1)' },
          '100%': { filter: 'brightness(1.5)' },
        },
      },
    },
  },
  plugins: [],
};