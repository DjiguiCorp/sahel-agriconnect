import express from 'express';
import LicensingInquiry from '../models/LicensingInquiry.js';
import { authenticateToken } from '../../../../backend/middleware/auth.js';

const router = express.Router();

router.post('/inquire', async (req, res) => {
  try {
    const { organizationName, country, contactName, email, phone, role } = req.body || {};
    if (!organizationName || !country || !contactName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = await LicensingInquiry.create({
      organizationName,
      country,
      contactName,
      email,
      phone,
      role,
      status: 'new',
      createdAt: new Date(),
    });

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/inquiries', authenticateToken, async (req, res) => {
  try {
    const rows = await LicensingInquiry.find({}).sort({ createdAt: -1 }).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;

