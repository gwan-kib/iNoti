import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

const builds = {
  content: {
    entry: './src/content/monitor.ts',
    name: 'iNotiContent',
    output: 'content.js',
    assets: [['./manifest.json', 'manifest.json'], ['./assets/icon-128.png', 'assets/icon-128.png'], ['./src/shared/brand-colors.css', 'shared/brand-colors.css']],
  },
  background: {
    entry: './src/background/service-worker.ts',
    name: 'iNotiBackground',
    output: 'background.js',
    assets: [],
  },
  popup: {
    entry: './src/popup/popup.ts',
    name: 'iNotiPopup',
    output: 'popup/popup.js',
    assets: [['./src/popup/popup.html', 'popup/popup.html'], ['./src/popup/popup.css', 'popup/popup.css']],
  },
  'dev-testing': {
    entry: './src/dev-testing/dev-testing.ts',
    name: 'iNotiDevTesting',
    output: 'dev-testing/dev-testing.js',
    assets: [['./src/dev-testing/index.html', 'dev-testing/index.html'], ['./src/dev-testing/dev-testing.css', 'dev-testing/dev-testing.css']],
  },
} as const;

type BuildTarget = keyof typeof builds;

function targetForMode(mode: string): BuildTarget {
  if (mode === 'background' || mode === 'popup' || mode === 'dev-testing') return mode;
  return 'content';
}

export default defineConfig(({ mode }) => {
  const target = targetForMode(mode);
  const build = builds[target];
  return {
    publicDir: false,
    build: {
      target: 'es2022',
      outDir: 'dist',
      // Content starts clean; later extension-page builds preserve earlier output.
      emptyOutDir: target === 'content',
      lib: {
        entry: path(build.entry),
        name: build.name,
        formats: ['iife'],
        fileName: () => build.output,
      },
    },
    plugins: [{
      name: 'extension-assets',
      generateBundle() {
        for (const [sourceName, fileName] of build.assets) {
          this.emitFile({ type: 'asset', fileName, source: readFileSync(path(sourceName)) });
        }
      },
    }],
  };
});
