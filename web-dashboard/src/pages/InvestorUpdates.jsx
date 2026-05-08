import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const TAG_COLORS = {
  platform: 'bg-green-100 text-green-800',
  milestone: 'bg-yellow-100 text-yellow-800',
  market: 'bg-blue-100 text-blue-800',
  deal: 'bg-purple-100 text-purple-800',
};

export default function InvestorUpdates() {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const isFr = i18n.language === 'fr';

  const updates = [
    {
      id: 1,
      tag: 'milestone',
      date: 'May 2026',
      title: isFr ? 'AfriYield Exchange officiellement lancé' : 'AfriYield Exchange Officially Launches',
      summary: isFr
        ? "Après des mois de développement, AfriYield Exchange est en ligne."
        : 'After months of development, AfriYield Exchange is live.',
      full: isFr
        ? "Après des mois de développement, AfriYield Exchange est en ligne sur sahelagriconnect.vercel.app. Nos premières opportunités vérifiées en beurre de karité et sésame d'Afrique de l'Ouest sont maintenant disponibles pour investissement. Nous travaillons activement vers notre première transaction clôturée et rendrons compte avec tous les détails."
        : 'After months of development, AfriYield Exchange is live at sahelagriconnect.vercel.app. Our first verified opportunities in shea butter and sesame from West Africa are now available for investment. We are actively working toward our first closed transaction and will report back with full details.',
    },
    {
      id: 2,
      tag: 'milestone',
      date: 'May 2026',
      title: isFr ? 'Premières inscriptions de coopératives reçues' : 'First Cooperative Registrations Received',
      summary: isFr
        ? "Nous avons reçu nos premières demandes d'inscription de coopératives au Sénégal et en Côte d'Ivoire."
        : "We have received our first cooperative registration inquiries from producers in Senegal and Côte d'Ivoire.",
      full: isFr
        ? "Nous avons reçu nos premières demandes d'inscription de coopératives de producteurs au Sénégal et en Côte d'Ivoire. Notre équipe effectue actuellement la vérification et activera les premières annonces certifiées dans les deux prochaines semaines."
        : 'We have received our first cooperative registration inquiries from producers in Senegal and Côte d\'Ivoire. Our team is currently conducting verification and will activate the first certified listings within the next two weeks.',
    },
    {
      id: 3,
      tag: 'market',
      date: 'April 2026',
      title: isFr
        ? "La demande d'exportation de beurre de karité atteint un sommet sur 3 ans"
        : 'Shea Butter Export Demand Reaches 3-Year High',
      summary: isFr
        ? "La demande de l'industrie cosmétique européenne pour le beurre de karité africain certifié a atteint son niveau le plus élevé depuis 2023."
        : 'EU cosmetics industry demand for certified West African shea butter has reached its highest level since 2023.',
      full: isFr
        ? "La demande de l'industrie cosmétique européenne pour le beurre de karité africain certifié a atteint son niveau le plus élevé depuis 2023, portée par les engagements de durabilité des grandes marques. Les volumes d'exportation d'Afrique de l'Ouest sont en hausse de 23% cette année. Cela crée un excellent point d'entrée pour les investisseurs intéressés par la chaîne d'approvisionnement du karité."
        : 'EU cosmetics industry demand for certified West African shea butter has reached its highest level since 2023, driven by sustainability commitments from major brands. West African export volumes are up 23% this year. This creates an excellent entry point for investors interested in the shea supply chain.',
    },
  ];

  const subscribe = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'investor_updates' }),
      });
    } catch {}
    setSubscribed(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1a3c2e] mb-3">{t('trust.updates.title')}</h1>
        <p className="text-gray-600 text-lg">{t('trust.updates.subtitle')}</p>
      </div>

      {/* Updates */}
      <div className="space-y-5 mb-14">
        {updates.map((u) => (
          <div key={u.id} className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[u.tag]}`}>
                  {t(`trust.updates.categories.${u.tag}`)}
                </span>
                <span className="text-xs text-gray-400">{u.date}</span>
              </div>
              <h3 className="font-bold text-[#1a3c2e] text-lg mb-2">{u.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{u.summary}</p>
              {expanded === u.id && (
                <p className="text-gray-600 text-sm leading-relaxed mt-3 pt-3 border-t border-gray-100">{u.full}</p>
              )}
              <button
                onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                className="mt-3 flex items-center gap-1 text-sm font-medium text-[#B5850A] hover:underline"
              >
                {expanded === u.id ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {t('trust.updates.readLess')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t('trust.updates.readMore')}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subscribe */}
      <div className="rounded-2xl p-6 text-center" style={{ background: '#F5F0E8' }}>
        <p className="font-bold text-[#1a3c2e] text-lg mb-4">{t('trust.updates.subscribe')}</p>
        {subscribed ? (
          <p className="text-green-700 font-semibold">✓ {t('trust.updates.subscribeSuccess')}</p>
        ) : (
          <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('trust.updates.subscribePlaceholder')}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
            />
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 font-semibold text-sm text-white"
              style={{ background: '#1a3c2e' }}
            >
              {t('trust.updates.subscribeCta')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

