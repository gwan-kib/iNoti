import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // Exercise the build without introducing a popup or other extension entry.
  root: fileURLToPath(new URL('./tooling', import.meta.url)),
  base: './',
  build: {
    target: 'es2022',
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
});
