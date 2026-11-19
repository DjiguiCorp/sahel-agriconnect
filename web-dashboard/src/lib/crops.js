/** Fallback bilingual crop catalogue (mirrors backend/config/crops.js). */
export const CROP_CATALOG = [
  { en: 'Shea Butter', fr: 'Karité' },
  { en: 'Sesame', fr: 'Sésame' },
  { en: 'Millet', fr: 'Mil' },
  { en: 'Sorghum', fr: 'Sorgho' },
  { en: 'Maize/Corn', fr: 'Maïs' },
  { en: 'Rice', fr: 'Riz' },
  { en: 'Cowpea', fr: 'Niébé' },
  { en: 'Groundnut/Peanut', fr: 'Arachide' },
  { en: 'Cashew', fr: 'Anacarde' },
  { en: 'Mango', fr: 'Mangue' },
  { en: 'Cotton', fr: 'Coton' },
  { en: 'Moringa', fr: 'Moringa' },
  { en: 'Hibiscus/Bissap', fr: 'Bissap' },
  { en: 'Fonio', fr: 'Fonio' },
  { en: 'Yam', fr: 'Igname' },
  { en: 'Cassava', fr: 'Manioc' },
  { en: 'Sweet Potato', fr: 'Patate douce' },
  { en: 'Onion', fr: 'Oignon' },
  { en: 'Tomato', fr: 'Tomate' },
  { en: 'Pepper', fr: 'Piment' },
  { en: 'Watermelon', fr: 'Pastèque' },
  { en: 'Cowpea Leaves', fr: 'Feuilles de niébé' },
  { en: 'Baobab', fr: 'Baobab' },
  { en: 'Gum Arabic', fr: 'Gomme arabique' },
];

const EXTRA = [{ en: 'Other', fr: 'Autre' }, { en: 'Autre', fr: 'Autre' }];
const BY_EN = Object.fromEntries(
  [...CROP_CATALOG, ...EXTRA].map((c) => [c.en, c])
);

/** Normalize API/local crop entries into { en, fr }[]. */
export function normalizeCropList(crops) {
  if (!Array.isArray(crops)) return [];
  return crops
    .map((c) => {
      if (typeof c === 'string') {
        const known = BY_EN[c];
        return known || { en: c, fr: c };
      }
      if (c && typeof c === 'object') {
        const en = String(c.en || c.name || c.value || '').trim();
        if (!en) return null;
        const fr = String(c.fr || c.labelFr || en).trim();
        return { en, fr };
      }
      return null;
    })
    .filter(Boolean);
}

/** Display label for a crop object or stored English value. */
export function cropLabel(cropOrEn, isFr) {
  if (!cropOrEn) return '';
  if (typeof cropOrEn === 'object') {
    return isFr ? cropOrEn.fr || cropOrEn.en : cropOrEn.en;
  }
  const known = BY_EN[String(cropOrEn)];
  if (known) return isFr ? known.fr : known.en;
  return String(cropOrEn);
}

export function cropEnglishValue(cropOrEn) {
  if (!cropOrEn) return '';
  if (typeof cropOrEn === 'object') return String(cropOrEn.en || '');
  return String(cropOrEn);
}
