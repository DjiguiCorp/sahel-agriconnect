import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import QuoteRequest from '../models/QuoteRequest.js';
import Opportunity from '../models/Opportunity.js';

const router = express.Router();

// POST /api/marketplace/quote-request (public)
// Body: { opportunityId, buyerName, companyName, email, phone, productWanted, quantityKg, deliveryCountry, message }
router.post('/quote-request', async (req, res) => {
  try {
    const {
      opportunityId,
      buyerName,
      companyName,
      email,
      phone,
      productWanted,
      quantityKg,
      deliveryCountry,
      message,
    } = req.body || {};

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    if (opportunityId && !String(opportunityId).match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid opportunityId' });
    }

    if (opportunityId) {
      const exists = await Opportunity.exists({ _id: opportunityId });
      if (!exists) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    await QuoteRequest.create({
      opportunityId: opportunityId || undefined,
      buyerName: buyerName || '',
      companyName: companyName || '',
      email: String(email).trim().toLowerCase(),
      phone: phone || '',
      productWanted: productWanted || '',
      quantityKg: quantityKg != null && quantityKg !== '' ? Number(quantityKg) : undefined,
      deliveryCountry: deliveryCountry || '',
      message: message || '',
    });

    return res.status(201).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/marketplace/quote-requests (protected)
router.get('/quote-requests', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const quoteRequests = await QuoteRequest.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, quoteRequests });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;

