import { Router } from 'express';
import Admin from '../models/admin.js';
import Notice from '../models/notice.js';
import path from 'path';
import mongoose from 'mongoose';
import multer from 'multer';

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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login – Sandgate Seniors</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body {
            background-color: #fffaf5;
            font-family: 'Segoe UI', sans-serif;
          }
          .navbar {
            background-color: #2c3e50;
          }
          .navbar-brand, .nav-link {
            color: white !important;
          }
          .card {
            background-color: #ffffff;
            border: 1px solid #e3e3e3;
          }
        </style>
      </head>
      <body>
        <nav class="navbar navbar-expand-lg navbar-dark">
          <div class="container">
            <a class="navbar-brand fw-bold fs-4" href="/">Sandgate Seniors</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNavbar">
              <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
              </ul>
            </div>
          </div>
        </nav>

        <div class="container mt-5">
          <h2 class="text-center mb-4">Admin Login</h2>
          ${message ? `<div class="alert alert-info">${message}</div>` : ''}
          <form method="POST" action="/admin/login" class="card p-4 shadow-sm mx-auto">
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

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
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

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/notice', upload.single('image'), async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });

  const { title, content } = req.body;

  const newNotice = new Notice({
    title,
    content,
    postedAt: new Date()
  });

  if (req.file) {
    newNotice.image = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
  }

  await newNotice.save();
  res.status(201).json({ success: true });
});

router.put('/notice/:id', upload.single('image'), async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { title, content } = req.body;

  const update = { title, content };
  if (req.file) {
    update.image = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
  }

  const updated = await Notice.findByIdAndUpdate(id, update, { new: true });
  if (!updated) return res.status(404).json({ error: 'Notice not found' });

  res.json({ success: true, updated });
});

export default router;
