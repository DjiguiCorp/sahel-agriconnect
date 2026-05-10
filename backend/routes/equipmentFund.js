import express from 'express';
import EquipmentFundApplication from '../models/EquipmentFundApplication.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/apply', async (req, res) => {
  try {
    await EquipmentFundApplication.create({
      cooperativeName: req.body.cooperativeName,
      country: req.body.country,
      region: req.body.region || '',
      equipmentNeeded: Array.isArray(req.body.equipmentNeeded) ? req.body.equipmentNeeded : [],
      estimatedValue: Number(req.body.estimatedValue),
      farmersBenefiting: Number(req.body.farmersBenefiting),
      email: req.body.email,
      phone: req.body.phone || '',
      urgencyLevel: req.body.urgencyLevel || 'medium',
      additionalNeeds: req.body.additionalNeeds || '',
    });
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: e.message || 'Could not save application' });
  }
});

router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await EquipmentFundApplication.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, applications });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
