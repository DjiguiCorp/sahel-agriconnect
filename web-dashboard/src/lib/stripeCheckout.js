import { AFRICAN_COUNTRIES } from '../data/africanCountries';

/** Card checkout via Stripe — diaspora / international. West Africa uses mobile money. */
export function isStripeCheckoutAvailable(country) {
  if (!country || !String(country).trim()) return false;
  const normalized = String(country).trim().toLowerCase();
  return !AFRICAN_COUNTRIES.some((c) => c.toLowerCase() === normalized);
}
