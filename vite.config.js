import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787'
    }
  },
  test: {
    include: [
      'src/**/*.test.{js,jsx}',
      'server/**/*.test.js',
      'infra/**/*.test.js',
      'database/**/*.test.js'
    ],
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    css: true
  }
});
