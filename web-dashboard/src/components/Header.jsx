import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import LanguageSelector from './LanguageSelector';

const TOOLS_ITEMS = [
  {
    to: '/think-tank',
    icon: '🧠',
    label: { fr: 'Think Tank IA', en: 'AI Think Tank' },
    desc: {
      fr: 'Solutions instantanées pour vos défis agricoles',
      en: 'Instant solutions for your farming challenges',
    },
    badge: { fr: 'IA', en: 'AI' },
    color: '#B5850A',
  },
  {
    to: '/diagnostic-sol',
    icon: '🌱',
    label: { fr: 'Diagnostic sol', en: 'Soil Diagnostic' },
    desc: {
      fr: 'Analysez votre sol et obtenez des recommandations',
      en: 'Analyze your soil and get fertilizer recommendations',
    },
    badge: { fr: 'IA', en: 'AI' },
    color: '#4CAF50',
  },
  {
    to: '/detection-maladies',
    icon: '🔬',
    label: { fr: 'Détection maladies', en: 'Disease Detection' },
    desc: {
      fr: 'Photographiez votre culture — diagnostiquée en secondes',
      en: 'Photo your crop — diagnosed in seconds',
    },
    badge: { fr: 'Vision IA', en: 'AI Vision' },
    color: '#3b82f6',
  },
];

const getMainNavLinks = (isFr) => [
  { label: isFr ? 'Tarifs' : 'Pricing', path: '/pricing' },
  { label: isFr ? 'Contact' : 'Contact', path: '/contact' },
];

const getJoinMenuItems = (isFr) => [
  { icon: '🌾', label: isFr ? 'Agriculteur (gratuit)' : 'Farmer (free)', to: '/inscription' },
  { icon: '⭐', label: 'Producer Pro', to: '/producer-pro-registration' },
  { icon: '🤝', label: isFr ? 'Coopérative' : 'Cooperative', to: '/cooperative-registration' },
  { icon: '🏭', label: isFr ? 'Centre transformation' : 'Transformation Center', to: '/transformation-registration' },
  { icon: '💰', label: isFr ? 'Investisseur AfriYield' : 'AfriYield Investor', to: '/afri-yield/register' },
  { icon: '📊', label: isFr ? 'Voir tous les plans' : 'View all plans', to: '/pricing' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [desktopPlatformOpen, setDesktopPlatformOpen] = useState(false);
  const [desktopToolsOpen, setDesktopToolsOpen] = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const desktopPlatformRef = useRef(null);
  const desktopToolsRef = useRef(null);
  const joinMenuRef = useRef(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isRegistered, userName, isCoopPendingPayment, isCoopActive, clearUser } = useRegisteredUser();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [hasGovSession, setHasGovSession] = useState(() => Boolean(localStorage.getItem('gov_token')));

  useEffect(() => {
    const syncGov = () => setHasGovSession(Boolean(localStorage.getItem('gov_token')));
    syncGov();
    window.addEventListener('storage', syncGov);
    return () => window.removeEventListener('storage', syncGov);
  }, [location.pathname]);

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
      ...(hasGovSession
        ? [{ to: '/government-portal', label: isFr ? 'Portail pays' : 'Country portal' }]
        : []),
    ],
    [t, isRegistered, isCoopPendingPayment, isCoopActive, hasGovSession, isFr]
  );

  const navLinkClass =
    'text-base text-white/80 hover:text-white transition-colors font-medium px-2 py-2 lg:px-3 whitespace-nowrap';

  const dropdownPanelStyle = {
    background: 'rgba(15,34,24,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.14)',
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobilePlatformOpen(false);
    setMobileToolsOpen(false);
    setShowJoinMenu(false);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const joinMenuItems = useMemo(() => getJoinMenuItems(isFr), [isFr]);

  useEffect(() => {
    setDesktopPlatformOpen(false);
    setDesktopToolsOpen(false);
    setShowJoinMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showJoinMenu) return;
    const handleMouseDown = (e) => {
      if (joinMenuRef.current && !joinMenuRef.current.contains(e.target)) {
        setShowJoinMenu(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showJoinMenu]);

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

  const platformLabel = isFr ? 'Plateforme' : 'Platform';
  const toolsLabel = isFr ? 'Outils' : 'Tools';
  const mainNavLinks = useMemo(() => getMainNavLinks(isFr), [isFr]);

  const joinMenuDropdown = (
    <div ref={joinMenuRef} className="relative">
      <button
        type="button"
        onClick={() => setShowJoinMenu((open) => !open)}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
        style={{ backgroundColor: '#B5850A', color: 'black' }}
        aria-expanded={showJoinMenu}
        aria-haspopup="true"
      >
        {isFr ? 'Rejoindre' : 'Join'}
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform ${showJoinMenu ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {showJoinMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/15 shadow-2xl z-50 overflow-hidden"
          style={dropdownPanelStyle}
          role="menu"
        >
          {joinMenuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setShowJoinMenu(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(15,34,24,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-50">
        <div className="flex items-center justify-between min-h-[4rem] gap-4 lg:gap-6">
          <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0 max-w-[42%] sm:max-w-none" onClick={closeMenu}>
            <img
              src="/sahel-logo.png"
              alt="Sahel AgriConnect"
              className="h-12 w-12 rounded-xl object-cover"
            />
            <span className="text-xl sm:text-2xl font-bold text-white truncate">
              Sahel AgriConnect
            </span>
          </Link>

          <div
            role="navigation"
            className="hidden lg:flex flex-1 items-center justify-center gap-0.5 xl:gap-1 min-w-0 px-6"
            aria-label={isFr ? 'Navigation principale' : 'Main navigation'}
          >
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
                  <div className="rounded-lg py-2 shadow-lg" style={dropdownPanelStyle}>
                    {platformItems.map(({ to, label }) => (
                      <Link
                        key={to + label}
                        to={to}
                        role="menuitem"
                        className="block px-4 py-2.5 text-lg text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => setDesktopPlatformOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {mainNavLinks.map(({ label, path }) => (
              <Link key={path} to={path} className={navLinkClass}>
                {label}
              </Link>
            ))}

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
                  className="absolute left-0 top-full z-[100] pt-1"
                  role="menu"
                  aria-label={toolsLabel}
                >
                  <div
                    className="rounded-2xl py-2 shadow-2xl overflow-hidden"
                    style={{
                      ...dropdownPanelStyle,
                      minWidth: '320px',
                    }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {isFr ? '🛠️ Outils agricoles IA' : '🛠️ AI Agricultural Tools'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {isFr
                          ? 'Alimentés par Gemini Vision & PlantVillage'
                          : 'Powered by Gemini Vision & PlantVillage'}
                      </p>
                    </div>

                    {TOOLS_ITEMS.map(({ to, icon, label, desc, badge, color }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        onClick={() => setDesktopToolsOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 group"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg mt-0.5"
                          style={{ background: `${color}18` }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                              {isFr ? label.fr : label.en}
                            </span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                              style={{
                                background: `${color}25`,
                                color: color,
                              }}
                            >
                              {isFr ? badge.fr : badge.en}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {isFr ? desc.fr : desc.en}
                          </p>
                        </div>
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: color }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}

                    <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
                      <Link
                        to="/producer-pro-registration"
                        onClick={() => setDesktopToolsOpen(false)}
                        className="flex items-center gap-2 text-xs font-semibold transition-colors"
                        style={{ color: '#B5850A' }}
                      >
                        ⭐{' '}
                        {isFr
                          ? 'Producer Pro — Accès expert illimité →'
                          : 'Producer Pro — Unlimited expert access →'}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/afri-yield"
              className={`${navLinkClass} font-semibold text-[#B5850A] hover:text-[#9a7109]`}
            >
              {isFr ? 'Investir' : 'Invest'}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0 pl-4 lg:pl-6 border-l border-white/10">
            {isRegistered && (
              <div className="hidden xl:flex items-center gap-2 max-w-[9rem]">
                <span className="text-sm text-white/60 truncate" title={userName || ''}>
                  {isFr ? 'Bonjour' : 'Hi'} {userName?.split(' ')[0] || ''}
                </span>
                <button
                  type="button"
                  onClick={clearUser}
                  className="text-xs text-white/40 hover:text-white/70 transition shrink-0"
                  title={isFr ? 'Se déconnecter' : 'Sign out'}
                >
                  ×
                </button>
              </div>
            )}

            <LanguageSelector />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {joinMenuDropdown}
            <button
              type="button"
              className="md:hidden p-2.5 rounded-lg text-white hover:bg-white/10 border border-transparent hover:border-white/20"
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
          <>
            <div
              className="fixed inset-0 z-30 md:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />
            <div
              id="mobile-navigation"
              className="md:hidden border-t border-white/10 py-4 pb-6 animate-fade-up relative z-40"
              style={{
                background: 'rgba(10,31,16,0.97)',
                backdropFilter: 'blur(12px)',
              }}
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
                  <div className="mt-2 flex flex-col space-y-1 border-l border-white/15 pl-3 ml-1">
                    {platformItems.map(({ to, label }) => (
                      <Link
                        key={to + label}
                        to={to}
                        className="py-2 text-lg text-white/80 hover:text-white"
                        onClick={closeMenu}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {mainNavLinks.map(({ label, path }) => (
                <Link key={path} to={path} className={navLinkClass} onClick={closeMenu}>
                  {label}
                </Link>
              ))}

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
                  <div
                    className="mt-2 flex flex-col gap-2 rounded-xl p-2"
                    style={dropdownPanelStyle}
                  >
                    {TOOLS_ITEMS.map(({ to, icon, label, desc, color }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => {
                          setMobileToolsOpen(false);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                          style={{ background: `${color}18` }}
                        >
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{isFr ? label.fr : label.en}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {isFr ? desc.fr : desc.en}
                          </p>
                        </div>
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

              <div className="pt-4">
                <LanguageSelector />
              </div>

              {isRegistered ? (
                <button
                  type="button"
                  onClick={() => {
                    clearUser();
                    closeMenu();
                  }}
                  className="text-left text-sm text-white/50 hover:text-white/80 transition pt-3"
                >
                  {isFr ? 'Se déconnecter' : 'Sign out'}
                </button>
              ) : null}
            </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
