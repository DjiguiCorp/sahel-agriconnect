import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import HarvestLog from '../models/HarvestLog.js';
import ICSScore from '../models/ICSScore.js';
import { getVerifiedMemberCount } from './coopMemberUpgrade.js';

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
    notes: `${verifiedCount} verified member(s)`,
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
    notes: `${logCount} harvest log(s)`,
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
    return { score: 0, maxScore: 15, notes: '0% of harvest logs have inputs' };
  }
  const withInputs = logs.filter((l) => Array.isArray(l.inputs) && l.inputs.length > 0).length;
  const pct = Math.round((withInputs / total) * 100);
  return {
    score: scorePctBand(pct, 15),
    maxScore: 15,
    notes: `${pct}% of harvest logs include inputs (${withInputs}/${total})`,
  };
}

function scorePlotDocumentation(logs) {
  const total = logs.length;
  if (total === 0) {
    return { score: 0, maxScore: 15, notes: '0% of harvest logs have plot documentation' };
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
    notes: `${pct}% of harvest logs have GPS + plot size (${documented}/${total})`,
  };
}

function hasUploadedDocument(coop) {
  if (Array.isArray(coop.documents) && coop.documents.length > 0) return true;
  if (typeof coop.documentUrl === 'string' && coop.documentUrl.trim()) return true;
  if (Array.isArray(coop.uploadedDocuments) && coop.uploadedDocuments.length > 0) return true;
  return false;
}

function scoreCoopVerification(coop) {
  const parts = [];
  let score = 0;

  if (coop.emailVerified) {
    score += 5;
    parts.push('email verified');
  }
  if (hasUploadedDocument(coop)) {
    score += 5;
    parts.push('document uploaded');
  }
  const declared = Number(coop.memberCount) || 0;
  if (declared > 0) {
    score += 5;
    parts.push(`declared members: ${declared}`);
  }
  const plan = String(coop.tier || 'free').toLowerCase();
  if (plan !== 'free') {
    score += 5;
    parts.push(`plan: ${plan}`);
  }

  return {
    score,
    maxScore: 20,
    notes: parts.length ? parts.join('; ') : 'No verification criteria met',
  };
}

function scoreSubscriptionActive(coop) {
  const plan = String(coop.tier || 'free').toLowerCase();
  const active =
    coop.status === 'active' &&
    (coop.paymentReceived === true || plan === 'starter' || plan === 'growth');

  if (plan === 'growth' && active) {
    return { score: 10, maxScore: 10, notes: 'Growth plan active' };
  }
  if (plan === 'starter') {
    return { score: 5, maxScore: 10, notes: 'Starter plan' };
  }
  return { score: 0, maxScore: 10, notes: 'Free / inactive plan' };
}

function buildGaps(breakdown, verifiedCount, logCount, coop) {
  const missingItems = [];
  const recommendations = [];

  if (breakdown.memberRecords.score < 20) {
    missingItems.push('Insufficient verified member records');
    recommendations.push(
      verifiedCount < 51
        ? `Verify more members (currently ${verifiedCount}; target 51+ for full points)`
        : 'Keep verified member roster up to date'
    );
  }
  if (breakdown.harvestLogs.score < 20) {
    missingItems.push('Insufficient harvest logs');
    recommendations.push(
      logCount < 30
        ? `Record more harvest logs (currently ${logCount}; target 30+)`
        : 'Continue logging every harvest'
    );
  }
  if (breakdown.inputTracking.score < 15) {
    missingItems.push('Incomplete input tracking on harvest logs');
    recommendations.push('Add fertilizer/pesticide/organic inputs on each harvest log');
  }
  if (breakdown.plotDocumentation.score < 15) {
    missingItems.push('Incomplete plot GPS / size documentation');
    recommendations.push('Record plot GPS coordinates and plot size (hectares) on harvest logs');
  }
  if (!coop.emailVerified) {
    missingItems.push('Email not verified');
    recommendations.push('Verify the cooperative leader email address');
  }
  if (!hasUploadedDocument(coop)) {
    missingItems.push('No supporting document uploaded');
    recommendations.push('Upload at least one cooperative registration or legitimacy document');
  }
  if (!(Number(coop.memberCount) > 0)) {
    missingItems.push('Declared member count is zero');
    recommendations.push('Set the declared member count for the cooperative');
  }
  if (String(coop.tier || 'free').toLowerCase() === 'free') {
    missingItems.push('No paid subscription plan');
    recommendations.push('Upgrade from free to Starter or Growth');
  }
  if (breakdown.subscriptionActive.score < 10) {
    recommendations.push('Upgrade to an active Growth subscription for full ICS subscription points');
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
