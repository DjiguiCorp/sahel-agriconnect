/// Feature flags for in-progress UI surfaces.
///
/// Set a flag to `true` when the feature is ready to ship to users.
/// All flags default to `false` (feature hidden).
///
/// Usage:
///   if (FeatureFlags.exploreSearchEnabled) { ... }
///
/// Before flipping a flag to true:
///   1. Confirm the backend endpoint is live and tested
///   2. Confirm both FR and EN copy is finalised
///   3. Confirm the screen passes QA on iOS and Android
class FeatureFlags {
  FeatureFlags._();

  /// Home screen search bar — full-text search across cooperatives,
  /// farmers, and produce listings.
  static const bool exploreSearchEnabled = false;

  /// Farmer profile — edit profile sub-sections (bio, land parcels,
  /// certifications). Replaces ProfilePlaceholderScreen when true.
  static const bool farmerProfileEditEnabled = false;

  /// Investor profile — payout preferences and bank details form.
  /// Replaces ProfilePlaceholderScreen when true.
  static const bool investorProfilePayoutEnabled = false;
}
