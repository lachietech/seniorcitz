import { Router } from 'express';
import Admin from '../models/admin.js';
import Notice from '../models/notice.js';
import path from 'path';
import mongoose from 'mongoose';

const router = Router();
const __dirname = import.meta.dirname;




router.delete('/notice/:id', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

  await Notice.findByIdAndDelete(id);
  res.json({ success: true });
});

router.get('/login', (req, res) => {
    const message = req.cookies?.flash || '';
    res.clearCookie('flash'); // clear after showing
  
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Admin Login - Golden Horizons</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h2 class="text-center mb-4">Admin Login</h2>
          ${message ? `<div class="alert alert-info">${message}</div>` : ''}
          <form method="POST" action="/admin/login" class="card p-4 shadow-sm">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" name="username" id="username" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" name="password" id="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
          </form>
        </div>
      </body>
      </html>
    `);
});

router.post('/logout', (req, res) => {
    res.cookie('flash', 'Logged out successfully.', { maxAge: 5000, httpOnly: false });
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (admin && await admin.validatePassword(password)) {
    req.session.admin = admin._id;
    return res.redirect('/admin/dashboard');
  }
  res.status(401).send('Invalid credentials');
});

router.get('/dashboard', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  res.sendFile(path.join(__dirname, '../../frontend', 'admin-dashboard.html'));
});

router.post('/notice', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });
  const { title, content } = req.body;
  const newNotice = new Notice({ title, content });
  await newNotice.save();
  res.json({ success: true });
});

export default router;
