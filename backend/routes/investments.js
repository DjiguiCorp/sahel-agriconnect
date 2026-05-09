import express from 'express';
import { authenticateInvestor, authenticateToken } from '../middleware/auth.js';
import Investment from '../models/Investment.js';
import Investor from '../models/Investor.js';
import Opportunity from '../models/Opportunity.js';

const router = express.Router();

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function round2(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

function buildPayoutSchedule({ amountDeployed, expectedROIPercent, deploymentDate }) {
  const principal = Number(amountDeployed) || 0;
  const roi = Number(expectedROIPercent) || 0;
  const perHalf = (principal * (roi / 100)) / 2;
  const base = deploymentDate ? new Date(deploymentDate) : new Date();
  return [
    { payoutDate: addMonths(base, 6), amount: round2(perHalf), status: 'scheduled', notes: '' },
    { payoutDate: addMonths(base, 12), amount: round2(perHalf), status: 'scheduled', notes: '' },
  ];
}

// POST /api/investments — create new investment record (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      investorEmail,
      opportunityId,
      track,
      amountDeployed,
      currency,
      deploymentDate,
      expectedROIPercent,
      adminNotes,
    } = req.body || {};

    if (!investorEmail || !String(investorEmail).trim()) {
      return res.status(400).json({ success: false, error: 'investorEmail required' });
    }
    if (!opportunityId || !String(opportunityId).match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'valid opportunityId required' });
    }
    const amt = Number(amountDeployed);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, error: 'amountDeployed must be > 0' });
    }
    if (!['Track A', 'Track B'].includes(track)) {
      return res.status(400).json({ success: false, error: 'track must be Track A or Track B' });
    }

    const invEmail = String(investorEmail).trim().toLowerCase();
    const investor = await Investor.findOne({ email: invEmail }).lean();
    const opp = await Opportunity.findById(opportunityId).lean();
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });

    const payoutSchedule = buildPayoutSchedule({
      amountDeployed: amt,
      expectedROIPercent: expectedROIPercent ?? 8,
      deploymentDate: deploymentDate || new Date(),
    });

    const doc = await Investment.create({
      investorId: investor?._id,
      investorName: investor?.fullName || req.body.investorName || '',
      investorEmail: invEmail,
      opportunityId: opp._id,
      opportunityName: opp.centerName || req.body.opportunityName || '',
      track,
      commodity: opp.commodity || req.body.commodity || '',
      amountDeployed: amt,
      currency: currency || 'USD',
      deploymentDate: deploymentDate || new Date(),
      expectedROIPercent: Number(expectedROIPercent ?? 8) || 8,
      payoutSchedule,
      status: 'active',
      adminNotes: adminNotes || '',
    });

    return res.status(201).json({ success: true, investment: doc });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/investments — all (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, investments });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/investments/stats — (protected)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find().lean();
    const totalDeployed = investments.reduce((s, x) => s + (Number(x.amountDeployed) || 0), 0);
    const totalPaidOut = investments.reduce((s, x) => {
      const paid = (x.payoutSchedule || []).filter((p) => p.status === 'paid');
      return s + paid.reduce((s2, p) => s2 + (Number(p.amount) || 0), 0);
    }, 0);
    const activeCount = investments.filter((x) => x.status === 'active').length;
    return res.json({ success: true, totalDeployed, totalPaidOut, activeCount });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/investments/investor/:email — investor token
router.get('/investor/:email', authenticateInvestor, async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, error: 'email required' });
    if (String(req.investorEmail || '').trim().toLowerCase() !== email) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const investments = await Investment.find({ investorEmail: email }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, investments });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// PUT /api/investments/:id/payout/:payoutIndex — mark payout paid (protected)
router.put('/:id/payout/:payoutIndex', authenticateToken, async (req, res) => {
  try {
    const { id, payoutIndex } = req.params;
    if (!String(id).match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const idx = Number(payoutIndex);
    if (!Number.isInteger(idx) || idx < 0) {
      return res.status(400).json({ success: false, error: 'Invalid payoutIndex' });
    }

    const doc = await Investment.findById(id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    if (!Array.isArray(doc.payoutSchedule) || !doc.payoutSchedule[idx]) {
      return res.status(400).json({ success: false, error: 'Payout not found' });
    }

    doc.payoutSchedule[idx].status = 'paid';
    if (req.body?.notes != null) doc.payoutSchedule[idx].notes = String(req.body.notes);
    await doc.save();
    return res.json({ success: true, investment: doc.toObject() });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;

