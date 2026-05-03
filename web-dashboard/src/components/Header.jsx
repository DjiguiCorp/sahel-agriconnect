import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Lock } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navLinkClass =
    'text-lg text-gray-700 hover:text-brand-forest transition-colors font-medium py-2 md:py-0';
  const closeMenu = () => setIsMenuOpen(false);

  const handleDownloadApp = (e) => {
    e.preventDefault();
    alert(`${t('home.cta.downloadApp')} - ${t('common.loading')}`);
  };

  return (
    <header className="bg-white shadow-md sticky top-8 z-50 mt-8">
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
            <Link to="/enregistrer-agriculteur" className={navLinkClass}>
              {t('nav.registerFarmer')}
            </Link>
            <Link to="/diagnostic-sol" className={navLinkClass}>
              {t('nav.soilDiagnostic')}
            </Link>
            <Link to="/detection-maladies" className={navLinkClass}>
              {t('nav.diseaseDetection')}
            </Link>
            <Link to="/think-tank" className={navLinkClass}>
              {t('nav.thinkTank')}
            </Link>
            <Link to="/contact" className={navLinkClass}>
              {t('nav.contact')}
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

        {/* Panneau mobile (< lg) */}
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
              <Link to="/enregistrer-agriculteur" className={navLinkClass} onClick={closeMenu}>
                {t('nav.registerFarmer')}
              </Link>
              <Link to="/diagnostic-sol" className={navLinkClass} onClick={closeMenu}>
                {t('nav.soilDiagnostic')}
              </Link>
              <Link to="/detection-maladies" className={navLinkClass} onClick={closeMenu}>
                {t('nav.diseaseDetection')}
              </Link>
              <Link to="/think-tank" className={navLinkClass} onClick={closeMenu}>
                {t('nav.thinkTank')}
              </Link>
              <Link to="/contact" className={navLinkClass} onClick={closeMenu}>
                {t('nav.contact')}
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
