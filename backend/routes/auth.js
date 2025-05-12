import { Router } from 'express';
import Admin from '../models/admin.js';
import path from 'path';

const router = Router();
const __dirname = import.meta.dirname;

// Register new admin
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const existing = await Admin.findOne({ username });
  if (existing) return res.status(400).json({ error: 'User already exists' });

  const admin = new Admin({ username, password });
  await admin.save();

  res.status(201).json({ success: true });
});

export default router;
