import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import VerificationCode from '../models/VerificationCode.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import { farmerTelephoneQuery } from '../utils/phone.js';
import DeviceSession from '../models/DeviceSession.js';

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

function codeEmail(code, purpose, name = '') {
  const labels = {
    farmer_verify: { title: 'Verify your farmer account', fr: 'Vérifiez votre compte agriculteur' },
    coop_verify: { title: 'Verify your cooperative account', fr: 'Vérifiez votre compte coopérative' },
    login: { title: 'Your login code', fr: 'Votre code de connexion' },
    password_reset: { title: 'Reset your password', fr: 'Réinitialisez votre mot de passe' },
  };
  const label = labels[purpose] || labels.login;
  return `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
    <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#B5850A;margin:0;font-size:22px;">Sahel AgriConnect</h1>
      <p style="color:white;margin:4px 0 0;font-size:13px;">${label.fr}</p>
    </div>
    <div style="padding:32px;background:white;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;text-align:center;">
      ${name ? `<p style="color:#333;margin-bottom:20px;">Bonjour <strong>${name}</strong>,</p>` : ''}
      <p style="color:#555;margin-bottom:24px;">Votre code de vérification est :</p>
      <div style="background:#f0f9f4;border:2px solid #1a3c2e;border-radius:12px;padding:24px;display:inline-block;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:bold;color:#1a3c2e;letter-spacing:8px;font-family:monospace;">${code}</span>
      </div>
      <p style="color:#999;font-size:13px;">Ce code expire dans <strong>15 minutes</strong>.</p>
      <p style="color:#999;font-size:12px;margin-top:16px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
    </div>
  </div>`;
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
      await resend.emails.send({
        from: FROM,
        to: emailRaw,
        subject: `${code} — Code de vérification Sahel AgriConnect`,
        html: codeEmail(code, purpose, name),
      });
    } else if (emailRaw) {
      console.log(`[DEV] OTP email ${emailRaw}: ${code}`);
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

// POST /api/verify/confirm — validate OTP (farmer_verify issues JWT when farmer exists)
router.post('/confirm', async (req, res) => {
  try {
    const purpose = String(req.body?.purpose || '').trim();
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const phone = req.body?.phone ? normalizePhone(req.body.phone) : '';
    const code = String(req.body?.code ?? '').trim();

    if (!purpose || !code) {
      return res.status(400).json({ error: 'purpose and code required' });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone required' });
    }

    const q = {
      code,
      purpose,
      used: false,
      expiresAt: { $gt: new Date() },
    };
    if (email) q.email = email;
    if (phone) q.phone = phone;

    const record = await VerificationCode.findOne(q);

    if (!record) {
      return res.status(400).json({
        error: 'Invalid or expired code. Please request a new one.',
      });
    }

    record.used = true;
    await record.save();

    if (purpose === 'farmer_verify') {
      const farmerQuery = email ? { email } : farmerTelephoneQuery(phone);
      const farmer = await Farmer.findOne(farmerQuery).lean();

      if (email) {
        await Farmer.findOneAndUpdate(
          { email },
          { emailVerified: true, verifiedAt: new Date() },
        );
      }

      if (!farmer) {
        return res.json({
          success: true,
          verified: true,
          isNewUser: true,
          pendingRegistrationId: record._id.toString(),
        });
      }

      const token = jwt.sign(
        {
          role: 'farmer',
          id: farmer._id.toString(),
          email: farmer.email || email,
          nom: farmer.nom,
        },
        process.env.JWT_SECRET,
        { expiresIn: '90d' },
      );

      // Issue a device session seed for biometric re-login (no OTP needed on same device)
      const sessionSeed = await DeviceSession.issue(
        farmer._id.toString(),
        'farmer',
        req.headers['user-agent']?.slice(0, 80) || '',
      );
      return res.json({
        success: true,
        verified: true,
        isNewUser: false,
        token,
        role: 'farmer',
        user: farmerSummary(farmer),
        sessionSeed, // store this in flutter_secure_storage; never log it
      });
    }

    if (purpose === 'coop_verify') {
      if (email) {
        await CooperativePlatformRegistration.findOneAndUpdate(
          { email: email.toLowerCase().trim() },
          { emailVerified: true, verifiedAt: new Date() },
        );
      }
    }

    return res.json({ success: true, verified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
