import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Lock, ChevronDown } from 'lucide-react';

const OUTILS_ITEMS = [
  { to: '/diagnostic-sol', labelKey: 'nav.soilDiagnostic' },
  { to: '/detection-maladies', labelKey: 'nav.diseaseDetection' },
  { to: '/think-tank', labelKey: 'nav.thinkTank' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [desktopOutilsOpen, setDesktopOutilsOpen] = useState(false);
  const [mobileOutilsOpen, setMobileOutilsOpen] = useState(false);
  const desktopOutilsRef = useRef(null);
  const { t } = useTranslation();
  const location = useLocation();

  const navLinkClass =
    'text-lg text-gray-700 hover:text-brand-forest transition-colors font-medium py-2 md:py-0';

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileOutilsOpen(false);
  };

  useEffect(() => {
    setDesktopOutilsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!desktopOutilsOpen) return;
    const handleMouseDown = (e) => {
      if (desktopOutilsRef.current && !desktopOutilsRef.current.contains(e.target)) {
        setDesktopOutilsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [desktopOutilsOpen]);

  const handleDownloadApp = (e) => {
    e.preventDefault();
    alert(`${t('home.cta.downloadApp')} - ${t('common.loading')}`);
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between min-h-[4rem] gap-2">
          <Link to="/" className="flex items-center space-x-2 shrink-0 min-w-0" onClick={closeMenu}>
            <div className="w-12 h-12 bg-gradient-to-br from-brand-forest to-brand-sage rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">SA</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-brand-forest truncate">
              {t('common.appName')}
            </span>
          </Link>

          {/* Desktop (≥ md, 768px) */}
          <div className="hidden md:flex items-center flex-wrap justify-end gap-x-3 gap-y-2 lg:gap-x-4">
            <Link to="/" className={navLinkClass}>
              {t('nav.home')}
            </Link>
            <Link to="/about" className={navLinkClass}>
              {t('nav.about')}
            </Link>
            <Link to="/dashboard" className={navLinkClass}>
              {t('nav.dashboard')}
            </Link>

            <div
              ref={desktopOutilsRef}
              className="relative"
              onMouseEnter={() => setDesktopOutilsOpen(true)}
              onMouseLeave={() => setDesktopOutilsOpen(false)}
            >
              <button
                type="button"
                className={`${navLinkClass} inline-flex items-center gap-1 rounded-md md:py-0`}
                aria-expanded={desktopOutilsOpen}
                aria-haspopup="true"
                onClick={() => setDesktopOutilsOpen((o) => !o)}
              >
                Outils Agricoles
                <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              </button>
              {desktopOutilsOpen && (
                <div
                  className="absolute left-0 top-full z-20 min-w-[14rem] pt-1"
                  role="menu"
                  aria-label="Outils agricoles"
                >
                  <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                    {OUTILS_ITEMS.map(({ to, labelKey }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        className="block px-4 py-2.5 text-lg text-gray-700 hover:bg-brand-iconBg hover:text-brand-forest"
                        onClick={() => setDesktopOutilsOpen(false)}
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/contact" className={navLinkClass}>
              {t('nav.contact')}
            </Link>
            <Link to="/pricing" className={navLinkClass}>
              Tarifs
            </Link>
            <Link
              to="/afri-yield"
              className="text-lg font-medium py-2 md:py-0 text-[#B5850A] hover:text-[#9a7109] transition-colors inline-flex items-center gap-2"
            >
              <span>AfriYield Exchange</span>
              <span className="text-[10px] font-bold tracking-wide text-white bg-[#B5850A] px-1.5 py-0.5 rounded leading-none">
                NEW
              </span>
            </Link>
            <Link
              to="/admin/login"
              className="text-lg text-gray-600 hover:text-brand-forest transition-colors font-medium flex items-center gap-1.5"
              title="Espace Administrateur"
            >
              <Lock className="w-5 h-5 shrink-0" aria-hidden />
              <span>{t('nav.admin')}</span>
            </Link>
            <a href="#" className="btn-primary text-base whitespace-nowrap" onClick={handleDownloadApp}>
              {t('nav.downloadApp')}
            </a>
          </div>

          {/* Mobile (&lt; md) : CTA toujours visible + menu hamburger */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <a
              href="#"
              className="btn-primary text-sm py-2.5 px-3 whitespace-nowrap"
              onClick={(e) => {
                handleDownloadApp(e);
              }}
              aria-label={t('nav.downloadApp')}
            >
              {t('nav.downloadApp')}
            </a>
            <button
              type="button"
              className="p-2.5 rounded-lg text-brand-forest hover:bg-brand-iconBg border border-transparent hover:border-brand-sage/30"
              onClick={() => setIsMenuOpen((o) => !o)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
            >
              {isMenuOpen ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Panneau mobile */}
        {isMenuOpen && (
          <div
            id="mobile-navigation"
            className="md:hidden border-t border-gray-100 py-4 pb-6 animate-fade-up bg-white"
            role="navigation"
            aria-label="Navigation principale"
          >
            <div className="flex flex-col space-y-1">
              <Link to="/" className={navLinkClass} onClick={closeMenu}>
                {t('nav.home')}
              </Link>
              <Link to="/about" className={navLinkClass} onClick={closeMenu}>
                {t('nav.about')}
              </Link>
              <Link to="/dashboard" className={navLinkClass} onClick={closeMenu}>
                {t('nav.dashboard')}
              </Link>

              <div className="border-l-2 border-brand-sage/40 pl-3 ml-1 mt-1">
                <button
                  type="button"
                  className={`${navLinkClass} flex w-full items-center justify-between text-left`}
                  aria-expanded={mobileOutilsOpen}
                  onClick={() => setMobileOutilsOpen((o) => !o)}
                >
                  <span>Outils Agricoles</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${mobileOutilsOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {mobileOutilsOpen && (
                  <div className="mt-2 flex flex-col space-y-1 border-l border-gray-200 pl-3 ml-1">
                    {OUTILS_ITEMS.map(({ to, labelKey }) => (
                      <Link
                        key={to}
                        to={to}
                        className="py-2 text-lg text-gray-700 hover:text-brand-forest"
                        onClick={closeMenu}
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/contact" className={navLinkClass} onClick={closeMenu}>
                {t('nav.contact')}
              </Link>
              <Link to="/pricing" className={navLinkClass} onClick={closeMenu}>
                Tarifs
              </Link>
              <Link
                to="/afri-yield"
                className="text-lg font-medium py-2 text-[#B5850A] hover:text-[#9a7109] transition-colors inline-flex items-center gap-2"
                onClick={closeMenu}
              >
                <span>AfriYield Exchange</span>
                <span className="text-[10px] font-bold tracking-wide text-white bg-[#B5850A] px-1.5 py-0.5 rounded leading-none">
                  NEW
                </span>
              </Link>
              <Link
                to="/admin/login"
                className="flex items-center gap-2 text-lg text-gray-700 hover:text-brand-forest font-medium py-2"
                onClick={closeMenu}
              >
                <Lock className="w-5 h-5" aria-hidden />
                {t('nav.admin')}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
