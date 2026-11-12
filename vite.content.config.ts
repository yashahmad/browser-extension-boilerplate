import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const contentEntry = fileURLToPath(
  new URL('./src/content/index.tsx', import.meta.url),
);

// Chrome content scripts must be classic scripts, so this build emits a single
// IIFE bundle with React and the CSS (imported with ?inline) inlined.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  // Library mode does not replace process.env.NODE_ENV on its own. Without
  // this, React's development branch ships and reads an undefined `process`.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome102',
    minify: 'oxc',
    lib: {
      entry: contentEntry,
      formats: ['iife'],
      name: 'SidebarOverlay',
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
