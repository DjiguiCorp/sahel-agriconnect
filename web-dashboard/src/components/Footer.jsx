import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary-green text-white">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sahel AgriConnect</h3>
            <p className="text-gray-300 text-sm">
              Plateforme de digitalisation souveraine de l'agriculture au Mali et au Burkina Faso.
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

          {/* Project Info */}
          <div>
            <h4 className="font-semibold mb-4">Projet PTASS</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Période : 2026-2030</li>
              <li>Zones : Mali & Burkina Faso</li>
              <li>Objectif : Souveraineté alimentaire</li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="font-semibold mb-4">Partenaires</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>AES</li>
              <li>Djigui</li>
              <li>Universités US</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-8 pb-4 text-center text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} Sahel AgriConnect. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

