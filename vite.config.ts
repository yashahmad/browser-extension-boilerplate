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
        // Classic IIFE, not an ES module. Safari's MV3 service-worker loader is
        // unreliable with `background.type: "module"`, and the worker has no
        // imports at runtime anyway.
        format: 'iife',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
