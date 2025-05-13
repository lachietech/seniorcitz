import { Router } from 'express';
import Notice from '../models/notice.js';

const router = Router();

router.get('/', async (_req, res) => {
  const notices = await Notice.find().sort({ postedAt: -1 });

  // Convert image buffer to base64 if it exists
  const formatted = notices.map(n => ({
    _id: n._id,
    title: n.title,
    content: n.content,
    postedAt: n.postedAt,
    imageUrl: n.image?.data
      ? `data:${n.image.contentType};base64,${n.image.data.toString('base64')}`
      : null
  }));

  res.json(formatted);
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });

  const notice = new Notice({ title, content });
  await notice.save();

  res.status(201).json({ success: true });
});

export default router;