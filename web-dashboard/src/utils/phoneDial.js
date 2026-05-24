import { ALL_COUNTRY_OPTIONS } from '../data/africanCountries';

/** ISO 3166-1 alpha-2 → international dial prefix */
const ISO_DIAL = {
  DZ: '+213', AO: '+244', BJ: '+229', BW: '+267', BF: '+226', BI: '+257', CV: '+238', CM: '+237',
  CF: '+236', TD: '+235', KM: '+269', CG: '+242', CI: '+225', CD: '+243', DJ: '+253', EG: '+20',
  GQ: '+240', ER: '+291', SZ: '+268', ET: '+251', GA: '+241', GM: '+220', GH: '+233', GN: '+224',
  GW: '+245', KE: '+254', LS: '+266', LR: '+231', LY: '+218', MG: '+261', MW: '+265', ML: '+223',
  MR: '+222', MU: '+230', MA: '+212', MZ: '+258', NA: '+264', NE: '+227', NG: '+234', RW: '+250',
  ST: '+239', SN: '+221', SC: '+248', SL: '+232', SO: '+252', ZA: '+27', SS: '+211', SD: '+249',
  TZ: '+255', TG: '+228', TN: '+216', UG: '+256', ZM: '+260', ZW: '+263',
  US: '+1', CA: '+1', FR: '+33', GB: '+44',
};

export function dialPrefixForCountry(countryName) {
  const meta = ALL_COUNTRY_OPTIONS.find((c) => c.name === countryName);
  if (!meta?.code) return '+';
  return ISO_DIAL[meta.code] || '+';
}

export function formatPhoneE164(local, countryName) {
  const raw = String(local || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return raw.replace(/[\s\-().]/g, '');
  const prefix = dialPrefixForCountry(countryName);
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  return `${prefix}${digits}`;
}
