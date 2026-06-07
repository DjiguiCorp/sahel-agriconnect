import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#1a3c2e] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold mb-3">Sahel AgriConnect</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              {t('footer.brandDescription')}
            </p>
            <div className="flex flex-col gap-1">
              <a
                href="https://djiguicorporation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-[#B5850A] transition"
              >
                djiguicorporation.org ↗
              </a>
              <a
                href="https://isacoultess.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-[#B5850A] transition"
              >
                isacoultess.com ↗
              </a>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.platformTitle')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                [t('nav.home'), '/'],
                [t('footer.platformLinks.about'), '/about'],
                [t('footer.platformLinks.howItWorks'), '/how-it-works'],
                [t('footer.platformLinks.impact'), '/impact'],
                [t('nav.dashboard'), '/dashboard'],
                [t('footer.platformLinks.signInPortals'), '/connexion'],
                [t('footer.platformLinks.farmerPortal'), '/my-dashboard'],
                [t('footer.platformLinks.cooperativePortal'), '/cooperative-portal'],
                [t('footer.platformLinks.governmentAccess'), '/platform-licensing?type=government'],
                [t('footer.platformLinks.institutionalLicenses'), '/platform-licensing'],
                [t('nav.contact'), '/contact'],
                [t('footer.platformLinks.prices'), '/pricing'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-gray-300 hover:text-white transition text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AfriYield */}
          <div>
            <h4 className="font-semibold mb-4">
              <Link to="/afri-yield" className="text-[#B5850A] hover:text-yellow-400 transition">
                AfriYield Exchange
              </Link>
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                [t('footer.afriYieldLinks.opportunities'), '/afri-yield/opportunities'],
                [t('footer.afriYieldLinks.marketplace'), '/afri-yield/marketplace'],
                [t('footer.afriYieldLinks.registerInvestor'), '/afri-yield/register'],
                [t('footer.afriYieldLinks.myPortal'), '/afri-yield/portal'],
                [t('footer.afriYieldLinks.updates'), '/afri-yield/updates'],
                [t('footer.afriYieldLinks.investorRelations'), '/investor-relations'],
                [t('footer.afriYieldLinks.howItWorks'), '/how-it-works'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-gray-300 hover:text-white transition text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools & Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.toolsLegalTitle')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                [t('footer.toolsLinks.soilDiagnosis'), '/diagnostic-sol'],
                [t('footer.toolsLinks.diseaseDetection'), '/detection-maladies'],
                ['Think Tank', '/think-tank'],
                [t('footer.toolsLinks.traceability'), '/trace'],
                [t('footer.toolsLinks.governance'), '/governance'],
                [t('footer.toolsLinks.helpCenter', 'Help Center'), '/help-center'],
                [t('footer.toolsLinks.terms'), '/terms-of-service'],
                [t('footer.toolsLinks.privacy'), '/privacy-policy'],
                ['User Agreement', '/user-agreement'],
                [t('footer.toolsLinks.deleteAccount'), '/delete-account'],
                ['Support WhatsApp', 'https://wa.me/12152175381'],
              ].map(([label, to]) => (
                <li key={to}>
                  {to.startsWith('http') ? (
                    <a
                      href={to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition text-sm"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link to={to} className="text-gray-300 hover:text-white transition text-sm">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Djigui Corporation.{' '}
            {t('footer.rights')}
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/terms-of-service" className="text-xs text-gray-500 hover:text-white transition">
              {t('footer.termsShort')}
            </Link>
            <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-white transition">
              {t('footer.privacyShort')}
            </Link>
            <Link to="/user-agreement" className="text-xs text-gray-500 hover:text-white transition">
              User Agreement
            </Link>
            <Link to="/help-center" className="text-xs text-gray-500 hover:text-white transition">
              Help Center
            </Link>
            <a
              href="https://wa.me/12152175381"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-white transition"
            >
              Support WhatsApp
            </a>
            <Link to="/investor-relations" className="text-xs text-gray-500 hover:text-white transition">
              {t('footer.afriYieldLinks.investorRelations')}
            </Link>
          </div>
        </div>

        {/* Discreet admin access — bottom of Footer.jsx */}
        <div className="mt-4 pt-4 border-t border-gray-700 text-center pb-6">
          <Link
            to="/admin/login"
            className="text-xs text-gray-600 hover:text-gray-400 transition"
          >
            {t('footer.adminAccess')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
