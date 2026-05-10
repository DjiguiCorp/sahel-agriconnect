import express from 'express';
import FarmerNeed from '../models/FarmerNeed.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const ADMIN_EMAIL_FALLBACK = 'info@djiguicorporation.org';

// POST /api/farmer-needs — farmer submits a need (public)
router.post('/', async (req, res) => {
  try {
    const need = await FarmerNeed.create(req.body);

    await PendingNotification.create({
      recipientName: 'Admin',
      recipientEmail: process.env.ADMIN_EMAIL || ADMIN_EMAIL_FALLBACK,
      message: `🌾 BESOIN AGRICULTEUR — ${req.body.farmerName || 'Agriculteur'} (${req.body.cooperativeName || 'Sans coopérative'})
Type: ${req.body.needType}
Urgence: ${req.body.urgencyLevel}
Pays: ${req.body.country} · ${req.body.region}
Description: ${req.body.description || 'Aucune'}`,
      source: 'farmer_need',
      status: 'pending',
    });

    res.status(201).json({ success: true, need });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/farmer-needs/stats — must be before GET /
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const total = await FarmerNeed.countDocuments();
    const pending = await FarmerNeed.countDocuments({ status: 'submitted' });
    const processing = await FarmerNeed.countDocuments({ status: 'processing' });
    const fulfilled = await FarmerNeed.countDocuments({ status: 'fulfilled' });
    const byType = await FarmerNeed.aggregate([
      { $group: { _id: '$needType', count: { $sum: 1 } } },
    ]);
    const byCountry = await FarmerNeed.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
    ]);
    res.json({ total, pending, processing, fulfilled, byType, byCountry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farmer-needs/by-cooperative/:name
router.get('/by-cooperative/:name', authenticateToken, async (req, res) => {
  try {
    const needs = await FarmerNeed.find({
      cooperativeName: new RegExp(req.params.name, 'i'),
    }).sort({ createdAt: -1 });
    res.json({ success: true, needs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farmer-needs — all needs, admin only
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { country, region, cooperativeName, status, needType } = req.query;
    const filter = {};
    if (country) filter.country = country;
    if (region) filter.region = new RegExp(region, 'i');
    if (cooperativeName) filter.cooperativeName = new RegExp(cooperativeName, 'i');
    if (status) filter.status = status;
    if (needType) filter.needType = needType;
    const needs = await FarmerNeed.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, needs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/farmer-needs/:id — update status + response, admin only
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, cooperativeResponse, adminNotes } = req.body;
    const need = await FarmerNeed.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(cooperativeResponse != null && cooperativeResponse !== '' && { cooperativeResponse }),
        ...(adminNotes != null && adminNotes !== '' && { adminNotes }),
        ...(status === 'fulfilled' && { fulfilledAt: new Date() }),
      },
      { new: true }
    );

    if (status && need?.farmerPhone) {
      const messages = {
        received_by_cooperative:
          '✅ Votre demande a été reçue par votre coopérative. Ils vous contacteront bientôt. — Sahel AgriConnect',
        processing:
          '🔄 Votre demande est en cours de traitement par votre coopérative. — Sahel AgriConnect',
        fulfilled: `🎉 Bonne nouvelle ! Votre demande a été traitée. ${cooperativeResponse || ''} — Sahel AgriConnect`,
        declined: `ℹ️ Votre demande n'a pas pu être satisfaite pour le moment. ${cooperativeResponse || ''} — Sahel AgriConnect`,
      };

      if (messages[status]) {
        await PendingNotification.create({
          recipientName: need.farmerName,
          recipientPhone: need.farmerPhone,
          recipientEmail: need.farmerEmail,
          message: messages[status],
          source: 'farmer_need_update',
          status: 'pending',
        });
      }
    }

    res.json({ success: true, need });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
