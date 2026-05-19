/** AfriYield investor registration — eligible countries of residence only. */
const RESIDENCE_META = {
  'United States': { code: 'US', flag: '🇺🇸' },
  France: { code: 'FR', flag: '🇫🇷' },
  Canada: { code: 'CA', flag: '🇨🇦' },
  'United Kingdom': { code: 'GB', flag: '🇬🇧' },
};

/** AfriYield investor registration — eligible countries of residence only. */
export const INVESTOR_RESIDENCE_COUNTRIES = [
  'United States',
  'France',
  'Canada',
  'United Kingdom',
];

export const DEFAULT_INVESTOR_RESIDENCE = 'United States';

const ALIASES = {
  USA: 'United States',
  US: 'United States',
  'United States of America': 'United States',
  UK: 'United Kingdom',
  'Great Britain': 'United Kingdom',
  England: 'United Kingdom',
};

export function normalizeInvestorResidence(input) {
  if (input == null || input === '') return null;
  const s = String(input).trim();
  if (ALIASES[s]) return ALIASES[s];
  if (INVESTOR_RESIDENCE_COUNTRIES.includes(s)) return s;
  return null;
}

export function isAllowedInvestorResidence(input) {
  return normalizeInvestorResidence(input) != null;
}

/** Select options with flag emoji for AfriYield investor forms. */
export const INVESTOR_RESIDENCE_OPTIONS = INVESTOR_RESIDENCE_COUNTRIES.map((name) => {
  const meta = RESIDENCE_META[name] || { code: name.slice(0, 2).toUpperCase(), flag: '🌍' };
  return { name, code: meta.code, flag: meta.flag };
});

/** i18n keys under afriYield.registration */
export const INVESTOR_RESIDENCE_I18N_KEYS = {
  'United States': 'residenceUnitedStates',
  France: 'residenceFrance',
  Canada: 'residenceCanada',
  'United Kingdom': 'residenceUnitedKingdom',
};
