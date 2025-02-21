/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts,scss}',
    './node_modules/tailwindcss-primeui/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primaryBlack: 'var(--color-primary-black)',
        action: 'var(--color-action)',
        primaryColor: 'var(--color-primary-color)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        background: 'var(--color-background)',
      }
    },
  },
  plugins: [require('tailwindcss-primeui')],
};
