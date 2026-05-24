import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import VerificationCode from '../models/VerificationCode.js';
import Farmer from '../models/Farmer.js';
import Investor from '../models/Investor.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import Processor from '../models/Processor.js';
import DeviceSession from '../models/DeviceSession.js';
import { normalizePhone, farmerTelephoneQuery } from '../utils/phone.js';

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
    farmer_verify: { fr: 'Vérifiez votre compte agriculteur' },
    login: { fr: 'Votre code de connexion' },
  };
  const label = labels[purpose] || labels.login;
  return `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
    <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#B5850A;margin:0;font-size:22px;">Sahel AgriConnect</h1>
      <p style="color:white;margin:4px 0 0;font-size:13px;">${label.fr}</p>
    </div>
    <div style="padding:32px;background:white;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;text-align:center;">
      ${name ? `<p style="color:#333;">Bonjour <strong>${name}</strong>,</p>` : ''}
      <div style="background:#f0f9f4;border:2px solid #1a3c2e;border-radius:12px;padding:24px;display:inline-block;margin:16px 0;">
        <span style="font-size:40px;font-weight:bold;color:#1a3c2e;letter-spacing:8px;font-family:monospace;">${code}</span>
      </div>
      <p style="color:#999;font-size:13px;">Ce code expire dans <strong>15 minutes</strong>.</p>
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

async function findFarmerByContact(email, phone) {
  if (email) return Farmer.findOne({ email: email.toLowerCase().trim() }).lean();
  if (phone) return Farmer.findOne(farmerTelephoneQuery(phone)).lean();
  return null;
}

/**
 * Mobile-compatible OTP send (returns verificationId).
 */
export async function sendOtp({ purpose, email, phone, name, role }) {
  const purposeNorm = String(purpose || 'login').trim();
  const emailRaw = email ? String(email).toLowerCase().trim() : '';
  const phoneRaw = phone ? normalizePhone(phone) : '';

  if (!purposeNorm) throw Object.assign(new Error('purpose required'), { status: 400 });
  if (!emailRaw && !phoneRaw) {
    throw Object.assign(new Error('Email or phone required'), { status: 400 });
  }

  let isNewUser = true;
  if (role === 'farmer' || purposeNorm === 'farmer_verify') {
    const existing = await findFarmerByContact(emailRaw, phoneRaw);
    isNewUser = !existing;
  } else if (emailRaw) {
    isNewUser = !(await accountExistsForRole(role, emailRaw, phoneRaw));
  }

  const code = generateCode();
  const invalidateQ = { purpose: purposeNorm, used: false };
  if (emailRaw) invalidateQ.email = emailRaw;
  if (phoneRaw) invalidateQ.phone = phoneRaw;
  await VerificationCode.updateMany(invalidateQ, { used: true });

  const record = await VerificationCode.create({
    email: emailRaw || '',
    phone: phoneRaw || '',
    code,
    purpose: purposeNorm,
    expiresAt: expiresIn(15),
  });

  const resend = getResend();
  if (emailRaw && resend) {
    await resend.emails.send({
      from: FROM,
      to: emailRaw,
      subject: `${code} — Code de vérification Sahel AgriConnect`,
      html: codeEmail(code, purposeNorm, name),
    });
  } else if (emailRaw) {
    console.log(`[DEV] OTP email ${emailRaw}: ${code}`);
  }

  const smsSent = false;
  if (phoneRaw && !emailRaw) {
    console.log(
      `[PENDING SMS] OTP for ${phoneRaw}: ${code} — SMS provider not active. Configure TWILIO_* or AFRICASTALKING_* env vars.`,
    );
  }

  return {
    success: true,
    verificationId: record._id.toString(),
    message: emailRaw
      ? 'Verification code sent to email'
      : 'Account registered — phone verification pending SMS activation',
    isNewUser,
    smsStatus: phoneRaw && !emailRaw ? (smsSent ? 'sent' : 'pending_provider') : null,
  };
}

async function accountExistsForRole(role, email, phone) {
  const r = String(role || '').toLowerCase();
  if (r === 'investor') return Boolean(await Investor.findOne({ email }).lean());
  if (r === 'cooperative') {
    return Boolean(
      await CooperativePlatformRegistration.findOne({ email }).lean(),
    );
  }
  if (r === 'government' || r === 'ngo') {
    return Boolean(await GovernmentAdmin.findOne({ email }).lean());
  }
  if (r === 'processor') {
    if (email) return Boolean(await Processor.findOne({ email }).lean());
    if (phone) return Boolean(await Processor.findOne(farmerTelephoneQuery(phone)).lean());
  }
  if (r === 'farmer') return Boolean(await findFarmerByContact(email, phone));
  return false;
}

/**
 * Mobile-compatible OTP verify (verificationId + otp).
 */
export async function verifyOtp({ verificationId, otp, role, deviceHint = '' }) {
  const code = String(otp ?? '').trim();
  if (!verificationId || !code) {
    throw Object.assign(new Error('verificationId and otp required'), { status: 400 });
  }

  const record = await VerificationCode.findOne({
    _id: verificationId,
    code,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw Object.assign(new Error('Invalid or expired code. Please request a new one.'), {
      status: 400,
    });
  }

  record.used = true;
  await record.save();

  const email = record.email || '';
  const phone = record.phone || '';
  const purpose = record.purpose;
  const roleNorm = String(role || 'farmer').toLowerCase();

  if (purpose === 'farmer_verify' || (purpose === 'login' && roleNorm === 'farmer')) {
    const farmer = await findFarmerByContact(email, phone);
    if (email) {
      await Farmer.findOneAndUpdate(
        { email },
        { emailVerified: true, verifiedAt: new Date() },
      );
    }
    if (!farmer) {
      return {
        success: true,
        verified: true,
        isNewUser: true,
        pendingRegistrationId: record._id.toString(),
      };
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
    const sessionSeed = await DeviceSession.issue(
      farmer._id.toString(),
      'farmer',
      deviceHint,
    );
    return {
      success: true,
      verified: true,
      isNewUser: false,
      token,
      sessionSeed,
      user: farmerSummary(farmer),
      accountStatus: farmer.statut === 'Actif' ? 'active' : 'pending_vetting',
    };
  }

  if (purpose === 'login') {
    return issueRoleLoginToken(roleNorm, email, phone, deviceHint);
  }

  return { success: true, verified: true };
}

async function issueRoleLoginToken(role, email, phone, deviceHint = '') {
  if (role === 'investor') {
    if (!email) throw Object.assign(new Error('Email required for investor login'), { status: 400 });
    const investor = await Investor.findOne({ email }).lean();
    if (!investor) {
      throw Object.assign(
        new Error('No investor account found. Register at sahelagriconnect.com/afri-yield/register'),
        { status: 404, code: 'not_registered' },
      );
    }
    const token = jwt.sign(
      { role: 'investor', email: investor.email, name: investor.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '90d' },
    );
    const sessionSeed = await DeviceSession.issue(
      investor._id.toString(),
      'investor',
      deviceHint,
    );
    return {
      success: true,
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: investor.email, name: investor.fullName, status: investor.status },
    };
  }

  if (role === 'cooperative') {
    if (!email) throw Object.assign(new Error('Email required'), { status: 400 });
    const coop = await CooperativePlatformRegistration.findOne({ email }).lean();
    if (!coop) {
      throw Object.assign(
        new Error('No cooperative account found. Register on the web first.'),
        { status: 404, code: 'not_registered' },
      );
    }
    if (coop.status !== 'active') {
      return {
        success: true,
        token: null,
        accountStatus: 'pending_vetting',
        message: 'Portal not yet activated. Contact support.',
      };
    }
    const token = jwt.sign(
      {
        role: 'cooperative_leader',
        coopId: coop._id,
        email: coop.email,
        country: coop.country,
        name: coop.cooperativeName,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' },
    );
    const sessionSeed = await DeviceSession.issue(
      coop._id.toString(),
      'cooperative',
      deviceHint,
    );
    return {
      success: true,
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: coop.email, name: coop.cooperativeName },
    };
  }

  if (role === 'government' || role === 'ngo') {
    if (!email) throw Object.assign(new Error('Email required'), { status: 400 });
    const admin = await GovernmentAdmin.findOne({ email }).lean();
    if (!admin) {
      throw Object.assign(
        new Error('No account found. Request access on the web first.'),
        { status: 404, code: 'not_registered' },
      );
    }
    if (admin.status !== 'active') {
      return { success: true, accountStatus: 'pending_vetting', message: 'Account not active.' };
    }
    const deviceRole = role === 'ngo' ? 'ngo' : 'government';
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        country: admin.country,
        countryCode: admin.countryCode,
        role: 'country_admin',
        name: admin.name,
        organization: admin.organization,
        orgType: admin.orgType || 'government',
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' },
    );
    const sessionSeed = await DeviceSession.issue(
      admin._id.toString(),
      deviceRole,
      deviceHint,
    );
    return {
      success: true,
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: admin.email, name: admin.name },
    };
  }

  if (role === 'processor') {
    const p = email
      ? await Processor.findOne({ email }).lean()
      : await Processor.findOne(farmerTelephoneQuery(phone)).lean();
    if (!p) {
      throw Object.assign(
        new Error('No processor account found. Register on the web first.'),
        { status: 404, code: 'not_registered' },
      );
    }
    const token = jwt.sign(
      {
        role: 'processor',
        id: p._id.toString(),
        email: p.email || email,
        name: p.nom,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' },
    );
    const sessionSeed = await DeviceSession.issue(
      p._id.toString(),
      'processor',
      deviceHint,
    );
    return {
      success: true,
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: p.email, nom: p.nom },
    };
  }

  throw Object.assign(new Error('Unsupported role'), { status: 400 });
}
