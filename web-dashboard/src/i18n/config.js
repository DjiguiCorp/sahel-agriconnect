import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { detectLanguage } from '../services/geolocationService';

import fr from '../locales/fr.json';
import en from '../locales/en.json';

/** Same as header LanguageSelector: French + English only. */
const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// Détecter la langue depuis la géolocalisation
const getInitialLanguage = async () => {
  const raw = localStorage.getItem('i18nextLng');
  const savedLanguage = raw ? String(raw).split('-')[0] : null;
  if (savedLanguage === 'fr' || savedLanguage === 'en') {
    return savedLanguage;
  }
  if (savedLanguage) {
    localStorage.setItem('i18nextLng', 'fr');
    return 'fr';
  }

  // Sinon, détecter depuis la géolocalisation
  try {
    const detectedLang = await detectLanguage();
    return detectedLang;
  } catch (error) {
    console.warn('Erreur de détection de langue, utilisation du français par défaut:', error);
    return 'fr';
  }
};

// Initialiser i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['fr', 'en'],
    nonExplicitSupportedLngs: true,
    fallbackLng: {
      default: ['en', 'fr'],
      fr: ['en'],
      en: ['en'],
    },
    load: 'languageOnly',
    lng: 'fr',
    debug: false,
    
    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },
    
    detection: {
      // Ordre de détection de la langue
      order: ['localStorage', 'querystring', 'navigator'],
      // Cache la langue sélectionnée
      caches: ['localStorage'],
      // Langues supportées
      lookupLocalStorage: 'i18nextLng',
      // Ne pas détecter automatiquement si la langue n'est pas supportée
      checkWhitelist: true
    },
    
    // Support RTL (pour l'avenir avec l'arabe)
    react: {
      useSuspense: false
    },
    
    // Retourner la clé si la traduction est manquante (pour debug)
    returnEmptyString: false,
    returnNull: false,
    returnObjects: true
  });

// Détecter et appliquer la langue depuis la géolocalisation après l'initialisation
getInitialLanguage().then((detectedLang) => {
  if (detectedLang && detectedLang !== i18n.language) {
    i18n.changeLanguage(detectedLang);
    console.log(`🌍 Langue détectée et appliquée: ${detectedLang}`);
  }
});

export default i18n;
