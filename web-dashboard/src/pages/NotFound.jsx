import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6">🌾</div>
      <h1 className="text-4xl font-bold text-[#1a3c2e] mb-3">404</h1>
      <p className="text-xl text-gray-600 mb-2">
        {isFr ? "Cette page n'existe pas" : 'This page does not exist'}
      </p>
      <p className="text-gray-400 mb-8 max-w-md">
        {isFr
          ? 'La page que vous cherchez a peut-être été déplacée ou n\'a jamais existé.'
          : 'The page you are looking for may have moved or never existed.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="rounded-xl px-6 py-3 font-semibold text-white"
          style={{ background: '#1a3c2e' }}
        >
          {isFr ? "Retour à l'accueil" : 'Back to home'}
        </Link>
        <Link
          to="/afri-yield"
          className="rounded-xl px-6 py-3 font-semibold text-[#1a3c2e] border-2 border-[#1a3c2e]"
        >
          AfriYield Exchange
        </Link>
      </div>
    </div>
  );
}
