import { AFRICAN_COUNTRIES } from '../data/africanCountries';

// Primary diaspora markets (fast-track 24h KYC)
export const FAST_TRACK_DIASPORA = [
  'United States',
  'United Kingdom',
  'France',
  'Canada',
];

/** @returns {'african'|'diaspora'|'other'} */
export function getCountryCategory(country) {
  if (!country) return 'other';
  const normalized = String(country).trim().toLowerCase();
  if (AFRICAN_COUNTRIES.some((c) => c.toLowerCase() === normalized)) {
    return 'african';
  }
  if (
    FAST_TRACK_DIASPORA.some((c) => c.toLowerCase() === normalized)
    || normalized === 'usa'
    || normalized === 'us'
    || normalized === 'uk'
  ) {
    return 'diaspora';
  }
  return 'other';
}
