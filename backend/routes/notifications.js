import express from 'express';
import { Resend } from 'resend';
import { authenticateToken, authenticateAnyUser } from '../middleware/auth.js';
import PendingNotification from '../models/PendingNotification.js';
import InvestorNotification from '../models/InvestorNotification.js';
import { sendSms } from '../services/smsService.js';

const router = express.Router();
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function makeHtml(message, title = 'Sahel AgriConnect', recipientName = '') {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
      <h1 style="color:#B5850A;margin:0;font-size:20px;">Sahel AgriConnect</h1>
      <p style="color:white;margin:4px 0 0;font-size:13px;">${title}</p>
    </div>
    <div style="padding:28px;background:white;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
      ${recipientName ? `<p style="color:#333;font-size:15px;">Bonjour <strong>${recipientName}</strong>,</p>` : ''}
      <div style="color:#555;font-size:14px;line-height:1.8;">${String(message || '').replace(/\n/g, '<br>')}</div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#999;font-size:12px;">
        Sahel AgriConnect · Djigui Corporation<br>
        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#1a3c2e;">sahelagriconnect.com</a> |
        <a href="mailto:info@djiguicorporation.org" style="color:#1a3c2e;">info@djiguicorporation.org</a>
      </p>
    </div>
  </div>`;
}

// Core send function — tries email first, then SMS when no email; logs result
export async function dispatchNotification(notification) {
  const resend = getResend();
  let sent = false;
  let error = null;

  if (resend && notification.recipientEmail) {
    try {
      await resend.emails.send({
        from: FROM,
        to: notification.recipientEmail,
        subject: `Sahel AgriConnect — ${notification.source || 'Message'}`,
        html: makeHtml(notification.message, 'Notification', notification.recipientName),
      });
      sent = true;
    } catch (e) {
      error = e.message;
    }
  } else if (notification.recipientPhone) {
    try {
      const result = await sendSms(notification.recipientPhone, notification.message);
      sent = Boolean(result.success);
      error = result.reason || (sent ? null : 'SMS send failed');
    } catch (e) {
      error = e.message;
    }
  }

  if (notification.fcmToken && process.env.FIREBASE_SERVER_KEY) {
    try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: notification.fcmToken,
          notification: {
            title: 'Sahel AgriConnect',
            body: String(notification.message || '').split('\n')[0],
          },
          data: { source: String(notification.source || '') },
        }),
      });
    } catch (_) {
      /* optional push failure */
    }
  }

  await PendingNotification.findByIdAndUpdate(notification._id, {
    status: sent ? 'sent' : 'failed',
    sentAt: sent ? new Date() : undefined,
    error: error || undefined,
  });

  return { sent, error };
}

// Process queue — called by interval and by admin
export async function processQueue(limit = 30) {
  const pending = await PendingNotification.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  const results = { sent: 0, failed: 0, skipped: 0 };
  for (const n of pending) {
    if (!n.recipientEmail && !n.recipientPhone) {
      await PendingNotification.findByIdAndUpdate(n._id, { status: 'failed', error: 'No contact info' });
      results.skipped++;
      continue;
    }
    const { sent } = await dispatchNotification(n);
    if (sent) results.sent++;
    else results.failed++;
  }
  return results;
}

function mapInvestorNotifType(type) {
  const m = {
    payout: 'milestone_released',
    opportunity: 'new_opportunity',
    commodity: 'price_alerts',
    update: 'national_project',
    welcome: 'training',
  };
  return m[type] || 'training';
}

// GET /api/notifications/my — mobile inbox (JWT)
router.get('/my', authenticateAnyUser, async (req, res) => {
  try {
    const mu = req.mobileUser;
    let notifications = [];

    if (mu.role === 'investor' && mu.email) {
      const notes = await InvestorNotification.find({ investorEmail: mu.email })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      notifications = notes.map((n) => ({
        _id: n._id,
        message: n.message || n.title || '',
        read: n.read === true,
        createdAt: n.createdAt,
        source: mapInvestorNotifType(n.type),
      }));
    }

    res.json({ success: true, notifications });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/notifications — admin: view queue
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;
    const filter = status === 'all' ? {} : { status };
    const notifications = await PendingNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    const counts = await PendingNotification.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ success: true, notifications, counts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/notifications/process — admin triggers queue flush
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const results = await processQueue(Number(req.query.limit) || 30);
    res.json({ success: true, ...results });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/notifications/send — admin sends one-off notification
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { recipientEmail, recipientName, recipientPhone, message, source } = req.body;
    if (!recipientEmail && !recipientPhone) return res.status(400).json({ error: 'Email or phone required' });
    const n = await PendingNotification.create({
      recipientEmail,
      recipientName,
      recipientPhone,
      message,
      source: source || 'admin_manual',
      status: 'pending',
    });
    const result = await dispatchNotification(n.toObject());
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// GET /api/notifications/stats — admin dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [total, pending, sent, failed] = await Promise.all([
      PendingNotification.countDocuments(),
      PendingNotification.countDocuments({ status: 'pending' }),
      PendingNotification.countDocuments({ status: 'sent' }),
      PendingNotification.countDocuments({ status: 'failed' }),
    ]);
    res.json({ success: true, total, pending, sent, failed });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin: dispatch a single queued notification (email or SMS)
router.post('/item/:id/dispatch', authenticateToken, async (req, res) => {
  try {
    const doc = await PendingNotification.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    const { sent, error } = await dispatchNotification(doc);
    res.json({ success: true, sent, error });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin: manual status update
router.put('/item/:id/status', authenticateToken, async (req, res) => {
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
    res.json({ success: true, notification: updated });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
