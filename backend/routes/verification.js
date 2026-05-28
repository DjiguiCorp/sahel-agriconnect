import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import VerificationCode from '../models/VerificationCode.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import { farmerTelephoneQuery } from '../utils/phone.js';
import DeviceSession from '../models/DeviceSession.js';
import { confirmMagicCode } from '../services/otpAuthService.js';
import {
  codeEmailHtml,
  codeEmailSubject,
  normalizeLang,
} from '../utils/authEmailTemplates.js';

const router = express.Router();
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function expiresIn(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function normalizePhone(p) {
  return String(p || '').trim().replace(/\s+/g, '');
}

function farmerSummary(farmer) {
  if (!farmer) return null;
  return {
    id: farmer._id?.toString(),
    nom: farmer.nom,
    email: farmer.email || '',
    telephone: farmer.telephone,
    country: farmer.country,
    region: farmer.region,
    statut: farmer.statut,
  };
}

// POST /api/verify/send — send OTP to email or (dev) log for phone
router.post('/send', async (req, res) => {
  try {
    const purpose = String(req.body?.purpose || '').trim();
    const emailRaw = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const phoneRaw = req.body?.phone ? normalizePhone(req.body.phone) : '';
    const name = req.body?.name ? String(req.body.name).trim() : '';
    const lang = normalizeLang(req.body?.lang);
    const role = req.body?.role ? String(req.body.role).trim() : '';

    if (!purpose) return res.status(400).json({ error: 'purpose required' });
    if (!emailRaw && !phoneRaw) {
      return res.status(400).json({ error: 'Email or phone required' });
    }

    const email = emailRaw || '';
    const phone = phoneRaw || '';

    const farmerQuery = emailRaw ? { email: emailRaw } : farmerTelephoneQuery(phoneRaw);
    const existing = await Farmer.findOne(farmerQuery).lean();
    const isNewUser = !existing;

    const code = generateCode();
    const invalidateQ = { purpose, used: false };
    if (email) invalidateQ.email = email;
    if (phone) invalidateQ.phone = phone;
    await VerificationCode.updateMany(invalidateQ, { used: true });

    const record = await VerificationCode.create({
      email,
      phone,
      code,
      purpose,
      expiresAt: expiresIn(15),
    });

    const resend = getResend();
    if (emailRaw && resend) {
      try {
        const sendResult = await resend.emails.send({
          from: FROM,
          to: emailRaw,
          subject: codeEmailSubject(code, purpose, lang),
          html: codeEmailHtml(code, purpose, {
            name,
            email: emailRaw,
            lang,
            role,
          }),
        });
        console.log('[Resend] Email sent:', sendResult);
      } catch (sendErr) {
        console.error('[Resend] Send failed:', sendErr.message, sendErr);
      }
    } else if (emailRaw) {
      console.log(`[DEV] OTP email ${emailRaw}: ${code} (RESEND_API_KEY not set)`);
    }

    const smsSent = false; // SMS provider not yet configured — set to true when Twilio/Africa's Talking is live
    if (phoneRaw && !emailRaw) {
      console.log(`[PENDING SMS] OTP for ${phoneRaw}: ${code} — SMS provider not active. Configure TWILIO_* or AFRICASTALKING_* env vars.`);
    }

    res.json({
      success: true,
      verificationId: record._id.toString(),
      message: emailRaw ? 'Verification code sent to email' : 'Account registered — phone verification pending SMS activation',
      isNewUser,
      smsStatus: phoneRaw && !emailRaw
        ? (smsSent ? 'sent' : 'pending_provider')
        : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/verify/confirm — magic link + OTP (all roles)
router.post('/confirm', async (req, res) => {
  try {
    const result = await confirmMagicCode({
      code: req.body?.code,
      email: req.body?.email,
      phone: req.body?.phone,
      purpose: req.body?.purpose,
      role: req.body?.role,
      deviceHint: req.headers['user-agent']?.slice(0, 80) || '',
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({
      success: false,
      error: e.message,
      ...(e.code ? { code: e.code } : {}),
    });
  }
});

// GET /api/verify/magic — web magic link handler
// Called when user clicks the button in their email on a desktop browser.
// Validates the embedded OTP code, issues a JWT, and redirects to the dashboard.
// The Flutter app handles sahelagriconnect:// deep links separately.
router.get('/magic', async (req, res) => {
  try {
    const code = String(req.query.c || '').trim();
    const email = String(req.query.e || '').toLowerCase().trim();
    const purpose = String(req.query.p || '').trim();

    if (!code || !email || !purpose) {
      const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';
      return res.redirect(`${webBase}/auth/magic?error=invalid_link`);
    }

    // Call the existing confirm endpoint using a configurable backend base URL
    // (do NOT call localhost — this must work on Render)
    const backendBase = String(process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`)
      .replace(/\/$/, '');
    const selfUrl = `${backendBase}/api/verify/confirm`;
    const roleParam = String(req.query.r || req.query.role || 'farmer').trim();
    const confirmResponse = await fetch(selfUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email, purpose, role: roleParam }),
    });
    const confirmData = await confirmResponse.json();

    const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';

    if (!confirmData.success || !confirmData.token) {
      return res.redirect(`${webBase}/auth/magic?error=expired`);
    }

    // Redirect to web dashboard with token in URL fragment (not query param — stays client-side)
    // The MagicLinkVerify page reads this fragment and stores the JWT.
    const role = confirmData.role || roleParam || 'farmer';
    const dashRoutes = {
      farmer: '/inscription',
      investor: '/afri-yield/portal',
      cooperative: '/cooperative-portal',
      government: '/government-portal',
      ngo: '/ngo-portal',
      processor: '/processor-portal',
    };
    const dest = dashRoutes[role] || '/';
    return res.redirect(`${webBase}/auth/magic#token=${confirmData.token}&role=${role}&dest=${encodeURIComponent(dest)}`);

  } catch (err) {
    const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';
    return res.redirect(`${webBase}/auth/magic?error=server_error`);
  }
});

export default router;
