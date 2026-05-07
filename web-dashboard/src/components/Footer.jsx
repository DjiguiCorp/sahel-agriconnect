import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-forest text-white">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sahel AgriConnect</h3>
            <p className="text-gray-300 text-sm">
              Plateforme de digitalisation souveraine de l&apos;agriculture en Afrique de l&apos;Ouest et au-delà.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/impact" className="text-gray-300 hover:text-white transition-colors">
                  Impact &amp; Métriques
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/diagnostic-sol" className="text-gray-300 hover:text-white transition-colors">
                  Diagnostic Sol
                </Link>
              </li>
              <li>
                <Link to="/detection-maladies" className="text-gray-300 hover:text-white transition-colors">
                  Détection Maladies
                </Link>
              </li>
              <li>
                <Link to="/think-tank" className="text-gray-300 hover:text-white transition-colors">
                  Think Tank
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* AfriYield Exchange */}
          <div>
            <h4 className="font-semibold mb-4">
              <Link to="/afri-yield" className="hover:text-white transition-colors">
                AfriYield Exchange
              </Link>
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Zones : Afrique de l&apos;Ouest et au-delà</li>
              <li>Objectif : Souveraineté alimentaire</li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="font-semibold mb-4">Partenaires</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Diaspora Investors Network</li>
              <li>Djigui</li>
              <li>Universités US</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <span>© 2026 Djigui Corporation. Tous droits réservés.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition">Conditions d&apos;utilisation</Link>
            <Link to="/privacy" className="hover:text-white transition">Politique de confidentialité</Link>
            <Link to="/impact" className="hover:text-white transition">Impact &amp; Métriques</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

