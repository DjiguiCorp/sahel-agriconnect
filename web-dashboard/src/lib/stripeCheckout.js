import { AFRICAN_COUNTRIES, legacyCountryToAppName } from '../data/africanCountries';

function isAfricanCountry(country) {
  if (!country || !String(country).trim()) return false;
  const raw = String(country).trim();
  const canonical = legacyCountryToAppName(raw) || raw;
  const candidates = [raw, canonical].map((c) => c.toLowerCase());
  return AFRICAN_COUNTRIES.some((c) => candidates.includes(c.toLowerCase()));
}

/** Card checkout via Stripe — diaspora / international. African countries use manual coordination. */
export function isStripeCheckoutAvailable(country) {
  return !isAfricanCountry(country);
}
