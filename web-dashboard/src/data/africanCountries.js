/** African Union member states and diaspora countries — English canonical names. */

import { AFRICAN_REGIONS } from './africanRegions';

/** 54 AU member states — alphabetical by English name. */
export const AFRICAN_COUNTRIES = [
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Comoros',
  'Congo',
  "Côte d'Ivoire",
  'Democratic Republic of the Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Eswatini',
  'Ethiopia',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Madagascar',
  'Malawi',
  'Mali',
  'Mauritania',
  'Mauritius',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Rwanda',
  'São Tomé and Príncipe',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Tanzania',
  'Togo',
  'Tunisia',
  'Uganda',
  'Zambia',
  'Zimbabwe',
];

export const DIASPORA_COUNTRIES = [
  'Canada',
  'France',
  'United Kingdom',
  'United States',
];

export const ALL_COUNTRIES = [
  ...AFRICAN_COUNTRIES,
  ...DIASPORA_COUNTRIES,
];

/** @deprecated Use ALL_COUNTRIES — kept for imports expecting this name. */
export const ALL_COUNTRY_NAMES = ALL_COUNTRIES;

const COUNTRY_META = {
  Algeria: { code: 'DZ', flag: '🇩🇿' },
  Angola: { code: 'AO', flag: '🇦🇴' },
  Benin: { code: 'BJ', flag: '🇧🇯' },
  Botswana: { code: 'BW', flag: '🇧🇼' },
  'Burkina Faso': { code: 'BF', flag: '🇧🇫' },
  Burundi: { code: 'BI', flag: '🇧🇮' },
  'Cabo Verde': { code: 'CV', flag: '🇨🇻' },
  Cameroon: { code: 'CM', flag: '🇨🇲' },
  'Central African Republic': { code: 'CF', flag: '🇨🇫' },
  Chad: { code: 'TD', flag: '🇹🇩' },
  Comoros: { code: 'KM', flag: '🇰🇲' },
  Congo: { code: 'CG', flag: '🇨🇬' },
  "Côte d'Ivoire": { code: 'CI', flag: '🇨🇮' },
  'Democratic Republic of the Congo': { code: 'CD', flag: '🇨🇩' },
  Djibouti: { code: 'DJ', flag: '🇩🇯' },
  Egypt: { code: 'EG', flag: '🇪🇬' },
  'Equatorial Guinea': { code: 'GQ', flag: '🇬🇶' },
  Eritrea: { code: 'ER', flag: '🇪🇷' },
  Eswatini: { code: 'SZ', flag: '🇸🇿' },
  Ethiopia: { code: 'ET', flag: '🇪🇹' },
  Gabon: { code: 'GA', flag: '🇬🇦' },
  Gambia: { code: 'GM', flag: '🇬🇲' },
  Ghana: { code: 'GH', flag: '🇬🇭' },
  Guinea: { code: 'GN', flag: '🇬🇳' },
  'Guinea-Bissau': { code: 'GW', flag: '🇬🇼' },
  Kenya: { code: 'KE', flag: '🇰🇪' },
  Lesotho: { code: 'LS', flag: '🇱🇸' },
  Liberia: { code: 'LR', flag: '🇱🇷' },
  Libya: { code: 'LY', flag: '🇱🇾' },
  Madagascar: { code: 'MG', flag: '🇲🇬' },
  Malawi: { code: 'MW', flag: '🇲🇼' },
  Mali: { code: 'ML', flag: '🇲🇱' },
  Mauritania: { code: 'MR', flag: '🇲🇷' },
  Mauritius: { code: 'MU', flag: '🇲🇺' },
  Morocco: { code: 'MA', flag: '🇲🇦' },
  Mozambique: { code: 'MZ', flag: '🇲🇿' },
  Namibia: { code: 'NA', flag: '🇳🇦' },
  Niger: { code: 'NE', flag: '🇳🇪' },
  Nigeria: { code: 'NG', flag: '🇳🇬' },
  Rwanda: { code: 'RW', flag: '🇷🇼' },
  'São Tomé and Príncipe': { code: 'ST', flag: '🇸🇹' },
  Senegal: { code: 'SN', flag: '🇸🇳' },
  Seychelles: { code: 'SC', flag: '🇸🇨' },
  'Sierra Leone': { code: 'SL', flag: '🇸🇱' },
  Somalia: { code: 'SO', flag: '🇸🇴' },
  'South Africa': { code: 'ZA', flag: '🇿🇦' },
  'South Sudan': { code: 'SS', flag: '🇸🇸' },
  Sudan: { code: 'SD', flag: '🇸🇩' },
  Tanzania: { code: 'TZ', flag: '🇹🇿' },
  Togo: { code: 'TG', flag: '🇹🇬' },
  Tunisia: { code: 'TN', flag: '🇹🇳' },
  Uganda: { code: 'UG', flag: '🇺🇬' },
  Zambia: { code: 'ZM', flag: '🇿🇲' },
  Zimbabwe: { code: 'ZW', flag: '🇿🇼' },
  Canada: { code: 'CA', flag: '🇨🇦' },
  France: { code: 'FR', flag: '🇫🇷' },
  'United Kingdom': { code: 'GB', flag: '🇬🇧' },
  'United States': { code: 'US', flag: '🇺🇸' },
};

/** Options with code / name / flag for selects that show flags. */
export const ALL_COUNTRY_OPTIONS = ALL_COUNTRIES.map((name) => {
  const meta = COUNTRY_META[name] || { code: name.slice(0, 2).toUpperCase(), flag: '🌍' };
  return { code: meta.code, name, flag: meta.flag };
});

/** Regional groupings for LocationSelector optgroups (English names). */
export const AFRICAN_COUNTRY_GROUPS = {
  westAfrica: [
    'Benin',
    'Burkina Faso',
    'Cabo Verde',
    "Côte d'Ivoire",
    'Gambia',
    'Ghana',
    'Guinea',
    'Guinea-Bissau',
    'Liberia',
    'Mali',
    'Mauritania',
    'Niger',
    'Nigeria',
    'Senegal',
    'Sierra Leone',
    'Togo',
  ],
  centralAfrica: [
    'Angola',
    'Cameroon',
    'Central African Republic',
    'Chad',
    'Congo',
    'Democratic Republic of the Congo',
    'Equatorial Guinea',
    'Gabon',
    'São Tomé and Príncipe',
  ],
  eastAfrica: [
    'Burundi',
    'Comoros',
    'Djibouti',
    'Eritrea',
    'Ethiopia',
    'Kenya',
    'Madagascar',
    'Mauritius',
    'Rwanda',
    'Seychelles',
    'Somalia',
    'South Sudan',
    'Sudan',
    'Tanzania',
    'Uganda',
  ],
  northAfrica: ['Algeria', 'Egypt', 'Libya', 'Morocco', 'Tunisia'],
  southernAfrica: [
    'Botswana',
    'Eswatini',
    'Lesotho',
    'Malawi',
    'Mozambique',
    'Namibia',
    'South Africa',
    'Zambia',
    'Zimbabwe',
  ],
};

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
  'Cap-Vert': 'Cabo Verde',
  Tchad: 'Chad',
  'RD Congo': 'Democratic Republic of the Congo',
  'Afrique du Sud': 'South Africa',
  Zambie: 'Zambia',
  Algérie: 'Algeria',
  Tunisie: 'Tunisia',
  Maroc: 'Morocco',
};

/**
 * @param {string | null | undefined} legacy
 * @returns {string} English name from ALL_COUNTRIES, or '' if unknown
 */
export function legacyCountryToAppName(legacy) {
  if (!legacy) return '';
  if (ALL_COUNTRIES.includes(legacy)) return legacy;
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
  'Cabo Verde': 'Cap-Vert',
  Chad: 'Tchad',
  'Democratic Republic of the Congo': 'RD Congo',
  'South Africa': 'Afrique du Sud',
  Zambia: 'Zambie',
  Algeria: 'Algérie',
  Tunisia: 'Tunisie',
  Morocco: 'Maroc',
  'Burkina Faso': 'Burkina Faso',
  Mali: 'Mali',
  Ghana: 'Ghana',
  Nigeria: 'Nigeria',
  Niger: 'Niger',
  Togo: 'Togo',
  'Sierra Leone': 'Sierra Leone',
  Liberia: 'Liberia',
  'Guinea-Bissau': 'Guinée-Bissau',
  Kenya: 'Kenya',
  Rwanda: 'Rwanda',
  Mozambique: 'Mozambique',
  Madagascar: 'Madagascar',
  Zimbabwe: 'Zimbabwe',
};

export function regionsForAppCountry(appCountryName) {
  if (!appCountryName) return [];
  if (DIASPORA_COUNTRIES.includes(appCountryName)) return [];
  const key = APP_NAME_TO_REGIONS_KEY[appCountryName] || appCountryName;
  return AFRICAN_REGIONS[key] || [];
}

export function primaryRegionForAppCountry(appCountryName) {
  const r = regionsForAppCountry(appCountryName);
  return r[0] ?? null;
}
