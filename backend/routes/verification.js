import express from 'express';
import crypto from 'crypto';
import { Resend } from 'resend';
import VerificationCode from '../models/VerificationCode.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';

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

// POST /api/verify/send — send OTP to email
router.post('/send', async (req, res) => {
  try {
    const { email, purpose, name } = req.body;
    if (!email || !purpose) return res.status(400).json({ error: 'Email and purpose required' });

    const code = generateCode();
    await VerificationCode.updateMany({ email: email.toLowerCase(), purpose, used: false }, { used: true });

    await VerificationCode.create({
      email: email.toLowerCase().trim(),
      code,
      purpose,
      expiresAt: expiresIn(15),
    });

    const resend = getResend();
    if (resend) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${code} — Code de vérification Sahel AgriConnect`,
        html: codeEmail(code, purpose, name),
      });
    } else {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/verify/confirm — validate OTP
router.post('/confirm', async (req, res) => {
  try {
    const { email, code, purpose } = req.body;
    if (!email || !code || !purpose) return res.status(400).json({ error: 'Email, code and purpose required' });

    const record = await VerificationCode.findOne({
      email: email.toLowerCase().trim(),
      code: String(code).trim(),
      purpose,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });

    record.used = true;
    await record.save();

    if (purpose === 'farmer_verify') {
      await Farmer.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { emailVerified: true, verifiedAt: new Date() }
      );
    }
    if (purpose === 'coop_verify') {
      await CooperativePlatformRegistration.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { emailVerified: true, verifiedAt: new Date() }
      );
    }

    res.json({ success: true, verified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
