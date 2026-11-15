import express from 'express';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import adminRouter from './routes/admin.js';
import noticesRouter from './routes/notices.js';
import authRouter from './routes/auth.js';
import timetableRouter from './routes/timetable.js';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function createApp({ development = false, sessionSecret = process.env.SESSION_SECRET, httpServer } = {}) {
  const app = express();
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(session({ secret: sessionSecret || randomBytes(32).toString('hex'), resave: false, saveUninitialized: false }));
  app.use('/notices', noticesRouter);
  app.use('/timetable', timetableRouter);
  app.use('/admin', adminRouter);
  app.use('/auth', authRouter);
  app.use('/static', express.static(path.join(root, 'frontend/static')));

  let vite;
  if (development) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true, hmr: httpServer ? { server: httpServer } : undefined },
      appType: 'custom'
    });
  }
  const page = filename => async (req, res, next) => {
    try {
      if (vite) {
        const html = await readFile(path.join(root, 'frontend', filename), 'utf8');
        res.type('html').send(await vite.transformIndexHtml(req.originalUrl, html));
      } else res.sendFile(path.join(root, 'dist', filename));
    } catch (error) {
      vite?.ssrFixStacktrace(error);
      next(error);
    }
  };
  app.get(['/', '/index.html'], page('index.html'));
  app.get(['/admin/login', '/admin-login.html'], page('admin-login.html'));
  app.get(['/admin/dashboard', '/admin-dashboard.html'], (req, res, next) => {
    if (!req.session.admin) return res.redirect('/admin/login');
    next();
  }, page('admin-dashboard.html'));
  if (vite) app.use(vite.middlewares);
  else app.use('/assets', express.static(path.join(root, 'dist/assets'), { immutable: true, maxAge: '1y' }));
  app.locals.close = async () => { await vite?.close(); };
  return app;
}
