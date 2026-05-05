import { useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

function buildBreadcrumbItems(pathname) {
  const clean = pathname.replace(/\/$/, '') || '/';
  const segs = clean.split('/').filter(Boolean);
  if (segs[0] !== 'afri-yield') return [];

  if (segs.length === 1) {
    return [{ key: 'home', href: null }];
  }

  const rest = segs.slice(1);
  if (rest[0] === 'opportunities' && rest[1] && OBJECT_ID_RE.test(rest[1])) {
    return [
      { key: 'home', href: '/afri-yield' },
      { key: 'opportunities', href: '/afri-yield/opportunities' },
      { key: 'detail', href: null },
    ];
  }

  if (rest[0] === 'opportunities') {
    return [
      { key: 'home', href: '/afri-yield' },
      { key: 'opportunities', href: null },
    ];
  }

  const section = rest[0];
  const allowed = ['register', 'dashboard'];
  if (!allowed.includes(section)) {
    return [{ key: 'home', href: null }];
  }

  return [
    { key: 'home', href: '/afri-yield' },
    { key: section, href: null },
  ];
}

export default function AfriYieldShell() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['en', 'fr', 'am', 'bm', 'ff'];
    const detectedLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
    if (i18n.language !== detectedLang) {
      i18n.changeLanguage(detectedLang);
    }
  }, [i18n]);

  const crumbs = useMemo(() => buildBreadcrumbItems(location.pathname), [location.pathname]);

  return (
    <div className="min-h-[60vh] flex flex-col bg-brand-cream">
      <header className="sticky top-0 z-40 border-b border-black/10 shadow-sm">
        <div className="bg-[#1a3c2e]">
          <div className="section-container relative flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-3">
            <Link
              to="/afri-yield"
              className="text-lg font-extrabold text-[#B5850A] tracking-tight pr-10 md:pr-0 shrink-0"
            >
              {t('afriYield.brandTitle')}
            </Link>

            <nav
              className="flex flex-col items-center justify-center gap-0.5 text-center text-sm text-white/90 md:flex-1 md:flex-row md:flex-wrap md:gap-1 min-w-0"
              aria-label="Breadcrumb"
            >
              {crumbs.map((c, i) => (
                <span key={`${c.key}-${i}`} className="inline-flex flex-col items-center md:inline-flex md:flex-row md:items-center">
                  {i > 0 ? (
                    <>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#B5850A]/80 md:hidden" aria-hidden />
                      <ChevronRight className="hidden h-4 w-4 shrink-0 text-[#B5850A]/80 md:inline" aria-hidden />
                    </>
                  ) : null}
                  {c.href ? (
                    <Link to={c.href} className="hover:text-[#B5850A] transition-colors underline-offset-2 hover:underline px-1">
                      <span className="hidden md:inline">{t(`afriYield.${c.key}`)}</span>
                      <span className="md:hidden">{t(`afriYield.${c.key}Short`, { defaultValue: t(`afriYield.${c.key}`) })}</span>
                    </Link>
                  ) : (
                    <>
                      <span className="hidden font-medium text-white md:inline px-1">{t(`afriYield.${c.key}`)}</span>
                      <span className="font-medium text-white md:hidden px-1">
                        {t(`afriYield.${c.key}Short`, { defaultValue: t(`afriYield.${c.key}`) })}
                      </span>
                    </>
                  )}
                </span>
              ))}
            </nav>

            <Link
              to="/"
              className="absolute top-3 right-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 hover:text-white md:static md:h-10 md:w-10"
              aria-label={t('afriYield.closeAria')}
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
