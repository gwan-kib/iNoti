import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

// Copy the whole sound directory so registering a new sound never needs a build change.
const soundAssets = readdirSync(path('./assets/sounds')).map(
  (name) => [`./assets/sounds/${name}`, `assets/sounds/${name}`] as const,
);

const builds = {
  content: {
    entry: './src/content/monitor.ts',
    name: 'iNotiContent',
    output: 'content.js',
    assets: [['./manifest.json', 'manifest.json'], ['./assets/inoti-logo.png', 'assets/inoti-logo.png'], ['./src/shared/brand-colors.css', 'shared/brand-colors.css'], ...soundAssets],
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
  offscreen: {
    entry: './src/offscreen/offscreen.ts',
    name: 'iNotiOffscreen',
    output: 'offscreen/offscreen.js',
    assets: [['./src/offscreen/offscreen.html', 'offscreen/offscreen.html']],
  },
} as const;

type BuildTarget = keyof typeof builds;

function targetForMode(mode: string): BuildTarget {
  if (mode === 'background' || mode === 'popup' || mode === 'dev-testing' || mode === 'offscreen') return mode;
  return 'content';
}

export default defineConfig(({ mode }) => {
  const target = targetForMode(mode);
  const build = builds[target];
  return {
    publicDir: false,
    server: { host: '127.0.0.1', port: 5173, strictPort: true, open: '/src/dev-testing/index.html' },
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
      name: 'dev-tester-source-entry',
      apply: 'serve',
      transformIndexHtml(html, context) {
        if (context.path !== '/src/dev-testing/index.html') return html;
        // Serve the same tester HTML from source; packaged extension paths stay unchanged.
        return html.replace('<script src="./dev-testing.js"></script>', '<script type="module" src="./dev-testing.ts"></script>')
          .replaceAll('../assets/inoti-logo.png', '/assets/inoti-logo.png');
      },
    }, {
      name: 'extension-assets',
      generateBundle() {
        for (const [sourceName, fileName] of build.assets) {
          this.emitFile({ type: 'asset', fileName, source: readFileSync(path(sourceName)) });
        }
      },
    }],
  };
});
