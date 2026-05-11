import express from 'express';
import mongoose from 'mongoose';
import DeletionRequest from '../models/DeletionRequest.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Processor from '../models/Processor.js';
import Investor from '../models/Investor.js';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import DiasporaProducer from '../models/DiasporaProducer.js';
import DiasporaBuyer from '../models/DiasporaBuyer.js';
import Investment from '../models/Investment.js';
import ProduceListing from '../models/ProduceListing.js';
import CooperativeInvitation from '../models/CooperativeInvitation.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const MODEL_MAP = {
  farmer: Farmer,
  cooperative: CooperativePlatformRegistration,
  processor: Processor,
  investor: Investor,
  government: GovernmentAdmin,
  ngo: GovernmentAdmin,
  enterprise: GovernmentAdmin,
  diaspora_producer: DiasporaProducer,
  diaspora_buyer: DiasporaBuyer,
};

async function notifyUserOfDeletion(email, name, userType, reason, isFr = false) {
  if (!email || !process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: isFr
        ? 'Sahel AgriConnect — Votre compte a été supprimé'
        : 'Sahel AgriConnect — Your account has been deleted',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#B5850A;margin:0;font-size:20px;">Sahel AgriConnect</h1>
          </div>
          <div style="padding:28px;background:white;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
            <p style="color:#333;">Bonjour ${name || 'Utilisateur'},</p>
            <p style="color:#555;">Votre compte (${userType}) sur Sahel AgriConnect a été supprimé par notre équipe d'administration.</p>
            ${reason ? `<p style="color:#555;"><strong>Raison :</strong> ${reason}</p>` : ''}
            <p style="color:#555;">Toutes vos données ont été supprimées de notre système conformément à notre politique de confidentialité.</p>
            <p style="color:#555;">Si vous pensez que cette suppression est une erreur, contactez-nous à <a href="mailto:info@djiguicorporation.org" style="color:#1a3c2e;">info@djiguicorporation.org</a>.</p>
            <p style="color:#333;margin-top:24px;">Cordialement,<br><strong>L'équipe Sahel AgriConnect</strong></p>
          </div>
        </div>`,
    });
  } catch {
    /* best-effort */
  }
}

/** Shared hard-delete logic for admin single + bulk routes */
async function runAdminHardDelete(type, id, { reason, notify, isFr = false }) {
  if (!MODEL_MAP[type]) {
    return { ok: false, status: 400, error: `Unknown type: ${type}` };
  }

  const Model = MODEL_MAP[type];
  const user = await Model.findById(id).lean();
  if (!user) return { ok: false, status: 404, error: 'User not found' };

  const email = user.email || user.emailContact;
  const name =
    user.nom ||
    user.name ||
    user.fullName ||
    user.cooperativeName ||
    user.nomCooperative ||
    user.organization ||
    'Unknown';

  if (type === 'investor') {
    const activeInvestments = await Investment.countDocuments({
      investorEmail: email,
      status: { $in: ['active', 'paused'] },
    });
    if (activeInvestments > 0) {
      return {
        ok: false,
        status: 409,
        error: `Cannot delete investor with ${activeInvestments} active investment(s). Resolve investments first or mark them as completed.`,
        activeInvestments,
      };
    }
  }

  if (type === 'farmer') {
    const oid = mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null;
    const or = [{ farmerEmail: email }];
    if (oid) or.push({ farmerId: oid });
    await ProduceListing.deleteMany({ $or: or });
    if (email) await CooperativeInvitation.deleteMany({ inviteeEmail: email });
  }
  if (type === 'cooperative') {
    await CooperativeInvitation.deleteMany({ cooperativeId: id });
    await ProduceListing.updateMany(
      { cooperativeId: id },
      { cooperativeId: null, cooperativeName: '[Deleted cooperative]' }
    );
  }
  if (type === 'investor' && email) {
    await Investment.updateMany(
      { investorEmail: email },
      { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Account deleted by admin' }
    );
  }

  await Model.findByIdAndDelete(id);

  let auditUserType = type;
  if (Model === GovernmentAdmin && user.orgType) {
    const ot = String(user.orgType);
    if (['government', 'ngo', 'enterprise', 'international_org'].includes(ot)) auditUserType = ot;
  }

  await DeletionRequest.create({
    userType: auditUserType,
    userName: name,
    userEmail: email || 'unknown@deleted.local',
    reason: reason || 'Deleted by admin',
    status: 'completed',
    confirmedByAdmin: true,
    adminNotes: `Hard deleted by admin on ${new Date().toISOString()}. Reason: ${reason || 'Not provided'}`,
    scheduledDeletionDate: new Date(),
  });

  if (email) {
    await PendingNotification.deleteMany({ recipientEmail: email });
  }

  if (notify && email) {
    await notifyUserOfDeletion(email, name, type, reason, isFr);
  }

  return {
    ok: true,
    deleted: { id: String(id), type, name, email },
    message: `${name} (${type}) deleted successfully`,
  };
}

// POST /api/deletion-requests — submit request (public)
router.post('/', async (req, res) => {
  try {
    const {
      userType,
      userName,
      userEmail,
      hasActiveInvestment,
      activeInvestmentIds,
      reason,
    } = req.body;

    const noticePeriodStartDate = hasActiveInvestment ? new Date() : null;

    let scheduledDeletionDate;
    if (hasActiveInvestment) {
      // 6 months notice for investors with active investments
      scheduledDeletionDate = new Date();
      scheduledDeletionDate.setMonth(scheduledDeletionDate.getMonth() + 6);
    } else {
      // 30 days for everyone else
      scheduledDeletionDate = new Date();
      scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);
    }

    const request = await DeletionRequest.create({
      userType,
      userName,
      userEmail,
      hasActiveInvestment: hasActiveInvestment || false,
      activeInvestmentIds: activeInvestmentIds || [],
      reason,
      status: hasActiveInvestment ? 'notice_period' : 'pending',
      noticePeriodStartDate,
      scheduledDeletionDate,
    });

    // Notify admin via email (best-effort)
    const urgency = hasActiveInvestment
      ? '🚨 INVESTOR WITH ACTIVE INVESTMENT'
      : '🗑️ Account Deletion';

    try {
      const { Resend } = await import('resend');
      const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
      if (resend) {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: process.env.ADMIN_EMAIL || 'info@djiguicorporation.org',
          subject: `${urgency} — Deletion Request from ${userName} (${userEmail})`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:${hasActiveInvestment ? '#dc2626' : '#1a3c2e'};padding:24px;border-radius:8px 8px 0 0;">
                <h1 style="color:white;margin:0;font-size:20px;">${urgency}</h1>
              </div>
              <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Name</td><td style="padding:8px 0;color:#555;">${userName}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Email</td><td style="padding:8px 0;color:#555;">${userEmail}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#333;">User Type</td><td style="padding:8px 0;color:#555;">${userType}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Active Investment</td><td style="padding:8px 0;color:${hasActiveInvestment ? '#dc2626' : '#555'};font-weight:${hasActiveInvestment ? 'bold' : 'normal'};">${hasActiveInvestment ? 'YES — 6 month notice required' : 'No'}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Scheduled Deletion</td><td style="padding:8px 0;color:#555;">${scheduledDeletionDate.toLocaleDateString()}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Reason</td><td style="padding:8px 0;color:#555;">${reason || 'Not provided'}</td></tr>
                </table>
                ${
                  hasActiveInvestment
                    ? `
                <div style="background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:16px;margin-top:16px;">
                  <p style="margin:0;color:#991b1b;font-weight:bold;">ACTION REQUIRED:</p>
                  <ol style="margin:8px 0 0;padding-left:20px;color:#555;line-height:1.8;">
                    <li>Contact investor within 48 hours to confirm notice period</li>
                    <li>Calculate final payout amount</li>
                    <li>Schedule final payout for ${scheduledDeletionDate.toLocaleDateString()}</li>
                    <li>Process data deletion after payout is confirmed sent</li>
                  </ol>
                </div>`
                    : ''
                }
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    res.json({
      success: true,
      request,
      hasActiveInvestment: hasActiveInvestment || false,
      scheduledDeletionDate,
      noticePeriodStartDate,
      message: hasActiveInvestment
        ? 'Deletion request received. 6-month notice period begins today.'
        : 'Deletion request received. Account will be deleted within 30 days.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/deletion-requests — admin only
router.get('/', authenticateToken, async (req, res) => {
  const requests = await DeletionRequest.find().sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// GET /api/deletion-requests/admin/users — search any user type for deletion (register before /:id)
router.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    const { type, search } = req.query;
    if (!type || !MODEL_MAP[type]) {
      return res.status(400).json({
        error:
          'Valid type required: farmer, cooperative, processor, investor, government, ngo, enterprise, diaspora_producer, diaspora_buyer',
      });
    }

    const Model = MODEL_MAP[type];
    const searchRegex = search ? new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    let query = {};
    if (searchRegex) {
      if (type === 'farmer') {
        query = {
          $or: [{ nom: searchRegex }, { email: searchRegex }, { telephone: searchRegex }],
        };
      } else if (type === 'cooperative') {
        query = {
          $or: [
            { cooperativeName: searchRegex },
            { nomCooperative: searchRegex },
            { email: searchRegex },
            { leaderName: searchRegex },
          ],
        };
      } else if (type === 'government' || type === 'ngo' || type === 'enterprise') {
        query = {
          orgType: type,
          $or: [{ name: searchRegex }, { email: searchRegex }, { organization: searchRegex }],
        };
      } else {
        query = {
          $or: [{ name: searchRegex }, { email: searchRegex }, { fullName: searchRegex }, { nom: searchRegex }],
        };
      }
    } else if (type === 'government' || type === 'ngo' || type === 'enterprise') {
      query = { orgType: type };
    }

    const users = await Model.find(query)
      .select(
        '_id nom name fullName email emailContact cooperativeName nomCooperative leaderName organization country status statut orgType createdAt'
      )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, users, type });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/deletion-requests/admin/bulk — delete multiple users at once
router.delete('/admin/bulk', authenticateToken, async (req, res) => {
  try {
    const { users: userList, reason, notify = true } = req.body || {};
    if (!Array.isArray(userList) || userList.length === 0) {
      return res.status(400).json({ error: 'users array required' });
    }
    if (userList.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 users per bulk delete' });
    }

    const results = { success: [], failed: [] };
    for (const { type, id } of userList) {
      try {
        const r = await runAdminHardDelete(type, id, { reason, notify });
        if (r.ok) results.success.push({ id, type });
        else results.failed.push({ id, type, error: r.error, status: r.status });
      } catch (e) {
        results.failed.push({ id, type, error: e.message });
      }
    }

    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/deletion-requests/admin/users/:type/:id — hard delete a user
router.delete('/admin/users/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason, notify = true } = req.body || {};

    const isFr = String(req.headers['accept-language'] || '')
      .toLowerCase()
      .startsWith('fr');

    const result = await runAdminHardDelete(type, id, { reason, notify, isFr });
    if (!result.ok) {
      return res.status(result.status || 400).json({
        error: result.error,
        activeInvestments: result.activeInvestments,
      });
    }

    res.json({
      success: true,
      message: result.message,
      deleted: result.deleted,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/deletion-requests/:id — update status — admin only
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await DeletionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });

    // If admin is marking as completed — purge/anonymize the user data
    if (req.body.status === 'completed' && request.status !== 'completed') {
      const email = request.userEmail;
      const deletedEmail = `deleted_${Date.now()}@removed.com`;

      // Import all relevant models
      const [
        { default: Investor },
        { default: Farmer },
        { default: Cooperative },
        { default: CooperativePlatformRegistration },
        { default: PendingNotification },
        { default: InvestorNotification },
        { default: ExpertRequest },
        { default: DiasporaProducer },
        { default: DiasporaBuyer },
        { default: DiasporaContactInquiry },
      ] = await Promise.all([
        import('../models/Investor.js'),
        import('../models/Farmer.js'),
        import('../models/Cooperative.js'),
        import('../models/CooperativePlatformRegistration.js'),
        import('../models/PendingNotification.js'),
        import('../models/InvestorNotification.js'),
        import('../models/ExpertRequest.js'),
        import('../models/DiasporaProducer.js'),
        import('../models/DiasporaBuyer.js'),
        import('../models/DiasporaContactInquiry.js'),
      ]);

      // Purge based on user type
      if (request.userType === 'investor') {
        // Anonymize investor record — do NOT fully delete (keep for financial records)
        await Investor.findOneAndUpdate(
          { email },
          {
            fullName: '[DELETED]',
            email: deletedEmail,
            phone: null,
            countryOfResidence: null,
            message: null,
            status: 'declined',
          }
        );

        // Delete investor notifications (non-financial)
        await InvestorNotification.deleteMany({ investorEmail: email });
      } else if (request.userType === 'farmer') {
        // Anonymize farmer record (keep required fields populated)
        await Farmer.findOneAndUpdate(
          { email },
          {
            nom: '[SUPPRIMÉ]',
            email: deletedEmail,
            telephone: 'DELETED',
            latitude: '0',
            longitude: '0',
            localisation: '0, 0',
          }
        );

        // Delete support/expert requests tied to farmer email
        await ExpertRequest.deleteMany({ farmerEmail: email });
      } else if (request.userType === 'cooperative') {
        // Prefer platform registration cooperative records (have email/phone/status)
        await CooperativePlatformRegistration.findOneAndUpdate(
          { email },
          {
            cooperativeName: '[SUPPRIMÉ]',
            leaderName: '[SUPPRIMÉ]',
            email: deletedEmail,
            phone: null,
            status: 'declined',
          }
        );

        // Also anonymize any legacy cooperative record if it exists (no email field in schema)
        // (best effort: no-op if not found)
        await Cooperative.updateMany(
          { contact: email },
          {
            responsable: '[SUPPRIMÉ]',
            contact: deletedEmail,
            nom: '[SUPPRIMÉ]',
            localisation: '[SUPPRIMÉ]',
          }
        );
      } else if (request.userType === 'diaspora_producer') {
        await DiasporaProducer.findOneAndUpdate(
          { email },
          {
            fullName: '[DELETED]',
            email: deletedEmail,
            phone: 'DELETED',
            whatsapp: null,
            cooperativeName: null,
            region: null,
            products: [],
            monthlyVolumeKg: null,
            status: 'inactive',
          }
        );

        // Best-effort: remove inquiries where this email was used
        await DiasporaContactInquiry.deleteMany({ contactEmail: email });
      } else if (request.userType === 'diaspora_buyer') {
        await DiasporaBuyer.findOneAndUpdate(
          { email },
          {
            fullName: '[DELETED]',
            email: deletedEmail,
            phone: null,
            whatsapp: null,
            businessName: '[DELETED]',
            cityState: null,
            productsSought: [],
            monthlyVolumeNeededKg: null,
            status: 'contacted',
          }
        );
      }

      // Always clean up pending notifications for this email
      await PendingNotification.deleteMany({ recipientEmail: email });

      console.log(`✅ Data purged for ${request.userType}: ${email}`);
    }

    // Update the request status (and other fields sent by admin)
    const updated = await DeletionRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, request: updated });
  } catch (err) {
    console.error('Deletion error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

