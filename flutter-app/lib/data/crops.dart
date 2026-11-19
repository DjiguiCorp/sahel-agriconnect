/// Canonical bilingual crop list (mirrors backend/config/crops.js).
/// Store English [en] values in API payloads; display by active locale.
class CropOption {
  final String en;
  final String fr;
  const CropOption({required this.en, required this.fr});

  String label(bool isFr) => isFr ? fr : en;
}

const List<CropOption> kCrops = [
  CropOption(en: 'Shea Butter', fr: 'Karité'),
  CropOption(en: 'Sesame', fr: 'Sésame'),
  CropOption(en: 'Millet', fr: 'Mil'),
  CropOption(en: 'Sorghum', fr: 'Sorgho'),
  CropOption(en: 'Maize/Corn', fr: 'Maïs'),
  CropOption(en: 'Rice', fr: 'Riz'),
  CropOption(en: 'Cowpea', fr: 'Niébé'),
  CropOption(en: 'Groundnut/Peanut', fr: 'Arachide'),
  CropOption(en: 'Cashew', fr: 'Anacarde'),
  CropOption(en: 'Mango', fr: 'Mangue'),
  CropOption(en: 'Cotton', fr: 'Coton'),
  CropOption(en: 'Moringa', fr: 'Moringa'),
  CropOption(en: 'Hibiscus/Bissap', fr: 'Bissap'),
  CropOption(en: 'Fonio', fr: 'Fonio'),
  CropOption(en: 'Yam', fr: 'Igname'),
  CropOption(en: 'Cassava', fr: 'Manioc'),
  CropOption(en: 'Sweet Potato', fr: 'Patate douce'),
  CropOption(en: 'Onion', fr: 'Oignon'),
  CropOption(en: 'Tomato', fr: 'Tomate'),
  CropOption(en: 'Pepper', fr: 'Piment'),
  CropOption(en: 'Watermelon', fr: 'Pastèque'),
  CropOption(en: 'Cowpea Leaves', fr: 'Feuilles de niébé'),
  CropOption(en: 'Baobab', fr: 'Baobab'),
  CropOption(en: 'Gum Arabic', fr: 'Gomme arabique'),
];

String cropLabelFor(String? englishName, bool isFr) {
  if (englishName == null || englishName.isEmpty) return '—';
  for (final c in kCrops) {
    if (c.en.toLowerCase() == englishName.toLowerCase() ||
        c.fr.toLowerCase() == englishName.toLowerCase()) {
      return c.label(isFr);
    }
  }
  return englishName;
}
