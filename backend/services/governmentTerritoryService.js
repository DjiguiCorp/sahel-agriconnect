import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Processor from '../models/Processor.js';

function countryFarmerFilter(country) {
  return { $or: [{ country }, { pays: country }] };
}

export async function buildTerritoryIntelligence(country, { region } = {}) {
  const baseMatch = countryFarmerFilter(country);
  if (region) {
    baseMatch.$and = [
      { $or: [{ region: new RegExp(region, 'i') }, { zone: new RegExp(region, 'i') }] },
    ];
  }

  const [
    landTotals,
    regionalBreakdown,
    cropProductionIndex,
    cultivationTypes,
    irrigationSignals,
    challengeTopics,
    coopByRegion,
  ] = await Promise.all([
    Farmer.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalFarmers: { $sum: 1 },
          totalArableHa: { $sum: { $ifNull: ['$superficie', 0] } },
          coopLinked: {
            $sum: { $cond: [{ $eq: ['$lienCooperative', 'Oui'] }, 1, 0] },
          },
          activeFarmers: {
            $sum: { $cond: [{ $eq: ['$statut', 'Actif'] }, 1, 0] },
          },
        },
      },
    ]),
    Farmer.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { $ifNull: ['$region', 'Unknown'] },
          farmers: { $sum: 1 },
          arableHa: { $sum: { $ifNull: ['$superficie', 0] } },
          coopLinked: {
            $sum: { $cond: [{ $eq: ['$lienCooperative', 'Oui'] }, 1, 0] },
          },
        },
      },
      { $sort: { arableHa: -1 } },
      { $limit: 80 },
    ]),
    Farmer.aggregate([
      { $match: baseMatch },
      { $unwind: '$cultures' },
      {
        $group: {
          _id: '$cultures',
          farmers: { $sum: 1 },
          hectares: { $sum: { $ifNull: ['$superficie', 0] } },
        },
      },
      { $sort: { hectares: -1 } },
      { $limit: 40 },
    ]),
    Farmer.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { $ifNull: ['$typeExploitation', 'Unknown'] },
          farmers: { $sum: 1 },
          hectares: { $sum: { $ifNull: ['$superficie', 0] } },
        },
      },
      { $sort: { farmers: -1 } },
    ]),
    Farmer.aggregate([
      {
        $match: {
          ...baseMatch,
          $or: [
            { 'diseaseDetection.thinkTank.irrigation': { $exists: true, $ne: '' } },
            { defis: { $regex: /irrigation/i } },
            { besoinCollecte: 'Oui' },
          ],
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$region', 'Unknown'] },
          farmers: { $sum: 1 },
          hectares: { $sum: { $ifNull: ['$superficie', 0] } },
        },
      },
      { $sort: { farmers: -1 } },
      { $limit: 25 },
    ]),
    Farmer.aggregate([
      { $match: { ...baseMatch, defis: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$defis' },
      { $group: { _id: '$defis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    CooperativePlatformRegistration.aggregate([
      { $match: { country } },
      {
        $group: {
          _id: { $ifNull: ['$region', '$city', 'National'] },
          cooperatives: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        },
      },
      { $sort: { cooperatives: -1 } },
    ]),
  ]);

  const [coopCount, processorCount] = await Promise.all([
    CooperativePlatformRegistration.countDocuments({ country }),
    Processor.countDocuments({ country }),
  ]);

  const totals = landTotals[0] || {
    totalFarmers: 0,
    totalArableHa: 0,
    coopLinked: 0,
    activeFarmers: 0,
  };

  return {
    country,
    filterRegion: region || null,
    summary: {
      totalFarmers: totals.totalFarmers,
      totalArableHa: Math.round(totals.totalArableHa * 100) / 100,
      activeFarmers: totals.activeFarmers,
      farmersInCooperatives: totals.coopLinked,
      registeredCooperatives: coopCount,
      transformationCenters: processorCount,
      dataSource: 'registered_cooperatives_and_farmers',
      lastAggregatedAt: new Date().toISOString(),
    },
    regionalBreakdown: regionalBreakdown.map((r) => ({
      region: r._id,
      farmers: r.farmers,
      arableHa: Math.round(r.arableHa * 100) / 100,
      coopLinked: r.coopLinked,
    })),
    nationalCropProductionIndex: cropProductionIndex.map((c) => ({
      crop: c._id,
      farmers: c.farmers,
      hectares: Math.round(c.hectares * 100) / 100,
      shareOfHa:
        totals.totalArableHa > 0
          ? Math.round((c.hectares / totals.totalArableHa) * 1000) / 10
          : 0,
    })),
    cultivationByFarmType: cultivationTypes.map((t) => ({
      type: t._id,
      farmers: t.farmers,
      hectares: Math.round(t.hectares * 100) / 100,
    })),
    irrigationAndWaterPriority: irrigationSignals.map((r) => ({
      region: r._id,
      farmers: r.farmers,
      hectares: Math.round(r.hectares * 100) / 100,
    })),
    platformChallengesToSolve: challengeTopics.map((c) => ({
      topic: c._id,
      reports: c.count,
    })),
    cooperativesByRegion: coopByRegion.map((c) => ({
      region: c._id,
      cooperatives: c.cooperatives,
      active: c.active,
    })),
  };
}
