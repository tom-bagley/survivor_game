// vite.config.cjs
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// https://vite.dev/config/
module.exports = defineConfig({
  root: 'dist',
  plugins: [react()],
});
