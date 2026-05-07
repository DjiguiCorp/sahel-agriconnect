import express from 'express';
import Waitlist from '../models/Waitlist.js';
const router = express.Router();
router.post('/', async (req, res) => {
  try {
    await Waitlist.create({ email: req.body.email });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});
export default router;

