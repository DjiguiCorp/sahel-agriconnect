import Farmer from '../models/Farmer.js';
import Investor from '../models/Investor.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import Processor from '../models/Processor.js';
import { normalizePhone, farmerTelephoneQuery } from './phone.js';

/** Reviewer / admin emails that may bypass registration checks. */
export const ADMIN_WHITELIST = [
  'coulibalyisabelle12@gmail.com',
  'info@djiguicorporation.org',
  'sahelagriconnect.test@gmail.com',
  'traore.pec@gmail.com',
  'ptessougue56@gmail.com',
  'elisabethtessougue@gmail.com',
  'coultessprince1@gmail.com',
];

const GOV_EMAIL_SUFFIXES = [
  '.gov',
  '.gouv',
  '.gov.ml',
  '.gov.sn',
  '.gov.bf',
  '.gov.gn',
  '.gouv.ml',
  '.gouv.sn',
  '.gouv.bf',
  '.gouv.ci',
  '.gouv.tg',
  '.gouv.bj',
  '.gouv.ne',
  '.gouv.mr',
];

const NGO_EMAIL_SUFFIXES = [
  '.org',
  '.gov',
  '.gouv',
  '.gov.ml',
  '.gov.sn',
  '.gov.bf',
  '.gouv.ml',
  '.gouv.sn',
  '.gouv.bf',
  '.gouv.ci',
];

function authError(status, code, error, errorFr) {
  const err = new Error(error);
  err.status = status;
  err.code = code;
  err.errorFr = errorFr;
  return err;
}

function isWhitelisted(emailLower) {
  return ADMIN_WHITELIST.includes(emailLower);
}

function emailEndsWithAny(email, suffixes) {
  return suffixes.some((s) => email.endsWith(s));
}

async function findFarmerByContact(email, phone) {
  if (email) {
    return Farmer.findOne({ email: email.toLowerCase().trim() }).lean();
  }
  if (phone) {
    return Farmer.findOne(farmerTelephoneQuery(phone)).lean();
  }
  return null;
}

/**
 * Ensures a registered account exists before login OTP / JWT.
 * Skipped for whitelisted emails (reviewers).
 * @throws Error with status, code, errorFr
 */
export async function assertAccountExistsForLogin({ role, email, phone }) {
  const roleNorm = String(role || 'farmer').toLowerCase();
  const emailLower = email ? String(email).toLowerCase().trim() : '';
  const phoneNorm = phone ? normalizePhone(phone) : '';

  if (!emailLower && !phoneNorm) {
    throw authError(
      400,
      'CONTACT_REQUIRED',
      'Email or phone required',
      'Email ou téléphone requis',
    );
  }

  if (emailLower && isWhitelisted(emailLower)) {
    return { whitelisted: true, role: roleNorm };
  }

  if (roleNorm === 'farmer') {
    const farmer = await findFarmerByContact(emailLower, phoneNorm);
    if (!farmer) {
      throw authError(
        404,
        'USER_NOT_FOUND',
        'No farmer account found. Please register first.',
        'Aucun compte agriculteur trouvé. Veuillez vous inscrire.',
      );
    }
    return { role: 'farmer', record: farmer };
  }

  if (roleNorm === 'cooperative') {
    if (!emailLower) {
      throw authError(400, 'EMAIL_REQUIRED', 'Email required', 'Email requis');
    }
    const coop = await CooperativePlatformRegistration.findOne({
      email: emailLower,
      status: 'active',
      paymentReceived: true,
    }).lean();
    if (!coop) {
      throw authError(
        404,
        'ACCOUNT_NOT_FOUND',
        'No active cooperative account found. Complete registration at sahelagriconnect.com/cooperative-registration',
        "Aucun compte coopérative actif. Complétez l'inscription sur sahelagriconnect.com",
      );
    }
    return { role: 'cooperative', record: coop };
  }

  if (roleNorm === 'government') {
    if (!emailLower) {
      throw authError(400, 'EMAIL_REQUIRED', 'Email required', 'Email requis');
    }
    if (!emailEndsWithAny(emailLower, GOV_EMAIL_SUFFIXES)) {
      throw authError(
        403,
        'INVALID_EMAIL_DOMAIN',
        'Government portal requires an official .gov or .gouv email address.',
        'Le portail gouvernemental nécessite une adresse email officielle .gov ou .gouv.',
      );
    }
    const gov = await GovernmentAdmin.findOne({
      email: emailLower,
      orgType: { $in: ['government', 'enterprise', 'international_org'] },
    }).lean();
    if (!gov) {
      throw authError(
        404,
        'ACCOUNT_NOT_FOUND',
        'No government account found. Contact your administrator.',
        'Aucun compte gouvernemental trouvé. Contactez votre administrateur.',
      );
    }
    return { role: 'government', record: gov };
  }

  if (roleNorm === 'ngo') {
    if (!emailLower) {
      throw authError(400, 'EMAIL_REQUIRED', 'Email required', 'Email requis');
    }
    if (!emailEndsWithAny(emailLower, NGO_EMAIL_SUFFIXES)) {
      throw authError(
        403,
        'INVALID_EMAIL_DOMAIN',
        'NGO portal requires an official organizational email (.org, .gov, .gouv).',
        'Le portail ONG nécessite une adresse email organisationnelle (.org, .gov, .gouv).',
      );
    }
    const ngo = await GovernmentAdmin.findOne({
      email: emailLower,
      orgType: 'ngo',
    }).lean();
    if (!ngo) {
      throw authError(
        404,
        'ACCOUNT_NOT_FOUND',
        'No NGO account found. Contact your administrator.',
        'Aucun compte ONG trouvé.',
      );
    }
    return { role: 'ngo', record: ngo };
  }

  if (roleNorm === 'investor') {
    if (!emailLower) {
      throw authError(400, 'EMAIL_REQUIRED', 'Email required', 'Email requis');
    }
    const investor = await Investor.findOne({ email: emailLower }).lean();
    if (!investor) {
      throw authError(
        404,
        'ACCOUNT_NOT_FOUND',
        'No investor account found. Please register at sahelagriconnect.com/afri-yield/register',
        'Aucun compte investisseur trouvé. Inscrivez-vous sur sahelagriconnect.com',
      );
    }
    return { role: 'investor', record: investor };
  }

  if (roleNorm === 'processor') {
    const processor = emailLower
      ? await Processor.findOne({ email: emailLower }).lean()
      : await Processor.findOne(farmerTelephoneQuery(phoneNorm)).lean();
    if (!processor) {
      throw authError(
        404,
        'ACCOUNT_NOT_FOUND',
        'No processor account found. Complete registration at sahelagriconnect.com/platform-licensing',
        'Aucun compte processeur trouvé.',
      );
    }
    return { role: 'processor', record: processor };
  }

  throw authError(
    400,
    'UNSUPPORTED_ROLE',
    'Unsupported role',
    'Rôle non pris en charge',
  );
}
