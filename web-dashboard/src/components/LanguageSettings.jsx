import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Composant de paramètres de langue (caché par défaut)
 * Accessible via un bouton discret en bas de page ou dans les paramètres
 */
const LanguageSettings = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    setIsOpen(false);
  };

  // Masquer complètement le bouton par défaut
  // Pour l'activer, décommentez la ligne ci-dessous ou ajoutez ?lang=settings à l'URL
  const showButton = new URLSearchParams(window.location.search).get('lang') === 'settings' || 
                     localStorage.getItem('showLanguageSettings') === 'true';

  if (!showButton) {
    return null; // Ne rien afficher si le bouton est masqué
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-green text-white p-3 rounded-full shadow-lg hover:bg-primary-lightgreen transition-colors"
          aria-label="Paramètres de langue"
          title="Changer la langue"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Langue / Language</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-primary-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            La langue est détectée automatiquement selon votre localisation
          </p>
        </div>
      )}
    </div>
  );
};

export default LanguageSettings;

