/** @type {import('tailwindcss').Config} */
module.exports = {
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
        secondary: 'var(--color-scondary)',
        tertiary: 'var(--color-tertiary)',
        background: 'var(--color-background)',
      }
    },
  },
  plugins: [require('tailwindcss-primeui')],
};
