import express from 'express';
import crypto from 'crypto';
import Investor from '../models/Investor.js';
import InvestorKYC, { getCountryCategory } from '../models/InvestorKYC.js';
import { authenticateInvestor } from '../middleware/auth.js';

const router = express.Router();

// Hosted UI is verify.didit.me — API is verification.didit.me (v3).
// Calling verify.didit.me/v1/session/ returns a Next.js HTML 404 page.
const DIDIT_SESSION_URL = 'https://verification.didit.me/v3/session/';

function mapDiditStatus(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (['approved', 'accept', 'accepted', 'completed', 'success'].includes(s)) {
    return 'approved';
  }
  if (['declined', 'rejected', 'failed', 'denied'].includes(s)) {
    return 'declined';
  }
  if (['expired', 'abandoned', 'cancelled', 'canceled'].includes(s)) {
    return 'expired';
  }
  return 'pending';
}

function verifyWebhookSecret(headerValue) {
  const expected = String(process.env.DIDIT_WEBHOOK_SECRET || '');
  const provided = String(headerValue || '');
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * POST /api/didit/start
 * Auth: investor JWT. Creates a Didit session and returns verification_url.
 */
router.post('/start', authenticateInvestor, async (req, res) => {
  try {
    const apiKey = process.env.DIDIT_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: 'Didit is not configured (missing DIDIT_API_KEY)',
      });
    }

    const email = String(req.investorEmail || '').toLowerCase().trim();
    const investor = await Investor.findOne({ email });
    if (!investor) {
      return res.status(404).json({ success: false, error: 'Investor not found' });
    }

    const userId = investor._id.toString();
    // Align with Didit vendor_data = user id (also expose as req.user for logging)
    req.user = { id: userId, email };

    const callback =
      process.env.DIDIT_REDIRECT_URL ||
      'https://sahelagriconnect.com/verify/callback';

    // workflow_id is required by Didit v3 (Console → Workflows → copy UUID).
    // Prefer DIDIT_WORKFLOW_ID; fall back to DIDIT_APPLICATION_ID if that env holds the workflow UUID.
    const workflowId =
      process.env.DIDIT_WORKFLOW_ID || process.env.DIDIT_APPLICATION_ID || '';
    if (!workflowId) {
      return res.status(503).json({
        success: false,
        error:
          'Didit workflow_id missing — set DIDIT_WORKFLOW_ID (or DIDIT_APPLICATION_ID) to your KYC workflow UUID from the Didit Console',
      });
    }

    // Didit v3: authenticate with x-api-key (no OAuth / client_secret)
    const body = {
      workflow_id: workflowId,
      vendor_data: req.user.id,
      callback,
    };
    if (process.env.DIDIT_VENDOR_DATA) {
      body.metadata = { vendor: process.env.DIDIT_VENDOR_DATA };
    }

    console.log('Didit request:', {
      url: DIDIT_SESSION_URL,
      headers: {
        'x-api-key': process.env.DIDIT_API_KEY?.slice(0, 10) + '...',
      },
      body: {
        workflow_id: workflowId,
        callback,
        vendor_data: req.user.id,
        ...(body.metadata ? { metadata: body.metadata } : {}),
      },
    });

    const response = await fetch(DIDIT_SESSION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        // Also send Bearer for compatibility with older docs / proxies
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Log raw text first — do not parse as JSON before logging
    const responseText = await response.text();
    console.error('Didit response status:', response.status);
    console.error('Didit response body:', responseText);

    if (!response.ok) {
      return res.status(500).json({
        error: 'Didit session creation failed',
        details: responseText,
        status: response.status,
        hint:
          response.status === 404
            ? 'Wrong Didit API host/path — use https://verification.didit.me/v3/session/'
            : response.status === 400
              ? 'Check workflow_id (must be a KYC Workflow UUID from Didit Console, not Application ID unless they match)'
              : undefined,
      });
    }

    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error: 'Didit session creation failed',
        details: responseText,
        status: response.status,
      });
    }

    const sessionId = data.session_id || data.sessionId || data.id;
    const verificationUrl =
      data.verification_url || data.url || data.verificationUrl;

    if (!sessionId || !verificationUrl) {
      console.error('[Didit] unexpected session response:', responseText);
      return res.status(500).json({
        error: 'Didit session creation failed',
        details: responseText,
        status: response.status,
      });
    }

    const country = investor.countryOfResidence || 'United States';
    await InvestorKYC.findOneAndUpdate(
      { investorEmail: email },
      {
        $set: {
          investorEmail: email,
          investorName: investor.fullName,
          countryOfResidence: country,
          countryCategory: getCountryCategory(country),
          diditSessionId: String(sessionId),
          diditStatus: 'pending',
          diditVendorData: userId,
        },
        $setOnInsert: {
          status: 'in_progress',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      verification_url: verificationUrl,
      session_id: sessionId,
    });
  } catch (e) {
    console.error('[Didit] start error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/didit/webhook
 * No JWT. Verifies x-webhook-secret with timingSafeEqual.
 */
router.post('/webhook', async (req, res) => {
  try {
    const headerSecret =
      req.headers['x-webhook-secret'] ||
      req.headers['x-didit-webhook-secret'];
    if (!verifyWebhookSecret(headerSecret)) {
      return res.status(401).json({ success: false, error: 'Invalid webhook secret' });
    }

    const payload = req.body || {};
    const vendorData = String(
      payload.vendor_data ||
        payload.vendorData ||
        payload.session?.vendor_data ||
        ''
    ).trim();
    const sessionId = String(
      payload.session_id ||
        payload.sessionId ||
        payload.verificationSessionId ||
        payload.session?.session_id ||
        ''
    ).trim();
    const rawStatus =
      payload.status ||
      payload.decision ||
      payload.session?.status ||
      payload.verification_status;
    const diditStatus = mapDiditStatus(rawStatus);

    let kyc = null;
    if (vendorData) {
      const investor = await Investor.findById(vendorData).lean();
      if (investor?.email) {
        kyc = await InvestorKYC.findOne({
          investorEmail: String(investor.email).toLowerCase(),
        });
      }
      if (!kyc) {
        kyc = await InvestorKYC.findOne({ diditVendorData: vendorData });
      }
    }
    if (!kyc && sessionId) {
      kyc = await InvestorKYC.findOne({ diditSessionId: sessionId });
    }

    if (!kyc) {
      console.warn('[Didit] webhook: KYC record not found', {
        vendorData,
        sessionId,
      });
      // Still 200 so Didit does not retry forever for unknown sessions
      return res.status(200).json({ received: true, matched: false });
    }

    kyc.diditStatus = diditStatus;
    kyc.diditRawPayload = payload;
    if (sessionId) kyc.diditSessionId = sessionId;
    if (vendorData) kyc.diditVendorData = vendorData;
    if (diditStatus === 'approved') {
      kyc.diditVerifiedAt = new Date();
      // Align legacy status when Didit approves identity
      if (kyc.status !== 'approved') {
        kyc.status = 'approved';
        kyc.reviewedAt = new Date();
      }
    }
    await kyc.save();

    return res.status(200).json({ received: true, matched: true, diditStatus });
  } catch (e) {
    console.error('[Didit] webhook error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
