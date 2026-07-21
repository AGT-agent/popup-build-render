import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { fileURLToPath, URL } from 'node:url';

// Library build: what consumers get when they `npm i popup-build-render`.
// The app build (builder UI + demo page) lives in vite.config.ts.
export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], rollupTypes: false, tsconfigPath: './tsconfig.lib.json' }),
  ],
  resolve: {
    alias: {
      '@schema': fileURLToPath(new URL('./src/schema/index.ts', import.meta.url)),
      '@renderer': fileURLToPath(new URL('./src/renderer/index.ts', import.meta.url)),
    },
  },
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        // "." — schema types/helpers plus the renderer.
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        // "./builder" — the visual builder as a mountable React component.
        builder: fileURLToPath(new URL('./src/builder/index.ts', import.meta.url)),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Peer deps stay external so the host app owns a single React copy.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'zustand'],
      output: {
        // Vite 5 names the extracted stylesheet style.css; only the builder has one.
        assetFileNames: (asset) =>
          asset.name === 'style.css' ? 'builder.css' : '[name][extname]',
      },
    },
  },
});
