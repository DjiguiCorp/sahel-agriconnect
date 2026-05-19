export const INVESTOR_RESIDENCE_COUNTRIES = [
  'United States',
  'France',
  'Canada',
  'United Kingdom',
];

const ALIASES = {
  USA: 'United States',
  US: 'United States',
  'United States of America': 'United States',
  UK: 'United Kingdom',
  'Great Britain': 'United Kingdom',
};

export function normalizeInvestorResidence(input) {
  if (input == null || input === '') return null;
  const s = String(input).trim();
  if (ALIASES[s]) return ALIASES[s];
  if (INVESTOR_RESIDENCE_COUNTRIES.includes(s)) return s;
  return null;
}
