/**
 * Blocks certification / AfriYield / export actions unless cooperative is on Growth plan.
 * Expects req.coop from authCoop (CooperativePlatformRegistration document).
 */
export function growthTierForbiddenBody() {
  return {
    error: 'growth_tier_required',
    message:
      'Certification and export features require the Growth plan (51+ members, $199/year).',
    messageFr:
      'La certification et l\'exportation nécessitent le plan Croissance (51+ membres, 199$/an).',
  };
}

export function requireGrowthTier(req, res, next) {
  if (req.coop?.tier === 'growth') {
    return next();
  }
  return res.status(403).json(growthTierForbiddenBody());
}

export default requireGrowthTier;
