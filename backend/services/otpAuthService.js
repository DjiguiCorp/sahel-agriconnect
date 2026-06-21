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
import {
  codeEmailHtml,
  codeEmailSubject,
  normalizeLang,
} from '../utils/authEmailTemplates.js';
import { assertAccountExistsForLogin } from '../utils/authAccountGate.js';

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
export async function sendOtp({ purpose, email, phone, name, role, lang, country }) {
  const langNorm = normalizeLang(lang);
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

  // Login OTP: account must exist (registration flows use farmer_verify / coop_verify).
  if (purposeNorm === 'login') {
    await assertAccountExistsForLogin({
      role: role || 'farmer',
      email: emailRaw,
      phone: phoneRaw,
    });
    isNewUser = false;
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
    ...(country ? { country: String(country).trim() } : {}),
  });

  const resend = getResend();
  if (emailRaw && resend) {
    try {
      const sendResult = await resend.emails.send({
        from: FROM,
        to: emailRaw,
        subject: codeEmailSubject(code, purposeNorm, langNorm),
        html: codeEmailHtml(code, purposeNorm, {
          name,
          email: emailRaw,
          lang: langNorm,
          role: role || '',
        }),
      });
      console.log('[Resend] Email sent (send-otp):', sendResult);
    } catch (sendErr) {
      console.error('[Resend] Send failed (send-otp):', sendErr.message, sendErr);
      throw Object.assign(
        new Error('Email delivery failed. Please try again.'),
        { status: 500, code: 'EMAIL_SEND_FAILED' },
      );
    }
  } else if (emailRaw) {
    console.log(`[DEV] OTP email ${emailRaw}: ${code} (RESEND_API_KEY not set)`);
  }

  const smsSent = false;
  if (phoneRaw && !emailRaw) {
    console.log(
      `[PENDING SMS] OTP for ${phoneRaw}: ${code} — SMS provider not active. Configure TWILIO_* or AFRICASTALKING_* env vars.`,
    );
  }

  const emailDelivery = emailRaw
    ? resend
      ? 'sent'
      : 'dev_logged'
    : null;

  const otpCode =
    emailRaw && !resend ? code : null;

  return {
    success: true,
    verificationId: record._id.toString(),
    message: emailRaw
      ? resend
        ? 'Verification code sent to email'
        : 'Verification code created (email delivery not configured on server)'
      : 'Account registered — phone verification pending SMS activation',
    isNewUser,
    emailDelivery,
    otpCode,
    smsStatus: phoneRaw && !emailRaw ? (smsSent ? 'sent' : 'pending_provider') : null,
  };
}

async function accountExistsForRole(role, email, phone) {
  const r = String(role || '').toLowerCase();
  if (r === 'investor') return Boolean(await Investor.findOne({ email }).lean());
  if (r === 'cooperative') {
    return Boolean(
      await CooperativePlatformRegistration.findOne({
        email,
        status: 'active',
        paymentReceived: true,
      }).lean(),
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

  if (purpose === 'farmer_verify') {
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
      role: 'farmer',
      token,
      sessionSeed,
      user: farmerSummary(farmer),
      accountStatus: farmer.statut === 'Actif' ? 'active' : 'pending_vetting',
    };
  }

  if (purpose === 'login' && roleNorm === 'farmer') {
    const farmer = await findFarmerByContact(email, phone);
    if (!farmer) {
      throw Object.assign(
        new Error('No farmer account found. Please register first.'),
        {
          status: 404,
          code: 'USER_NOT_FOUND',
          errorFr: 'Aucun compte agriculteur trouvé. Veuillez vous inscrire.',
        },
      );
    }
    if (email) {
      await Farmer.findOneAndUpdate(
        { email },
        { emailVerified: true, verifiedAt: new Date() },
      );
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
      role: 'farmer',
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

/**
 * Magic-link / email-button confirmation (code + email + purpose).
 */
export async function confirmMagicCode({
  code,
  email,
  phone,
  purpose,
  role,
  deviceHint = '',
}) {
  const purposeNorm = String(purpose || '').trim();
  const emailNorm = email ? String(email).toLowerCase().trim() : '';
  const phoneNorm = phone ? normalizePhone(phone) : '';
  const codeNorm = String(code ?? '').trim();
  const roleNorm = String(role || 'farmer').toLowerCase();

  if (!purposeNorm || !codeNorm) {
    throw Object.assign(new Error('purpose and code required'), { status: 400 });
  }
  if (!emailNorm && !phoneNorm) {
    throw Object.assign(new Error('Email or phone required'), { status: 400 });
  }

  const q = {
    code: codeNorm,
    purpose: purposeNorm,
    used: false,
    expiresAt: { $gt: new Date() },
  };
  if (emailNorm) q.email = emailNorm;
  if (phoneNorm) q.phone = phoneNorm;

  const record = await VerificationCode.findOne(q);
  if (!record) {
    throw Object.assign(
      new Error('Invalid or expired code. Please request a new one.'),
      { status: 400 },
    );
  }

  record.used = true;
  await record.save();

  const recEmail = record.email || emailNorm;
  const recPhone = record.phone || phoneNorm;

  if (purposeNorm === 'farmer_verify') {
    const farmer = await findFarmerByContact(recEmail, recPhone);
    if (recEmail) {
      await Farmer.findOneAndUpdate(
        { email: recEmail },
        { emailVerified: true, verifiedAt: new Date() },
      );
    }
    if (!farmer) {
      return {
        success: true,
        verified: true,
        isNewUser: true,
        role: 'farmer',
        pendingRegistrationId: record._id.toString(),
      };
    }
    const token = jwt.sign(
      {
        role: 'farmer',
        id: farmer._id.toString(),
        email: farmer.email || recEmail,
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
      role: 'farmer',
      token,
      sessionSeed,
      user: farmerSummary(farmer),
      accountStatus: farmer.statut === 'Actif' ? 'active' : 'pending_vetting',
    };
  }

  if (purposeNorm === 'login') {
    await assertAccountExistsForLogin({
      role: roleNorm,
      email: recEmail,
      phone: recPhone,
    });
    const result = await issueRoleLoginToken(
      roleNorm,
      recEmail,
      recPhone,
      deviceHint,
    );
    const appRole = roleNorm === 'cooperative' ? 'cooperative' : roleNorm;
    return { ...result, role: appRole };
  }

  if (purposeNorm === 'coop_verify' && recEmail) {
    await CooperativePlatformRegistration.findOneAndUpdate(
      { email: recEmail },
      { emailVerified: true, verifiedAt: new Date() },
    );
  }

  return { success: true, verified: true };
}

export async function issueRoleLoginToken(role, email, phone, deviceHint = '') {
  await assertAccountExistsForLogin({ role, email, phone });

  if (role === 'farmer') {
    const farmer = await findFarmerByContact(email, phone);
    if (!farmer) {
      throw Object.assign(
        new Error('No farmer account found. Please register first.'),
        {
          status: 404,
          code: 'USER_NOT_FOUND',
          errorFr: 'Aucun compte agriculteur trouvé. Veuillez vous inscrire.',
        },
      );
    }
    if (email) {
      await Farmer.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { emailVerified: true, verifiedAt: new Date() },
      );
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
      role: 'farmer',
      token,
      sessionSeed,
      accountStatus: farmer.statut === 'Actif' ? 'active' : 'pending_vetting',
      user: {
        ...farmerSummary(farmer),
        name: farmer.nom,
      },
    };
  }

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
      role: 'investor',
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: investor.email, name: investor.fullName, status: investor.status },
    };
  }

  if (role === 'cooperative') {
    if (!email) throw Object.assign(new Error('Email required'), { status: 400 });
    const coop = await CooperativePlatformRegistration.findOne({
      email,
      status: 'active',
      paymentReceived: true,
    }).lean();
    if (!coop) {
      throw Object.assign(
        new Error(
          'No active cooperative account found. Complete registration at sahelagriconnect.com/cooperative-registration',
        ),
        { status: 404, code: 'ACCOUNT_NOT_FOUND' },
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
      role: 'cooperative',
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: coop.email, name: coop.cooperativeName },
    };
  }

  if (role === 'government' || role === 'ngo') {
    if (!email) throw Object.assign(new Error('Email required'), { status: 400 });
    const adminQuery =
      role === 'ngo'
        ? { email, orgType: 'ngo' }
        : { email, orgType: { $in: ['government', 'enterprise', 'international_org'] } };
    const admin = await GovernmentAdmin.findOne(adminQuery).lean();
    if (!admin) {
      throw Object.assign(
        new Error('No account found. Request access on the web first.'),
        { status: 404, code: 'ACCOUNT_NOT_FOUND' },
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
      role: deviceRole,
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
        new Error(
          'No processor account found. Complete registration at sahelagriconnect.com/platform-licensing',
        ),
        { status: 404, code: 'not_registered' },
      );
    }
    const token = jwt.sign(
      {
        role: 'processor',
        id: p._id.toString(),
        email: p.email || email,
        name: p.nom,
        country: p.country || null,
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
      role: 'processor',
      token,
      sessionSeed,
      accountStatus: 'active',
      user: { email: p.email, nom: p.nom },
    };
  }

  throw Object.assign(new Error('Unsupported role'), { status: 400 });
}
