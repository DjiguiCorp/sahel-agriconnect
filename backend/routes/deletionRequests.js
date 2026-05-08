import express from 'express';
import DeletionRequest from '../models/DeletionRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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

