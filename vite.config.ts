import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const backgroundEntry = fileURLToPath(
  new URL('./src/background/index.ts', import.meta.url),
);

// Builds the service worker and copies everything in public/ (manifest, icons)
// into dist/. The content script is a separate build because Chrome cannot load
// an ES module as a content script.
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome102',
    rollupOptions: {
      input: { background: backgroundEntry },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
