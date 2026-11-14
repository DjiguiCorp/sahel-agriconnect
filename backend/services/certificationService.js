import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Farmer from '../models/Farmer.js';
import Opportunity from '../models/Opportunity.js';

/**
 * Platform listing certification for AfriYield opportunities.
 * Maps cooperative health + opportunity completeness → certificationLevel.
 */
export async function checkCooperativeCertification(cooperativeId) {
  const missingFields = [];
  if (!cooperativeId) {
    return {
      certified: false,
      missingFields: ['cooperativeId'],
      certificationLevel: 'none',
    };
  }

  const coop = await CooperativePlatformRegistration.findById(cooperativeId).lean();
  if (!coop) {
    return {
      certified: false,
      missingFields: ['cooperative'],
      certificationLevel: 'none',
    };
  }

  const isActive = coop.status === 'active';
  const subscriptionStatus =
    coop.paymentReceived || coop.status === 'active' ? 'active' : 'inactive';

  if (!isActive) missingFields.push('cooperative.isActive');
  if (subscriptionStatus !== 'active') missingFields.push('cooperative.subscriptionStatus');

  const farmerCount = await Farmer.countDocuments({ cooperativeId: coop._id });
  const memberCount = Number(coop.memberCount) || 0;
  const effectiveFarmers = Math.max(farmerCount, memberCount);
  if (effectiveFarmers < 3) missingFields.push('farmers.min3');

  const opportunities = await Opportunity.find({
    $or: [
      { cooperativeId: coop._id },
      { contactEmail: String(coop.email || '').toLowerCase() },
    ],
  }).lean();

  if (!opportunities.length) {
    missingFields.push('opportunity.listed');
  }

  let opportunityComplete = false;
  let opportunityMissing = [];
  for (const opp of opportunities) {
    const fields = requiredOpportunityFields(opp);
    if (fields.length === 0) {
      opportunityComplete = true;
      break;
    }
    opportunityMissing = fields;
  }
  if (opportunities.length && !opportunityComplete) {
    missingFields.push(...opportunityMissing.map((f) => `opportunity.${f}`));
  }

  let certificationLevel = 'none';
  if (missingFields.length === 0) {
    certificationLevel = 'verified';
    if (effectiveFarmers >= 10 && (coop.afriyieldEligible || coop.exportEligible)) {
      certificationLevel = 'premium';
    } else if (effectiveFarmers >= 3) {
      certificationLevel = 'basic';
      // Fully complete listing with active coop → verified
      if (opportunityComplete && isActive) certificationLevel = 'verified';
    }
  } else if (isActive && opportunities.length > 0) {
    certificationLevel = 'basic';
  }

  const certified = ['basic', 'verified', 'premium'].includes(certificationLevel)
    && missingFields.length === 0;

  // Recalculate level when certified
  let level = certificationLevel;
  if (certified) {
    if (effectiveFarmers >= 10 && (coop.afriyieldEligible || coop.exportEligible)) {
      level = 'premium';
    } else {
      level = 'verified';
    }
  } else if (isActive && opportunities.length) {
    level = 'basic';
  } else {
    level = 'none';
  }

  return {
    certified: missingFields.length === 0 && isActive && opportunityComplete && effectiveFarmers >= 3,
    missingFields,
    certificationLevel: missingFields.length === 0 ? level : (isActive ? 'basic' : 'none'),
    isActive,
    subscriptionStatus,
    farmerCount: effectiveFarmers,
    opportunityCount: opportunities.length,
  };
}

function requiredOpportunityFields(opp) {
  const missing = [];
  const title = opp.centerName || opp.title;
  if (!title || !String(title).trim()) missing.push('title');
  if (!opp.description || !String(opp.description).trim()) missing.push('description');
  const target = opp.amountSought ?? opp.targetAmount;
  if (target == null || Number(target) <= 0) missing.push('targetAmount');
  const projected =
    opp.expectedROIMin ?? opp.projectedReturn ?? opp.expectedROIMax;
  if (projected == null || Number(projected) <= 0) missing.push('projectedReturn');
  const risk = opp.riskLevel || opp.track;
  if (!risk) missing.push('riskLevel');
  const commodity = opp.commodity || opp.commodityType;
  if (!commodity) missing.push('commodityType');
  return missing;
}

/**
 * Run certification for a cooperative and stamp linked opportunities.
 */
export async function applyCooperativeCertification(cooperativeId) {
  const result = await checkCooperativeCertification(cooperativeId);
  const now = new Date();
  const coop = await CooperativePlatformRegistration.findById(cooperativeId).lean();
  if (!coop) return result;

  const filter = {
    $or: [
      { cooperativeId: coop._id },
      ...(coop.email
        ? [{ contactEmail: String(coop.email).toLowerCase() }]
        : []),
    ],
  };

  await Opportunity.updateMany(filter, {
    $set: {
      certificationLevel: result.certificationLevel,
      certificationCheckedAt: now,
      certificationMissingFields: result.missingFields,
      verified: Boolean(result.certified),
      cooperativeId: coop._id,
    },
  });

  return result;
}

/**
 * Stamp a single opportunity from its cooperative (or field completeness alone).
 */
export async function applyOpportunityCertification(opportunity) {
  const opp =
    typeof opportunity === 'object' && opportunity?._id
      ? opportunity
      : await Opportunity.findById(opportunity);
  if (!opp) return null;

  let coopId = opp.cooperativeId;
  if (!coopId && opp.contactEmail) {
    const coop = await CooperativePlatformRegistration.findOne({
      email: String(opp.contactEmail).toLowerCase(),
    }).lean();
    if (coop) coopId = coop._id;
  }

  if (coopId) {
    const result = await checkCooperativeCertification(coopId);
    // Merge with this opportunity's own completeness
    const ownMissing = requiredOpportunityFields(opp);
    const missing = [
      ...new Set([
        ...result.missingFields.filter((f) => !f.startsWith('opportunity.')),
        ...ownMissing.map((f) => `opportunity.${f}`),
      ]),
    ];
    const certified =
      result.isActive &&
      (result.farmerCount || 0) >= 3 &&
      ownMissing.length === 0;
    let level = 'none';
    if (certified) {
      level =
        result.certificationLevel === 'premium' ? 'premium' : 'verified';
    } else if (result.isActive) {
      level = 'basic';
    }

    opp.cooperativeId = coopId;
    opp.certificationLevel = level;
    opp.certificationCheckedAt = new Date();
    opp.certificationMissingFields = missing;
    opp.verified = certified;
    await opp.save();
    return {
      certified,
      missingFields: missing,
      certificationLevel: level,
    };
  }

  // No cooperative linked — certify from opportunity fields alone
  const missing = requiredOpportunityFields(opp).map((f) => `opportunity.${f}`);
  const certified = missing.length === 0;
  const level = certified ? 'basic' : 'none';
  opp.certificationLevel = level;
  opp.certificationCheckedAt = new Date();
  opp.certificationMissingFields = missing;
  opp.verified = certified;
  await opp.save();
  return { certified, missingFields: missing, certificationLevel: level };
}
