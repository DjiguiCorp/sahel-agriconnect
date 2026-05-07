import express from 'express';
import mongoose from 'mongoose';
import ExpertRequest from '../models/ExpertRequest.js';
import { authenticateToken } from '../middleware/auth.js';
import { notifyAdminExpertRequest } from '../services/emailService.js';

const router = express.Router();

// POST /api/experts/request — public
router.post('/request', async (req, res) => {
  try {
    const {
      farmerName,
      farmerEmail,
      farmerPhone,
      country,
      region,
      cropType,
      problemDescription,
      diseaseDetected,
      cooperativeMember,
      cooperativeName,
      preferredContactMethod,
      urgency,
      source,
    } = req.body || {};

    if (!farmerName || !farmerEmail || !problemDescription) {
      return res.status(400).json({
        error: 'farmerName, farmerEmail, and problemDescription are required',
      });
    }

    const doc = await ExpertRequest.create({
      farmerName: String(farmerName),
      farmerEmail: String(farmerEmail),
      farmerPhone: farmerPhone != null ? String(farmerPhone) : undefined,
      country: country != null ? String(country) : undefined,
      region: region != null ? String(region) : undefined,
      cropType: cropType != null ? String(cropType) : undefined,
      problemDescription: String(problemDescription),
      diseaseDetected: diseaseDetected != null ? String(diseaseDetected) : undefined,
      cooperativeMember: Boolean(cooperativeMember),
      cooperativeName: cooperativeMember && cooperativeName ? String(cooperativeName) : undefined,
      preferredContactMethod: ['email', 'phone', 'whatsapp'].includes(preferredContactMethod)
        ? preferredContactMethod
        : 'email',
      urgency: ['immediate', 'within_week', 'seasonal'].includes(urgency) ? urgency : 'within_week',
      source:
        ['disease_detection', 'think_tank', 'soil_diagnosis', 'direct'].includes(source) ? source : 'direct',
    });

    notifyAdminExpertRequest(doc).catch(console.error);

    const payload = {
      success: true,
      message: 'Request received',
      id: doc._id,
    };
    if (!doc.cooperativeMember) {
      payload.cooperativeNote = 'Joining a cooperative gives you priority access to experts';
    }
    return res.status(201).json(payload);
  } catch (e) {
    console.error('experts/request:', e);
    if (e.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(e.errors).map((x) => x.message).join(', ') });
    }
    return res.status(500).json({ error: e.message || 'Could not save request' });
  }
});

// GET /api/experts/requests — protected, ?status=new
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const requests = await ExpertRequest.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, requests });
  } catch (e) {
    console.error('experts/requests:', e);
    return res.status(500).json({ error: e.message || 'Could not load requests' });
  }
});

// PUT /api/experts/requests/:id/assign — protected
router.put('/requests/:id/assign', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedExpert } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }
    if (!assignedExpert || typeof assignedExpert !== 'string') {
      return res.status(400).json({ error: 'assignedExpert string required' });
    }
    const updated = await ExpertRequest.findByIdAndUpdate(
      id,
      { assignedExpert: assignedExpert.trim(), status: 'assigned' },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json({ success: true, request: updated });
  } catch (e) {
    console.error('experts/assign:', e);
    return res.status(500).json({ error: e.message || 'Assign failed' });
  }
});

// PUT /api/experts/requests/:id/status — protected
router.put('/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }
    const allowed = ['new', 'assigned', 'in_progress', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const updated = await ExpertRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json({ success: true, request: updated });
  } catch (e) {
    console.error('experts/status:', e);
    return res.status(500).json({ error: e.message || 'Status update failed' });
  }
});

export default router;
