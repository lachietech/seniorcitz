import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';

function staticHosting() {
  const aliases = {
    '/admin/login': '/admin-login.html',
    '/admin/dashboard': '/admin-dashboard.html',
  };
  const middleware = (server) => {
    server.middlewares.use((req, res, next) => {
      const [path, query] = req.url.split('?');
      if (aliases[path.replace(/\/$/, '')])
        req.url = aliases[path.replace(/\/$/, '')] + (query ? `?${query}` : '');
      next();
    });
  };
  return {
    name: 'static-hosting',
    configureServer: middleware,
    configurePreviewServer: middleware,
    closeBundle() {
      cpSync('frontend/static', 'dist/static', { recursive: true });
      // Directory indexes support hosts without configurable rewrites.
      for (const [route, entry] of Object.entries(aliases)) {
        mkdirSync(`dist${route}`, { recursive: true });
        cpSync(`dist${entry}`, `dist${route}/index.html`);
      }
      writeFileSync(
        'dist/_redirects',
        '/admin/login /admin-login.html 200\n/admin/dashboard /admin-dashboard.html 200\n',
      );
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL('./frontend', import.meta.url)),
  publicDir: false,
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), staticHosting()],
  build: {
    // Preserve the original rgba/gradient values exactly for visual parity.
    cssMinify: false,
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./frontend/index.html', import.meta.url)),
        login: fileURLToPath(new URL('./frontend/admin-login.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./frontend/admin-dashboard.html', import.meta.url)),
      },
    },
  },
});
