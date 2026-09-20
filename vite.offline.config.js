// Offline build config — produces ONE self-contained .html file with no network
// calls of any kind. Does not affect the normal `npm run build`.
//
//   npm i -D vite-plugin-singlefile
//   npx vite build --config vite.offline.config.js
//
// Output: dist-offline/index.offline.html  (rename it to WardSafe_Offline_Demo.html)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-offline',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,   // inline everything, including woff2 fonts
    cssCodeSplit: false,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      input: resolve(process.cwd(), 'index.offline.html'),
      output: { inlineDynamicImports: true }
    }
  }
});
