/** Canonical bilingual crop list for Sahel AgriConnect (public config). */
export const CROPS = [
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

/** English names only (for validation / legacy callers). */
export const CROP_NAMES_EN = CROPS.map((c) => c.en);

export default CROPS;
