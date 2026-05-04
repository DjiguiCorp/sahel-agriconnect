import express from 'express';
import Investor from '../models/Investor.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function mapInvestmentTrack(input) {
  const s = String(input || '');
  if (s.includes('Both')) return 'Both';
  if (s.includes('Track B')) return 'Track B';
  return 'Track A';
}

function mapCommodityInterest(body) {
  const ci = body.commodityInterest;
  if (Array.isArray(ci)) {
    if (ci.includes('Both')) return 'Both';
    if (ci.includes('Shea Butter') && ci.includes('Sesame')) return 'Both';
    if (ci.includes('Sesame')) return 'Sesame';
    if (ci.includes('Shea Butter')) return 'Shea Butter';
  }
  return 'Shea Butter';
}

router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      countryOfResidence,
      investmentTrack,
      investmentRange,
      message,
    } = req.body;
    const heardFrom = req.body.heardFrom ?? req.body.heardAbout ?? '';

    await Investor.create({
      fullName,
      email,
      phone,
      countryOfResidence,
      investmentTrack: mapInvestmentTrack(investmentTrack),
      commodityInterest: mapCommodityInterest(req.body),
      investmentRange,
      heardFrom,
      message: message || '',
    });

    res.status(201).json({ success: true, message: 'Registration received' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'This email is already registered.',
      });
    }
    console.error(err);
    res.status(400).json({ success: false, error: err.message || 'Registration failed' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const investors = await Investor.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, investors });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const inv = await Investor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!inv) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, investor: inv });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
