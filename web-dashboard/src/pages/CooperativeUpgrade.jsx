import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { isStripeCheckoutAvailable, createCheckoutSession } from '../lib/stripeCheckout';

const COOP_PRICE_USD = 199;

export default function CooperativeUpgrade() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email =
    typeof window !== 'undefined'
      ? localStorage.getItem('sac_coop_email') || ''
      : '';
  const coopName =
    typeof window !== 'undefined'
      ? localStorage.getItem('sac_coop_name') || ''
      : '';

  const startCheckout = async () => {
    setError('');
    if (!isStripeCheckoutAvailable()) {
      setError(isFr ? 'Paiement indisponible.' : 'Checkout unavailable.');
      return;
    }
    setLoading(true);
    try {
      const result = await createCheckoutSession('cooperative_growth', {
        email,
        billingInterval: 'year',
        amountUsd: COOP_PRICE_USD,
        tierName: isFr ? 'Coopérative Croissance' : 'Growth Cooperative',
        successUrl: `${window.location.origin}/cooperative-portal?upgrade=success`,
        cancelUrl: `${window.location.origin}/cooperative-upgrade?cancelled=1`,
      });
      // Fallback direct API if helper lacks cooperative_growth defaults
      if (result?.error) {
        const res = await fetch(`${API_BASE_URL}/api/payments/stripe/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            tierKey: 'cooperative_growth',
            tierName: isFr ? 'Coopérative Croissance' : 'Growth Cooperative',
            amountUsd: COOP_PRICE_USD,
            billingInterval: 'year',
            cooperativeName: coopName,
            metadata: { cooperativeName: coopName, tier: 'growth' },
            successUrl: `${window.location.origin}/cooperative-portal?upgrade=success`,
            cancelUrl: `${window.location.origin}/cooperative-upgrade?cancelled=1`,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error(data?.error || result.error);
      }
    } catch (e) {
      setError(e.message || (isFr ? 'Erreur de paiement.' : 'Payment error.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white px-4 py-16" style={{ background: '#0b1f12' }}>
      <div className="max-w-lg mx-auto rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8">
        <p className="text-4xl mb-4 text-center">🚀</p>
        <h1 className="text-2xl font-bold text-center mb-2">
          {isFr ? 'Passer au plan Croissance' : 'Upgrade to Growth Plan'}
        </h1>
        <p className="text-white/60 text-sm text-center mb-6 leading-relaxed">
          {isFr
            ? 'Débloquez la certification, AfriYield Exchange et l\'export diaspora pour 199$/an. Requis pour les coopératives de 51+ membres.'
            : 'Unlock certification, AfriYield Exchange, and diaspora export for $199/year. Required for cooperatives with 51+ members.'}
        </p>
        <ul className="space-y-2 text-sm text-white/70 mb-8">
          {[
            isFr ? 'Workflow de certification' : 'Certification workflow',
            isFr ? 'Référencement AfriYield Exchange' : 'AfriYield Exchange listing',
            isFr ? 'Export vers marchés diaspora' : 'Export to diaspora markets',
            isFr ? 'Éligibilité fonds d\'équipement' : 'Equipment fund eligibility',
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-amber-400">✓</span>
              {item}
            </li>
          ))}
        </ul>
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={startCheckout}
          className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading
            ? isFr
              ? 'Redirection...'
              : 'Redirecting...'
            : isFr
              ? 'Payer 199$/an avec Stripe →'
              : 'Pay $199/year with Stripe →'}
        </button>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-white/50 hover:text-white"
          >
            {isFr ? '← Retour' : '← Back'}
          </button>
          <Link to="/cooperative-portal" className="text-teal-400 hover:underline">
            {isFr ? 'Portail coopérative' : 'Cooperative portal'}
          </Link>
        </div>
      </div>
    </div>
  );
}
