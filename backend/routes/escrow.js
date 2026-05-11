import express from 'express';
import EscrowTransaction from '../models/EscrowTransaction.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/escrow — admin: all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await EscrowTransaction.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/escrow/investor/:email — investor's escrow transactions
router.get('/investor/:email', async (req, res) => {
  try {
    const transactions = await EscrowTransaction.find({
      investorEmail: decodeURIComponent(req.params.email),
    }).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/escrow/:id — single transaction detail
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const tx = await EscrowTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/escrow/:id/milestone — admin updates milestone
router.put('/:id/milestone', authenticateToken, async (req, res) => {
  try {
    const { milestoneNumber, status, notes, amountReleased } = req.body;
    const num = Number(milestoneNumber);
    const tx = await EscrowTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });

    const milestone = tx.milestones.find((m) => m.milestoneNumber === num);
    if (milestone) {
      if (status) milestone.status = status;
      if (notes) milestone.inspectorNotes = notes;
      if (status === 'verified') milestone.verifiedDate = new Date();
      if (status === 'released') {
        milestone.releasedDate = new Date();
        if (amountReleased != null) milestone.amountUSD = amountReleased;
      }
    }

    if (status === 'released' || status === 'verified') {
      await PendingNotification.create({
        recipientEmail: tx.investorEmail,
        recipientName: tx.investorName,
        message: `✅ Milestone ${milestoneNumber} verified for your AfriYield investment in ${tx.supplierName}. Funds released. Track your transaction at afriyieldexchange.com`,
        source: 'escrow_milestone',
        status: 'pending',
      });
    }

    await tx.save();
    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/escrow — create new escrow transaction (admin or system)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const total = Number(req.body.totalAmountUSD);
    const fee = total * 0.075;
    const tx = await EscrowTransaction.create({
      ...req.body,
      totalAmountUSD: total,
      afriyieldFeeUSD: Math.round(fee * 100) / 100,
      netToSupplierUSD: Math.round((total - fee) * 100) / 100,
      milestones: req.body.milestones || [
        { milestoneNumber: 1, label: 'Production confirmed', percentOfTotal: 30, status: 'pending' },
        { milestoneNumber: 2, label: 'Quality test passed', percentOfTotal: 30, status: 'pending' },
        { milestoneNumber: 3, label: 'Delivery verified', percentOfTotal: 40, status: 'pending' },
      ],
    });
    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
