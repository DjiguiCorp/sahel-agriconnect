/** West Africa, East/Central Africa, and diaspora — sorted alphabetically by English name. */

import { AFRICAN_REGIONS } from './africanRegions';

export const ALL_COUNTRIES = [
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
];

export const ALL_COUNTRY_NAMES = ALL_COUNTRIES.map((c) => c.name);

/** Same canonical names as ALL_COUNTRY_NAMES (schema / legacy imports). */
export const AFRICAN_COUNTRIES = ALL_COUNTRY_NAMES;

/** Map French / legacy [africanRegions] labels to English app list names. */
const LEGACY_LABEL_TO_APP_NAME = {
  Sénégal: 'Senegal',
  Guinée: 'Guinea',
  Gambie: 'Gambia',
  Bénin: 'Benin',
  Mauritanie: 'Mauritania',
  Cameroun: 'Cameroon',
  Éthiopie: 'Ethiopia',
  Tanzanie: 'Tanzania',
  Ouganda: 'Uganda',
};

/**
 * @param {string | null | undefined} legacy
 * @returns {string} English name from ALL_COUNTRY_NAMES, or '' if unknown
 */
export function legacyCountryToAppName(legacy) {
  if (!legacy) return '';
  if (ALL_COUNTRY_NAMES.includes(legacy)) return legacy;
  return LEGACY_LABEL_TO_APP_NAME[legacy] || '';
}

/** English app country name → key used in AFRICAN_REGIONS (often French label). */
const APP_NAME_TO_REGIONS_KEY = {
  Benin: 'Bénin',
  Senegal: 'Sénégal',
  Guinea: 'Guinée',
  Gambia: 'Gambie',
  Mauritania: 'Mauritanie',
  Cameroon: 'Cameroun',
  Ethiopia: 'Éthiopie',
  Tanzania: 'Tanzanie',
  Uganda: 'Ouganda',
};

export function regionsForAppCountry(appCountryName) {
  if (!appCountryName) return [];
  const key = APP_NAME_TO_REGIONS_KEY[appCountryName] || appCountryName;
  return AFRICAN_REGIONS[key] || [];
}

export function primaryRegionForAppCountry(appCountryName) {
  const r = regionsForAppCountry(appCountryName);
  return r[0] ?? null;
}
