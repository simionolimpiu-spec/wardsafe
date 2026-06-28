import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: [
      'src/**/*.test.{js,jsx}',
      'server/**/*.test.js',
      'infra/**/*.test.js',
      'database/**/*.test.js'
    ],
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    testTimeout: 60000,
    globals: true,
    css: true
  }
}));
