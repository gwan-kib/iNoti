import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig(({ mode }) => {
  if (mode === 'alert') {
    return {
      root: path('./src/alert'),
      base: './',
      publicDir: false,
      build: {
        target: 'es2022', outDir: path('./dist'), emptyOutDir: false,
        rolldownOptions: { input: path('./src/alert/alert.html') },
      },
    };
  }
  const background = mode === 'background';
  return {
    publicDir: false,
    build: {
      target: 'es2022',
      outDir: 'dist',
      // The content build starts clean; the worker build preserves its output.
      emptyOutDir: !background,
      lib: {
        entry: path(background ? './src/background/service-worker.ts' : './src/content/monitor.ts'),
        name: background ? 'iNotiBackground' : 'iNotiContent',
        formats: ['iife'],
        fileName: () => background ? 'background.js' : 'content.js',
      },
    },
    plugins: background ? [] : [{
      name: 'extension-assets',
      generateBundle() {
        for (const fileName of ['manifest.json', 'assets/icon-128.png']) {
          this.emitFile({ type: 'asset', fileName, source: readFileSync(path(`./${fileName}`)) });
        }
      },
    }],
  };
});
