import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_BASE_URL;

export default function InvestorUpdates() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'investor_updates_subscribe' }),
      });
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  return (
    <div style={{ background: '#0d1f17', minHeight: '100vh' }}>
      <div className="section-container py-16 text-center max-w-2xl mx-auto">
        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
          style={{ background: 'rgba(181,133,10,0.2)', color: '#B5850A' }}
        >
          AfriYield Exchange
        </span>
        <h1 className="text-3xl font-bold text-white mb-4">
          {isFr ? 'Rapports de marché & Actualités' : 'Market Reports & Updates'}
        </h1>
        <p className="text-white/50 text-lg mb-10">
          {isFr
            ? 'Les rapports hebdomadaires sur les commodités africaines et les alertes de nouvelles opportunités arrivent bientôt. Inscrivez-vous pour être parmi les premiers à les recevoir.'
            : 'Weekly African commodity reports and new opportunity alerts are coming soon. Subscribe to be among the first to receive them.'}
        </p>

        <div
          className="rounded-2xl p-6 mb-10 text-left"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="font-bold text-white mb-4">{isFr ? 'Ce que contiendront les rapports :' : 'What reports will include:'}</h3>
          <div className="space-y-3">
            {[
              {
                icon: '📊',
                text: isFr
                  ? 'Prix hebdomadaires des commodités (karité, sésame, cajou, etc.)'
                  : 'Weekly commodity prices (shea, sesame, cashew, etc.)',
              },
              {
                icon: '🌾',
                text: isFr
                  ? "Nouvelles opportunités d'investissement AfriYield"
                  : 'New AfriYield investment opportunities',
              },
              {
                icon: '🌍',
                text: isFr ? "Actualités des marchés d'exportation d'Afrique de l'Ouest" : 'West African export market news',
              },
              {
                icon: '📈',
                text: isFr ? 'Performance de la saison agricole par pays' : 'Agricultural season performance by country',
              },
              {
                icon: '💰',
                text: isFr ? 'Mises à jour sur vos investissements actifs' : 'Updates on your active investments',
              },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/60">
                <span className="text-lg">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {done ? (
          <div className="rounded-2xl p-6" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <p className="text-green-400 font-bold text-lg mb-1">✓ {isFr ? 'Inscription confirmée !' : 'Subscribed!'}</p>
            <p className="text-white/50 text-sm">
              {isFr ? 'Vous recevrez le premier rapport dès sa publication.' : 'You will receive the first report as soon as it is published.'}
            </p>
          </div>
        ) : (
          <form onSubmit={subscribe} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button type="submit" className="px-5 py-3 rounded-xl font-bold text-sm text-[#1a3c2e]" style={{ background: '#B5850A' }}>
              {isFr ? "S'inscrire" : 'Subscribe'}
            </button>
          </form>
        )}

        <p className="text-white/30 text-xs mt-6">
          {isFr ? 'Questions ? Contactez notre équipe à ' : 'Questions? Contact our team at '}
          <a href="mailto:support@woneapp.com" className="text-[#B5850A] hover:underline">
            support@woneapp.com
          </a>
        </p>
      </div>
    </div>
  );
}
