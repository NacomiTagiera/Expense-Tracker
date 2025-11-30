/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      tailwindDirectives: ['custom-variant'],
    },
  },
};

export default config;
