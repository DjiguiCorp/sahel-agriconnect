import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';

const TOOLS_ITEMS = [
  { to: '/diagnostic-sol', labelKey: 'nav.soilDiagnostic' },
  { to: '/detection-maladies', labelKey: 'nav.diseaseDetection' },
  { to: '/think-tank', labelKey: 'nav.thinkTank' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [desktopPlatformOpen, setDesktopPlatformOpen] = useState(false);
  const [desktopToolsOpen, setDesktopToolsOpen] = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const desktopPlatformRef = useRef(null);
  const desktopToolsRef = useRef(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isRegistered, userName, isCoopPendingPayment, isCoopActive, clearUser } = useRegisteredUser();
  const isFr = i18n.language === 'fr';
  const hasAdminToken = Boolean(localStorage.getItem('adminToken'));

  const platformItems = useMemo(
    () => [
      { to: '/dashboard', label: t('nav.dashboard') },
      ...(isRegistered
        ? [
            {
              to: '/my-dashboard',
              label: isCoopPendingPayment
                ? isFr
                  ? '⏳ Paiement en attente'
                  : '⏳ Awaiting payment'
                : isFr
                  ? 'Mon tableau de bord'
                  : 'My dashboard',
            },
          ]
        : []),
      ...(isCoopActive
        ? [{ to: '/cooperative-portal', label: isFr ? 'Portail coopérative' : 'Cooperative portal' }]
        : []),
      { to: '/afri-yield/marketplace', label: 'Marketplace' },
      { to: '/trace', label: isFr ? 'Traçabilité' : 'Traceability' },
      ...(hasAdminToken
        ? [{ to: '/government-portal', label: isFr ? 'Portail pays' : 'Country portal' }]
        : []),
    ],
    [t, isRegistered, isCoopPendingPayment, isCoopActive, hasAdminToken, isFr]
  );

  const navLinkClass =
    'text-lg text-gray-700 hover:text-brand-forest transition-colors font-medium py-2 md:py-0';

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobilePlatformOpen(false);
    setMobileToolsOpen(false);
  };

  useEffect(() => {
    setDesktopPlatformOpen(false);
    setDesktopToolsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!desktopPlatformOpen) return;
    const handleMouseDown = (e) => {
      if (desktopPlatformRef.current && !desktopPlatformRef.current.contains(e.target)) {
        setDesktopPlatformOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [desktopPlatformOpen]);

  useEffect(() => {
    if (!desktopToolsOpen) return;
    const handleMouseDown = (e) => {
      if (desktopToolsRef.current && !desktopToolsRef.current.contains(e.target)) {
        setDesktopToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [desktopToolsOpen]);

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

  const platformLabel = isFr ? 'Plateforme' : 'Platform';
  const toolsLabel = isFr ? 'Outils' : 'Tools';

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

          <div className="hidden md:flex items-center flex-wrap justify-end gap-x-3 gap-y-2 lg:gap-x-4">
            <Link to="/" className={navLinkClass}>
              {t('nav.home')}
            </Link>

            <div
              ref={desktopPlatformRef}
              className="relative"
              onMouseEnter={() => setDesktopPlatformOpen(true)}
              onMouseLeave={() => setDesktopPlatformOpen(false)}
            >
              <button
                type="button"
                className={`${navLinkClass} inline-flex items-center gap-1 rounded-md md:py-0`}
                aria-expanded={desktopPlatformOpen}
                aria-haspopup="true"
                onClick={() => setDesktopPlatformOpen((o) => !o)}
              >
                {platformLabel}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              </button>
              {desktopPlatformOpen && (
                <div
                  className="absolute left-0 top-full z-[100] min-w-[14rem] pt-1"
                  role="menu"
                  aria-label={platformLabel}
                >
                  <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                    {platformItems.map(({ to, label }) => (
                      <Link
                        key={to + label}
                        to={to}
                        role="menuitem"
                        className="block px-4 py-2.5 text-lg text-gray-700 hover:bg-brand-iconBg hover:text-brand-forest"
                        onClick={() => setDesktopPlatformOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              ref={desktopToolsRef}
              className="relative"
              onMouseEnter={() => setDesktopToolsOpen(true)}
              onMouseLeave={() => setDesktopToolsOpen(false)}
            >
              <button
                type="button"
                className={`${navLinkClass} inline-flex items-center gap-1 rounded-md md:py-0`}
                aria-expanded={desktopToolsOpen}
                aria-haspopup="true"
                onClick={() => setDesktopToolsOpen((o) => !o)}
              >
                {toolsLabel}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              </button>
              {desktopToolsOpen && (
                <div
                  className="absolute left-0 top-full z-[100] min-w-[14rem] pt-1"
                  role="menu"
                  aria-label={toolsLabel}
                >
                  <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                    {TOOLS_ITEMS.map(({ to, labelKey }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        className="block px-4 py-2.5 text-lg text-gray-700 hover:bg-brand-iconBg hover:text-brand-forest"
                        onClick={() => setDesktopToolsOpen(false)}
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/afri-yield"
              className="text-lg font-semibold py-2 md:py-0 text-[#B5850A] hover:text-[#9a7109] transition-colors"
            >
              {isFr ? 'Investir' : 'Invest'}
            </Link>

            {isRegistered && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 max-w-[10rem] truncate" title={userName || ''}>
                  {isFr ? 'Bonjour' : 'Hi'}{' '}
                  {userName?.split(' ')[0] || ''}
                </span>
                <button
                  type="button"
                  onClick={clearUser}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                  title={isFr ? 'Se déconnecter' : 'Sign out'}
                >
                  ×
                </button>
              </div>
            )}

            <Link to="/inscription" className="btn-primary text-base whitespace-nowrap">
              {isFr ? 'Rejoindre' : 'Join'}
            </Link>

            <button
              type="button"
              className="text-sm font-medium text-gray-500 hover:text-brand-forest whitespace-nowrap"
              onClick={handleDownloadApp}
            >
              {t('nav.downloadApp')}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link to="/inscription" className="btn-primary text-sm py-2.5 px-3 whitespace-nowrap">
              {isFr ? 'Rejoindre' : 'Join'}
            </Link>
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

              <div className="border-l-2 border-brand-sage/40 pl-3 ml-1 mt-1">
                <button
                  type="button"
                  className={`${navLinkClass} flex w-full items-center justify-between text-left`}
                  aria-expanded={mobilePlatformOpen}
                  onClick={() => setMobilePlatformOpen((o) => !o)}
                >
                  <span>{platformLabel}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${mobilePlatformOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {mobilePlatformOpen && (
                  <div className="mt-2 flex flex-col space-y-1 border-l border-gray-200 pl-3 ml-1">
                    {platformItems.map(({ to, label }) => (
                      <Link
                        key={to + label}
                        to={to}
                        className="py-2 text-lg text-gray-700 hover:text-brand-forest"
                        onClick={closeMenu}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-l-2 border-brand-sage/40 pl-3 ml-1 mt-1">
                <button
                  type="button"
                  className={`${navLinkClass} flex w-full items-center justify-between text-left`}
                  aria-expanded={mobileToolsOpen}
                  onClick={() => setMobileToolsOpen((o) => !o)}
                >
                  <span>{toolsLabel}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {mobileToolsOpen && (
                  <div className="mt-2 flex flex-col space-y-1 border-l border-gray-200 pl-3 ml-1">
                    {TOOLS_ITEMS.map(({ to, labelKey }) => (
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

              <Link
                to="/afri-yield"
                className={`${navLinkClass} text-[#B5850A] font-semibold`}
                onClick={closeMenu}
              >
                {isFr ? 'Investir' : 'Invest'}
              </Link>

              <button type="button" className={`${navLinkClass} text-left`} onClick={handleDownloadApp}>
                {t('nav.downloadApp')}
              </button>

              {isRegistered ? (
                <button
                  type="button"
                  onClick={() => {
                    clearUser();
                    closeMenu();
                  }}
                  className="text-left text-sm text-gray-500 hover:text-gray-700 transition pt-3"
                >
                  {isFr ? 'Se déconnecter' : 'Sign out'}
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
