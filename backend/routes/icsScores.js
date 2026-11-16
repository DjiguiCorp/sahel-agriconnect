import express from 'express';
import ICSScore from '../models/ICSScore.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import { authenticateToken } from '../middleware/auth.js';
import { authCoop } from './cooperatives.js';
import { computeICSScore } from '../services/icsScoreService.js';

const router = express.Router();

/** GET /api/ics-scores/my — cooperative: own score (compute if missing) */
router.get('/my', authCoop, async (req, res) => {
  try {
    let score = await ICSScore.findOne({ cooperativeId: req.coop._id });
    if (!score) {
      score = await computeICSScore(req.coop._id);
    }
    res.json({ success: true, score });
  } catch (err) {
    console.error('ics-scores/my:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to load ICS score' });
  }
});

/** POST /api/ics-scores/recompute — cooperative: refresh own score */
router.post('/recompute', authCoop, async (req, res) => {
  try {
    const score = await computeICSScore(req.coop._id);
    res.json({ success: true, score });
  } catch (err) {
    console.error('ics-scores/recompute:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to recompute ICS score' });
  }
});

/** GET /api/ics-scores/admin/all — admin: all scores with cooperative name */
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const scores = await ICSScore.find().lean();
    const coopIds = scores.map((s) => s.cooperativeId).filter(Boolean);
    const coops = await CooperativePlatformRegistration.find({ _id: { $in: coopIds } })
      .select('cooperativeName')
      .lean();
    const nameById = Object.fromEntries(coops.map((c) => [String(c._id), c.cooperativeName]));

    const withNames = scores.map((s) => ({
      ...s,
      cooperativeName: nameById[String(s.cooperativeId)] || '—',
    }));

    res.json({ success: true, scores: withNames });
  } catch (err) {
    console.error('ics-scores/admin/all:', err);
    res.status(500).json({ error: 'Failed to list ICS scores' });
  }
});

/** POST /api/ics-scores/admin/recompute/:coopId — admin: compute for a cooperative */
router.post('/admin/recompute/:coopId', authenticateToken, async (req, res) => {
  try {
    const score = await computeICSScore(req.params.coopId);
    const coop = await CooperativePlatformRegistration.findById(req.params.coopId)
      .select('cooperativeName')
      .lean();
    res.json({
      success: true,
      score: {
        ...(score.toObject ? score.toObject() : score),
        cooperativeName: coop?.cooperativeName || '—',
      },
    });
  } catch (err) {
    console.error('ics-scores/admin/recompute:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to recompute ICS score' });
  }
});

/** GET /api/ics-scores/:id — admin: score for a cooperative (by cooperativeId) */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let score = await ICSScore.findOne({ cooperativeId: req.params.id });
    if (!score) {
      score = await computeICSScore(req.params.id);
    }
    res.json({ success: true, score });
  } catch (err) {
    console.error('ics-scores/:id:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to load ICS score' });
  }
});

export default router;
