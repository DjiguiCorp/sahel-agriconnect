import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  return (
    <footer className="bg-[#1a3c2e] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold mb-3">Sahel AgriConnect</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              {isFr
                ? "Infrastructure numérique souveraine pour l'agriculture africaine. Conçu et opéré par Djigui Corporation."
                : 'Sovereign digital infrastructure for African agriculture. Designed and operated by Djigui Corporation.'}
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
            <h4 className="font-semibold mb-4 text-white">{isFr ? 'Plateforme' : 'Platform'}</h4>
            <ul className="space-y-2 text-sm">
              {(isFr
                ? [
                    ['Accueil', '/'],
                    ['À propos', '/about'],
                    ['Comment ça marche', '/how-it-works'],
                    ['Impact', '/impact'],
                    ['Dashboard', '/dashboard'],
                    ['Mon dashboard', '/my-dashboard'],
                    ['Portail coopérative', '/cooperative-portal'],
                    ['Portail gouvernemental', '/government-portal'],
                    ['Licences institutionnelles', '/platform-licensing'],
                    ['Contact', '/contact'],
                    ['Tarifs', '/pricing'],
                  ]
                : [
                    ['Home', '/'],
                    ['About', '/about'],
                    ['How it works', '/how-it-works'],
                    ['Impact', '/impact'],
                    ['Dashboard', '/dashboard'],
                    ['My dashboard', '/my-dashboard'],
                    ['Cooperative portal', '/cooperative-portal'],
                    ['Government portal', '/government-portal'],
                    ['Institutional licenses', '/platform-licensing'],
                    ['Contact', '/contact'],
                    ['Prices', '/pricing'],
                  ]
              ).map(([label, to]) => (
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
                [isFr ? 'Opportunités' : 'Opportunities', '/afri-yield/opportunities'],
                [isFr ? 'Marketplace' : 'Marketplace', '/afri-yield/marketplace'],
                [isFr ? "S'inscrire investisseur" : 'Register as Investor', '/afri-yield/register'],
                [isFr ? 'Mon portail' : 'My Portal', '/afri-yield/portal'],
                [isFr ? 'Mises à jour' : 'Investor Updates', '/afri-yield/updates'],
                [isFr ? 'Relations investisseurs' : 'Investor Relations', '/investor-relations'],
                [isFr ? 'Comment ça marche' : 'How It Works', '/how-it-works'],
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
            <h4 className="font-semibold mb-4 text-white">{isFr ? 'Outils & Légal' : 'Tools & Legal'}</h4>
            <ul className="space-y-2 text-sm">
              {[
                [isFr ? 'Diagnostic Sol' : 'Soil Diagnosis', '/diagnostic-sol'],
                [isFr ? 'Détection Maladies' : 'Disease Detection', '/detection-maladies'],
                ['Think Tank', '/think-tank'],
                [isFr ? 'Traçabilité' : 'Traceability', '/trace'],
                [isFr ? 'Gouvernance' : 'Governance', '/governance'],
                [isFr ? "Conditions d'utilisation" : 'Terms of Service', '/terms'],
                [isFr ? 'Confidentialité' : 'Privacy Policy', '/privacy'],
                [isFr ? 'Supprimer mon compte' : 'Delete Account', '/delete-account'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-gray-300 hover:text-white transition text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Djigui Corporation.{' '}
            {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/admin/login" className="text-xs text-gray-500 hover:text-white transition">
              {isFr ? 'Admin' : 'Admin'}
            </Link>
            <Link to="/terms" className="text-xs text-gray-500 hover:text-white transition">
              {isFr ? 'Conditions' : 'Terms'}
            </Link>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-white transition">
              {isFr ? 'Confidentialité' : 'Privacy'}
            </Link>
            <Link to="/investor-relations" className="text-xs text-gray-500 hover:text-white transition">
              {isFr ? 'Relations investisseurs' : 'Investor Relations'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
