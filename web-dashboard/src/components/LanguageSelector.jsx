import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fr', name: 'FR', nativeName: 'Français' },
    { code: 'en', name: 'EN', nativeName: 'English' }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative">
      <select
        value={i18n.language || 'fr'}
        onChange={(e) => changeLanguage(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent cursor-pointer"
        aria-label="Sélectionner la langue"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name} - {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;

