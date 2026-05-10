import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Lock, ChevronDown } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';

const OUTILS_ITEMS = [
  { to: '/farmer-needs', labelKey: 'nav.farmerNeeds', emoji: '🌾' },
  { to: '/diagnostic-sol', labelKey: 'nav.soilDiagnostic' },
  { to: '/detection-maladies', labelKey: 'nav.diseaseDetection' },
  { to: '/think-tank', labelKey: 'nav.thinkTank' },
];

const AFRIYIELD_ITEMS = [
  { to: '/afri-yield', labelKey: 'nav.afriYieldOverview' },
  { to: '/afri-yield/opportunities', labelKey: 'nav.opportunities' },
  { to: '/how-it-works', labelKey: 'nav.howItWorks' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [desktopOutilsOpen, setDesktopOutilsOpen] = useState(false);
  const [mobileOutilsOpen, setMobileOutilsOpen] = useState(false);
  const [desktopAfriYieldOpen, setDesktopAfriYieldOpen] = useState(false);
  const [mobileAfriYieldOpen, setMobileAfriYieldOpen] = useState(false);
  const desktopOutilsRef = useRef(null);
  const desktopAfriYieldRef = useRef(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isRegistered, userName, isCoopPendingPayment, isCooperative, clearUser } = useRegisteredUser();

  const navLinkClass =
    'text-lg text-gray-700 hover:text-brand-forest transition-colors font-medium py-2 md:py-0';

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileOutilsOpen(false);
    setMobileAfriYieldOpen(false);
  };

  useEffect(() => {
    setDesktopOutilsOpen(false);
    setDesktopAfriYieldOpen(false);
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

  useEffect(() => {
    if (!desktopAfriYieldOpen) return;
    const handleMouseDown = (e) => {
      if (desktopAfriYieldRef.current && !desktopAfriYieldRef.current.contains(e.target)) {
        setDesktopAfriYieldOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [desktopAfriYieldOpen]);

  const handleDownloadApp = (e) => {
    e.preventDefault();
    const el = document.getElementById('waitlist-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/');
    window.setTimeout(() => {
      document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-50">
        <div className="flex items-center justify-between min-h-[4rem] gap-2">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0" onClick={closeMenu}>
            <img
              src="/sahel-logo.png"
              alt="Sahel AgriConnect"
              className="h-12 w-12 rounded-xl object-cover"
            />
            <span className="text-xl sm:text-2xl font-bold text-brand-forest truncate">
              Sahel AgriConnect
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
            <Link to="/impact" className={navLinkClass}>
              {t('nav.impact')}
            </Link>
            <Link to="/dashboard" className={navLinkClass}>
              {t('nav.dashboard')}
            </Link>
            {isRegistered && (
              <div className="flex items-center gap-3">
                <Link to="/my-dashboard" className={navLinkClass}>
                  {isCoopPendingPayment
                    ? i18n.language === 'fr'
                      ? '⏳ Paiement en attente'
                      : '⏳ Awaiting payment'
                    : `${i18n.language === 'fr' ? 'Bonjour' : 'Hello'}, ${userName?.split(' ')[0] || 'Mr.'}`}
                </Link>
                <button
                  type="button"
                  onClick={clearUser}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                  title="Se déconnecter"
                >
                  ×
                </button>
              </div>
            )}

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
                  className="absolute left-0 top-full z-[100] min-w-[14rem] pt-1"
                  role="menu"
                  aria-label="Outils agricoles"
                >
                  <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                    {OUTILS_ITEMS.map(({ to, labelKey, emoji }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        className="block px-4 py-2.5 text-lg text-gray-700 hover:bg-brand-iconBg hover:text-brand-forest"
                        onClick={() => setDesktopOutilsOpen(false)}
                      >
                        {emoji ? `${emoji} ` : ''}
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
            <div
              ref={desktopAfriYieldRef}
              className="relative"
              onMouseEnter={() => setDesktopAfriYieldOpen(true)}
              onMouseLeave={() => setDesktopAfriYieldOpen(false)}
            >
              <button
                type="button"
                className="text-lg font-medium py-2 md:py-0 text-[#B5850A] hover:text-[#9a7109] transition-colors inline-flex items-center gap-2 rounded-md"
                aria-expanded={desktopAfriYieldOpen}
                aria-haspopup="true"
                onClick={() => setDesktopAfriYieldOpen((o) => !o)}
              >
                <span>{t('nav.afriYieldMenu')}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span className="text-[10px] font-bold tracking-wide text-white bg-[#B5850A] px-1.5 py-0.5 rounded leading-none">
                  NEW
                </span>
              </button>
              {desktopAfriYieldOpen && (
                <div className="absolute right-0 top-full z-[100] min-w-[14rem] pt-1" role="menu" aria-label="AfriYield">
                  <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                    {AFRIYIELD_ITEMS.map(({ to, labelKey }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        className="block px-4 py-2.5 text-lg text-gray-700 hover:bg-brand-iconBg hover:text-brand-forest"
                        onClick={() => setDesktopAfriYieldOpen(false)}
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/admin/login"
              className="text-lg text-gray-600 hover:text-brand-forest transition-colors font-medium flex items-center gap-1.5"
              title="Espace Administrateur"
            >
              <Lock className="w-5 h-5 shrink-0" aria-hidden />
              <span>{t('nav.admin')}</span>
            </Link>
            <button type="button" className="btn-primary text-base whitespace-nowrap" onClick={handleDownloadApp}>
              {t('nav.downloadApp')}
            </button>
          </div>

          {/* Mobile (&lt; md) : CTA toujours visible + menu hamburger */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              className="btn-primary text-sm py-2.5 px-3 whitespace-nowrap"
              onClick={handleDownloadApp}
              aria-label={t('nav.downloadApp')}
            >
              {t('nav.downloadApp')}
            </button>
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
              <Link to="/impact" className={navLinkClass} onClick={closeMenu}>
                {t('nav.impact')}
              </Link>
              <Link to="/dashboard" className={navLinkClass} onClick={closeMenu}>
                {t('nav.dashboard')}
              </Link>
              {isRegistered && (
                <Link to="/my-dashboard" className={navLinkClass} onClick={closeMenu}>
                  {isCoopPendingPayment
                    ? i18n.language === 'fr'
                      ? '⏳ Paiement en attente'
                      : '⏳ Awaiting payment'
                    : `${i18n.language === 'fr' ? 'Bonjour' : 'Hello'}, ${userName?.split(' ')[0] || 'Mr.'}`}
                </Link>
              )}

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
                    {OUTILS_ITEMS.map(({ to, labelKey, emoji }) => (
                      <Link
                        key={to}
                        to={to}
                        className="py-2 text-lg text-gray-700 hover:text-brand-forest"
                        onClick={closeMenu}
                      >
                        {emoji ? `${emoji} ` : ''}
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
              <div className="border-l-2 border-[#B5850A]/40 pl-3 ml-1 mt-1">
                <button
                  type="button"
                  className={`${navLinkClass} flex w-full items-center justify-between text-left text-[#B5850A]`}
                  aria-expanded={mobileAfriYieldOpen}
                  onClick={() => setMobileAfriYieldOpen((o) => !o)}
                >
                  <span className="inline-flex items-center gap-2">
                    {t('nav.afriYieldMenu')}
                    <span className="text-[10px] font-bold tracking-wide text-white bg-[#B5850A] px-1.5 py-0.5 rounded leading-none">
                      NEW
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${mobileAfriYieldOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {mobileAfriYieldOpen && (
                  <div className="mt-2 flex flex-col space-y-1 border-l border-[#B5850A]/30 pl-3 ml-1">
                    {AFRIYIELD_ITEMS.map(({ to, labelKey }) => (
                      <Link
                        key={to}
                        to={to}
                        className="py-2 text-lg text-gray-700 hover:text-[#9a7109]"
                        onClick={closeMenu}
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/admin/login"
                className="flex items-center gap-2 text-lg text-gray-700 hover:text-brand-forest font-medium py-2"
                onClick={closeMenu}
              >
                <Lock className="w-5 h-5" aria-hidden />
                {t('nav.admin')}
              </Link>

              {isRegistered ? (
                <button
                  type="button"
                  onClick={() => {
                    clearUser();
                    closeMenu();
                  }}
                  className="text-left text-sm text-gray-500 hover:text-gray-700 transition pt-3"
                >
                  Se déconnecter
                </button>
              ) : null}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
