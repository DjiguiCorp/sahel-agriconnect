import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PendingNotification from '../models/PendingNotification.js';

const router = express.Router();

// GET /api/notifications — return all pending notifications (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const q = { status: 'pending' };
    const notifications = await PendingNotification.find(q).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, notifications });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// PUT /api/notifications/:id/status — update status (protected)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['pending', 'sent', 'failed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${allowed.join(', ')}` });
    }
    const updated = await PendingNotification.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, notification: updated });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message || 'Update failed' });
  }
});

// GET /api/notifications/stats — count by status (protected)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const agg = await PendingNotification.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const byStatus = { pending: 0, sent: 0, failed: 0 };
    for (const row of agg) byStatus[row._id] = row.count;
    return res.json({ success: true, byStatus });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;

