import express from 'express';
import { CROPS } from '../config/crops.js';

const router = express.Router();

/** GET /api/config/crops — public crop catalogue */
router.get('/crops', (_req, res) => {
  res.json({ success: true, crops: CROPS });
});

export default router;
