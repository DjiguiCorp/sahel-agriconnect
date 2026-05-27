import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const WEB_BASE = 'https://sahelagriconnect.com';

/**
 * Shown after web registration + payment when user came from the mobile app (?from=app).
 */
export default function AppReturnBanner({ role }) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [searchParams] = useSearchParams();

  const fromApp = searchParams.get('from') === 'app';
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'fr';

  const deepLink = useMemo(() => {
    const params = new URLSearchParams({ role: role || 'cooperative', lang });
    if (searchParams.get('payment') === 'success') {
      params.set('payment', 'success');
    }
    return `sahelagriconnect://payment/success?${params.toString()}`;
  }, [role, lang, searchParams]);

  if (!fromApp) return null;

  const loginPaths = {
    cooperative: '/login/cooperative',
    investor: '/login/investor',
    processor: '/login/processor',
    farmer: '/login/farmer',
  };
  const loginPath = loginPaths[role] || '/home';

  return (
    <div
      className="mb-6 rounded-2xl border p-5 text-center"
      style={{
        background: 'rgba(29,158,117,0.12)',
        borderColor: 'rgba(29,158,117,0.35)',
      }}
    >
      <p className="text-white font-semibold mb-2">
        {isFr ? '📱 Retour à l\'application' : '📱 Return to the app'}
      </p>
      <p className="text-white/60 text-sm mb-4">
        {isFr
          ? 'Votre inscription web est enregistrée. Ouvrez Sahel AgriConnect pour vous connecter.'
          : 'Your web registration is saved. Open Sahel AgriConnect to sign in.'}
      </p>
      <a
        href={deepLink}
        className="inline-block px-6 py-3 rounded-xl font-bold text-white mb-3"
        style={{ background: '#B5850A' }}
      >
        {isFr ? 'Ouvrir l\'application' : 'Open the app'}
      </a>
      <p className="text-white/40 text-xs">
        {isFr
          ? `Si le bouton ne fonctionne pas, ouvrez l'app et connectez-vous avec le même email.`
          : `If the button does not work, open the app and sign in with the same email.`}
      </p>
      <p className="text-white/30 text-xs mt-2">
        {WEB_BASE}
        {loginPath}
      </p>
    </div>
  );
}
