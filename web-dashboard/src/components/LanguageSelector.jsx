import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const activeCode = (() => {
    const code = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0];
    return code === 'en' ? 'en' : 'fr';
  })();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5"
    >
      {languages.map((lang) => {
        const active = activeCode === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            className={`min-w-[2.5rem] rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
              active
                ? 'bg-white text-brand-forest shadow-sm'
                : 'text-gray-500 hover:text-brand-forest'
            }`}
            aria-pressed={active}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
