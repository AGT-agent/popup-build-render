import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The builder app is the dev/preview target. The renderer is a library that the
// builder imports for live preview and that a storefront can consume standalone.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@schema': fileURLToPath(new URL('./src/schema/index.ts', import.meta.url)),
      '@renderer': fileURLToPath(new URL('./src/renderer/index.ts', import.meta.url)),
    },
  },
});
