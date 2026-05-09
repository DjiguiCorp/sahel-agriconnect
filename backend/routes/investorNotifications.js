import express from 'express';
import InvestorNotification from '../models/InvestorNotification.js';
import { authenticateInvestor, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:email', authenticateInvestor, async (req, res) => {
  try {
    const raw = req.params.email || '';
    const investorEmail = decodeURIComponent(raw).trim().toLowerCase();
    if (String(req.investorEmail || '').trim().toLowerCase() !== investorEmail) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const notes = await InvestorNotification.find({ investorEmail })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, notifications: notes });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

router.put('/:email/read-all', authenticateInvestor, async (req, res) => {
  try {
    const raw = req.params.email || '';
    const investorEmail = decodeURIComponent(raw).trim().toLowerCase();
    if (String(req.investorEmail || '').trim().toLowerCase() !== investorEmail) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    await InvestorNotification.updateMany({ investorEmail }, { read: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const note = await InvestorNotification.create(req.body);
    res.json({ success: true, notification: note });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;
