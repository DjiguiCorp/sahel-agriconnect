import express from 'express';
import AfriYieldScore from '../models/AfriYieldScore.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/afriyield-scores — public leaderboard-style list
router.get('/', async (req, res) => {
  try {
    const scores = await AfriYieldScore.find().sort({ score: -1 }).limit(100).lean();
    res.json({ success: true, scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/afriyield-scores — admin create/update helper
router.post('/', authenticateToken, async (req, res) => {
  try {
    const doc = await AfriYieldScore.create(req.body);
    res.status(201).json({ success: true, score: doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
