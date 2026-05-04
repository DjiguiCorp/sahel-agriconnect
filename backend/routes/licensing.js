import express from 'express';
import LicensingInquiry from '../models/LicensingInquiry.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/inquire', async (req, res) => {
  try {
    await LicensingInquiry.create({
      organizationName: req.body.organizationName,
      country: req.body.country,
      contactName: req.body.contactName,
      email: req.body.email,
      phone: req.body.phone || '',
      role: req.body.role,
    });
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: e.message || 'Could not save inquiry' });
  }
});

router.get('/inquiries', authenticateToken, async (req, res) => {
  try {
    const inquiries = await LicensingInquiry.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, inquiries });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
