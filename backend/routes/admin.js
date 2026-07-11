import { Router } from 'express';
import Admin from '../models/admin.js';
import Notice from '../models/notice.js';
import Timetable from '../models/timetable.js';
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

router.put('/timetable', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });

  const { entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'Timetable entries are required' });
  }

  const cleanEntries = entries.map(entry => ({
    day: String(entry.day || '').trim(),
    hours: String(entry.hours || '').trim(),
    activities: String(entry.activities || '').trim()
  }));

  if (cleanEntries.some(entry => !entry.day || !entry.hours || !entry.activities)) {
    return res.status(400).json({ error: 'Every timetable row needs a day, hours, and activities' });
  }

  const timetable = await Timetable.findOneAndUpdate(
    {},
    { entries: cleanEntries, updatedAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, entries: timetable.entries });
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend', 'admin-login.html'));
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
  res.cookie('flash', 'Invalid username or password.', { maxAge: 5000, httpOnly: false });
  res.redirect('/admin/login');
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
