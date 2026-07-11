import { Router } from 'express';
import Timetable from '../models/timetable.js';

const router = Router();

router.get('/', async (_req, res) => {
  const entries = await Timetable.getCurrent();
  res.json(entries);
});

export default router;
