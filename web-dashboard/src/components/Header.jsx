import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
// LanguageSelector masqué - détection automatique via géolocalisation
// import LanguageSelector from './LanguageSelector';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-green to-primary-lightgreen rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">SA</span>
            </div>
            <span className="text-xl font-bold text-primary-green">{t('common.appName')}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.about')}
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.dashboard')}
            </Link>
            <Link to="/diagnostic-sol" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.soilDiagnostic')}
            </Link>
            <Link to="/detection-maladies" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.diseaseDetection')}
            </Link>
            <Link to="/think-tank" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.thinkTank')}
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-orange transition-colors font-medium">
              {t('nav.contact')}
            </Link>
            {/* LanguageSelector masqué - détection automatique via géolocalisation */}
            <a
              href="#"
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                alert(t('home.cta.downloadApp') + ' - ' + t('common.loading'));
              }}
            >
              {t('nav.downloadApp')}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              to="/"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/about"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/dashboard"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.dashboard')}
            </Link>
            <Link
              to="/diagnostic-sol"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.soilDiagnostic')}
            </Link>
            <Link
              to="/detection-maladies"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.diseaseDetection')}
            </Link>
            <Link
              to="/think-tank"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.thinkTank')}
            </Link>
            <Link
              to="/contact"
              className="block text-gray-700 hover:text-primary-orange transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.contact')}
            </Link>
            {/* LanguageSelector masqué - détection automatique via géolocalisation */}
            <a
              href="#"
              className="block btn-primary text-center"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                alert(t('home.cta.downloadApp') + ' - ' + t('common.loading'));
              }}
            >
              {t('nav.downloadApp')}
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

