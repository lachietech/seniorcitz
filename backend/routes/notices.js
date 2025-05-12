import { Router } from 'express';
import Notice from '../models/notice.js';

const router = Router();

router.get('/', async (_req, res) => {
  const notices = await Notice.find().sort({ postedAt: -1 });
  res.json(notices);
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });

  const notice = new Notice({ title, content });
  await notice.save();

  res.status(201).json({ success: true });
});

export default router;