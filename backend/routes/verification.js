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

function codeEmail(code, purpose, name = '', email = '') {
  const labels = {
    farmer_verify: { title: 'Verify your farmer account', fr: 'Vérifiez votre compte agriculteur' },
    coop_verify: { title: 'Verify your cooperative account', fr: 'Vérifiez votre compte coopérative' },
    login: { title: 'Your sign-in link', fr: 'Votre lien de connexion' },
    password_reset: { title: 'Reset your password', fr: 'Réinitialisez votre mot de passe' },
  };
  const label = labels[purpose] || labels.login;

  // Magic link: embeds the code in a URL so the user can click instead of type.
  // Works on web; on mobile with app installed, the deep link opens the app directly.
  const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';
  const magicUrl = `${webBase}/auth/magic?c=${encodeURIComponent(code)}&e=${encodeURIComponent(email)}&p=${encodeURIComponent(purpose)}`;

  return `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
    <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#B5850A;margin:0;font-size:22px;">Sahel AgriConnect</h1>
      <p style="color:white;margin:4px 0 0;font-size:13px;">${label.fr}</p>
    </div>
    <div style="padding:32px;background:white;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;text-align:center;">
      ${name ? `<p style="color:#333;margin-bottom:8px;">Bonjour <strong>${name}</strong>,</p>` : ''}
      <p style="color:#555;margin-bottom:24px;font-size:15px;">
        Cliquez sur le bouton ci-dessous pour vous connecter.<br>
        <span style="font-size:13px;color:#999;">Si l'application est installée sur votre téléphone, elle s'ouvrira automatiquement.</span>
      </p>
      <a href="${magicUrl}"
         style="display:inline-block;background:#B5850A;color:white;text-decoration:none;
                padding:16px 40px;border-radius:12px;font-size:16px;font-weight:bold;
                margin-bottom:28px;letter-spacing:0.5px;">
        ✓ Se connecter à Sahel AgriConnect
      </a>
      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:4px;">
        <p style="color:#aaa;font-size:12px;margin-bottom:12px;">
          Bouton bloqué ? Entrez ce code manuellement :
        </p>
        <div style="background:#f0f9f4;border:2px solid #1a3c2e;border-radius:12px;padding:16px;display:inline-block;margin-bottom:12px;">
          <span style="font-size:32px;font-weight:bold;color:#1a3c2e;letter-spacing:8px;font-family:monospace;">${code}</span>
        </div>
        <p style="color:#999;font-size:12px;">Ce lien expire dans <strong>15 minutes</strong>.</p>
      </div>
      <p style="color:#ccc;font-size:11px;margin-top:20px;">
        Si vous n'avez pas demandé ce lien, ignorez cet email.
      </p>
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
      try {
        const sendResult = await resend.emails.send({
          from: FROM,
          to: emailRaw,
          subject: `${code} — Code de vérification Sahel AgriConnect`,
          html: codeEmail(code, purpose, name, emailRaw),
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

    // Delegate to the existing /confirm logic by forwarding as a POST internally
    // (avoids duplicating the verification and JWT-issuance logic)
    const confirmReq = {
      body: { code, email, purpose },
      headers: req.headers,
    };
    let confirmResult = null;
    const mockRes = {
      status: (code) => ({ json: (data) => { confirmResult = { status: code, data }; } }),
      json: (data) => { confirmResult = { status: 200, data }; },
    };

    // Call the confirm handler inline — find the POST /confirm handler
    // and run its logic here, or make a fetch to self:
    const selfUrl = `http://localhost:${process.env.PORT || 5000}/api/verify/confirm`;
    const confirmResponse = await fetch(selfUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email, purpose }),
    });
    const confirmData = await confirmResponse.json();

    const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';

    if (!confirmData.success || !confirmData.token) {
      return res.redirect(`${webBase}/auth/magic?error=expired`);
    }

    // Redirect to web dashboard with token in URL fragment (not query param — stays client-side)
    // The MagicLinkVerify page reads this fragment and stores the JWT.
    const role = confirmData.role || 'farmer';
    const dashRoutes = {
      farmer: '/inscription',
      investor: '/afri-yield',
      cooperative: '/cooperative-registration',
      government: '/dashboard',
      ngo: '/dashboard',
      processor: '/platform-licensing',
    };
    const dest = dashRoutes[role] || '/';
    return res.redirect(`${webBase}/auth/magic#token=${confirmData.token}&role=${role}&dest=${encodeURIComponent(dest)}`);

  } catch (err) {
    const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';
    return res.redirect(`${webBase}/auth/magic?error=server_error`);
  }
});

export default router;
