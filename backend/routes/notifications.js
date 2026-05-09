import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PendingNotification from '../models/PendingNotification.js';
import { sendSms } from '../services/smsService.js';

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

// POST /api/notifications/:id/send — dispatch a single pending notification
router.post('/:id/send', authenticateToken, async (req, res) => {
  try {
    const notification = await PendingNotification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    if (notification.status === 'sent') {
      return res.json({ success: true, message: 'Already sent' });
    }

    const result = await sendSms(notification.recipientPhone, notification.message);

    const newStatus = result.success ? 'sent' : 'failed';
    await PendingNotification.findByIdAndUpdate(req.params.id, { status: newStatus });

    return res.json({
      success: result.success,
      status: newStatus,
      reason: result.reason || null,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/notifications/send-all — dispatch all pending notifications in bulk
router.post('/send-all', authenticateToken, async (req, res) => {
  try {
    const pending = await PendingNotification.find({ status: 'pending' }).lean();
    if (pending.length === 0) {
      return res.json({ success: true, sent: 0, failed: 0, message: 'No pending notifications' });
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      pending.map(async (n) => {
        const result = await sendSms(n.recipientPhone, n.message);
        const newStatus = result.success ? 'sent' : 'failed';
        await PendingNotification.findByIdAndUpdate(n._id, { status: newStatus });
        if (result.success) sent++;
        else failed++;
      })
    );

    return res.json({ success: true, sent, failed, total: pending.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
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

