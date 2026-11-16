import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import HarvestLog from '../models/HarvestLog.js';
import ICSScore from '../models/ICSScore.js';
import { getVerifiedMemberCount } from './coopMemberUpgrade.js';

/** Encode note key + params for frontend i18n, e.g. note_verified_members|count=12 */
function noteKey(key, params = {}) {
  const parts = Object.entries(params).map(([k, v]) => `${k}=${v}`);
  return parts.length ? `${key}|${parts.join('|')}` : key;
}

function readinessFromTotal(total) {
  if (total >= 75) return 'audit_ready';
  if (total >= 50) return 'nearly_ready';
  if (total >= 25) return 'developing';
  return 'not_ready';
}

function scoreMemberRecords(verifiedCount) {
  let score = 0;
  if (verifiedCount >= 51) score = 20;
  else if (verifiedCount >= 25) score = 15;
  else if (verifiedCount >= 10) score = 10;
  else if (verifiedCount >= 1) score = 5;
  return {
    score,
    maxScore: 20,
    notes: noteKey('note_verified_members', { count: verifiedCount }),
  };
}

function scoreHarvestLogs(logCount) {
  let score = 0;
  if (logCount >= 30) score = 20;
  else if (logCount >= 15) score = 15;
  else if (logCount >= 5) score = 10;
  else if (logCount >= 1) score = 5;
  return {
    score,
    maxScore: 20,
    notes: noteKey('note_harvest_logs', { count: logCount }),
  };
}

function scorePctBand(pct, maxScore) {
  if (pct <= 0) return 0;
  if (pct <= 25) return 5;
  if (pct <= 74) return 10;
  return maxScore;
}

function scoreInputTracking(logs) {
  const total = logs.length;
  if (total === 0) {
    return { score: 0, maxScore: 15, notes: noteKey('note_inputs_none') };
  }
  const withInputs = logs.filter((l) => Array.isArray(l.inputs) && l.inputs.length > 0).length;
  const pct = Math.round((withInputs / total) * 100);
  return {
    score: scorePctBand(pct, 15),
    maxScore: 15,
    notes: noteKey('note_inputs_pct', { pct, with: withInputs, total }),
  };
}

function scorePlotDocumentation(logs) {
  const total = logs.length;
  if (total === 0) {
    return { score: 0, maxScore: 15, notes: noteKey('note_plot_none') };
  }
  const documented = logs.filter(
    (l) =>
      l.plotGps != null &&
      l.plotGps.lat != null &&
      Number.isFinite(Number(l.plotGps.lat)) &&
      Number(l.plotSizeHectares) > 0
  ).length;
  const pct = Math.round((documented / total) * 100);
  return {
    score: scorePctBand(pct, 15),
    maxScore: 15,
    notes: noteKey('note_plot_pct', { pct, with: documented, total }),
  };
}

function hasUploadedDocument(coop) {
  if (Array.isArray(coop.documents) && coop.documents.length > 0) return true;
  if (typeof coop.documentUrl === 'string' && coop.documentUrl.trim()) return true;
  if (Array.isArray(coop.uploadedDocuments) && coop.uploadedDocuments.length > 0) return true;
  return false;
}

function scoreCoopVerification(coop) {
  let score = 0;
  const declared = Number(coop.memberCount) || 0;
  const plan = String(coop.tier || 'free').toLowerCase();
  const emailVerified = !!coop.emailVerified;
  const document = hasUploadedDocument(coop);

  if (emailVerified) score += 5;
  if (document) score += 5;
  if (declared > 0) score += 5;
  if (plan !== 'free') score += 5;

  const any = emailVerified || document || declared > 0 || plan !== 'free';
  return {
    score,
    maxScore: 20,
    notes: any
      ? noteKey('note_coop_verification', {
          email: emailVerified ? 1 : 0,
          document: document ? 1 : 0,
          declared,
          plan,
        })
      : noteKey('note_coop_none'),
  };
}

function scoreSubscriptionActive(coop) {
  const plan = String(coop.tier || 'free').toLowerCase();
  const active =
    coop.status === 'active' &&
    (coop.paymentReceived === true || plan === 'starter' || plan === 'growth');

  if (plan === 'growth' && active) {
    return { score: 10, maxScore: 10, notes: noteKey('note_subscription_growth') };
  }
  if (plan === 'starter') {
    return { score: 5, maxScore: 10, notes: noteKey('note_subscription_starter') };
  }
  return { score: 0, maxScore: 10, notes: noteKey('note_subscription_free') };
}

function buildGaps(breakdown, verifiedCount, logCount, coop) {
  const missingItems = [];
  const recommendations = [];

  if (breakdown.memberRecords.score < 20) {
    missingItems.push('insufficient_verified_members');
    recommendations.push(
      verifiedCount < 51 ? noteKey('verify_more_members', { count: verifiedCount }) : 'keep_roster_up_to_date'
    );
  }
  if (breakdown.harvestLogs.score < 20) {
    missingItems.push('insufficient_harvest_logs');
    recommendations.push(
      logCount < 30 ? noteKey('record_more_harvest_logs', { count: logCount }) : 'continue_logging_harvests'
    );
  }
  if (breakdown.inputTracking.score < 15) {
    missingItems.push('incomplete_input_tracking');
    recommendations.push('add_inputs_to_logs');
  }
  if (breakdown.plotDocumentation.score < 15) {
    missingItems.push('incomplete_plot_documentation');
    recommendations.push('record_plot_gps');
  }
  if (!coop.emailVerified) {
    missingItems.push('email_not_verified');
    recommendations.push('verify_email');
  }
  if (!hasUploadedDocument(coop)) {
    missingItems.push('no_document_uploaded');
    recommendations.push('upload_document');
  }
  if (!(Number(coop.memberCount) > 0)) {
    missingItems.push('declared_member_count_zero');
    recommendations.push('set_declared_member_count');
  }
  if (String(coop.tier || 'free').toLowerCase() === 'free') {
    missingItems.push('no_paid_subscription');
    recommendations.push('upgrade_from_free');
  }
  if (breakdown.subscriptionActive.score < 10) {
    recommendations.push('upgrade_to_growth');
  }

  return { missingItems, recommendations };
}

/**
 * Compute (or refresh) ICS compliance score for a cooperative.
 * @param {string|import('mongoose').Types.ObjectId} cooperativeId
 * @returns {Promise<import('mongoose').Document>}
 */
export async function computeICSScore(cooperativeId) {
  const coop = await CooperativePlatformRegistration.findById(cooperativeId);
  if (!coop) {
    const err = new Error('Cooperative not found');
    err.status = 404;
    throw err;
  }

  const verifiedCount = await getVerifiedMemberCount(cooperativeId);
  const logs = await HarvestLog.find({ cooperativeId }).lean();
  const logCount = logs.length;

  const breakdown = {
    memberRecords: scoreMemberRecords(verifiedCount),
    harvestLogs: scoreHarvestLogs(logCount),
    inputTracking: scoreInputTracking(logs),
    plotDocumentation: scorePlotDocumentation(logs),
    coopVerification: scoreCoopVerification(coop),
    subscriptionActive: scoreSubscriptionActive(coop),
  };

  const scoreTotal = Object.values(breakdown).reduce((sum, c) => sum + (Number(c.score) || 0), 0);
  const readinessLevel = readinessFromTotal(scoreTotal);
  const { missingItems, recommendations } = buildGaps(breakdown, verifiedCount, logCount, coop);

  const doc = await ICSScore.findOneAndUpdate(
    { cooperativeId },
    {
      cooperativeId,
      scoreTotal,
      breakdown,
      readinessLevel,
      missingItems,
      recommendations,
      lastComputedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return doc;
}

export default { computeICSScore };
