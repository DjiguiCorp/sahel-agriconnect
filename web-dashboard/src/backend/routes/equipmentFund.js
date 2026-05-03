import express from 'express';
import EquipmentFundApplication from '../models/EquipmentFundApplication.js';
import { authenticateToken } from '../../../../backend/middleware/auth.js';

const router = express.Router();

router.post('/apply', async (req, res) => {
  try {
    const { cooperativeName, country, equipmentNeeded, estimatedValue, farmersBenefiting, email } = req.body || {};
    if (!cooperativeName || !country || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = await EquipmentFundApplication.create({
      cooperativeName,
      country,
      equipmentNeeded: Array.isArray(equipmentNeeded) ? equipmentNeeded : [],
      estimatedValue: Number(estimatedValue || 0),
      farmersBenefiting: Number(farmersBenefiting || 0),
      email,
      status: 'pending',
      createdAt: new Date(),
    });

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const rows = await EquipmentFundApplication.find({}).sort({ createdAt: -1 }).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;

