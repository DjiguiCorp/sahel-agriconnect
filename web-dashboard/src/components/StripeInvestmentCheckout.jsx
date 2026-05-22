import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { API_BASE_URL } from '../config/api';

// Load Stripe outside component to avoid recreating on every render
loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const API = API_BASE_URL.replace(/\/$/, '');

export default function StripeInvestmentCheckout({
  opportunityId,
  opportunityName,
  amountUSD,
  investorEmail,
  investorName,
  expectedROI,
  isFr,
  submitting = false,
  pageLoading = false,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStripeCheckout = async () => {
    if (!amountUSD || Number(amountUSD) < 500) {
      setError(
        isFr ? 'Montant minimum: $500 USD' : 'Minimum investment: $500 USD'
      );
      return;
    }
    if (!investorEmail) {
      setError(
        isFr
          ? 'Email requis pour procéder au paiement'
          : 'Email required to proceed with payment'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${API}/api/payments/stripe/create-investment-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            investorEmail,
            investorName: investorName || '',
            opportunityId,
            opportunityName,
            amountUSD: Number(amountUSD),
            expectedROI,
          }),
        }
      );

      const data = await res.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-amber-400 font-semibold text-sm mb-3">
          💰 {isFr ? "Résumé de l'investissement" : 'Investment Summary'}
        </p>
        <div className="space-y-2">
          {[
            [isFr ? 'Opportunité' : 'Opportunity', opportunityName || opportunityId],
            [isFr ? 'Montant' : 'Amount', `$${Number(amountUSD).toLocaleString()} USD`],
            [
              isFr ? 'Rendement projeté' : 'Projected return',
              expectedROI > 0
                ? `~${expectedROI}% proj. (not guaranteed)`
                : '—',
            ],
            [
              isFr ? 'Mode de paiement' : 'Payment method',
              isFr ? 'Carte bancaire via Stripe' : 'Card via Stripe',
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-white/50">{label}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-white/50 text-xs leading-relaxed">
          ⚠️{' '}
          {isFr
            ? "En procédant, vous reconnaissez que les rendements projetés ne sont pas garantis. AfriYield Exchange n'est pas une institution financière agréée. Les investissements comportent des risques incluant la perte du capital."
            : 'By proceeding, you acknowledge that projected returns are not guaranteed. AfriYield Exchange is not a licensed financial institution. Investments carry risk including loss of capital.'}
        </p>
      </div>

      <div className="flex items-center gap-2 justify-center flex-wrap">
        <span className="text-white/30 text-xs">
          {isFr ? 'Méthodes acceptées:' : 'Accepted:'}
        </span>
        {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map((m) => (
          <span
            key={m}
            className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-md"
          >
            {m}
          </span>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleStripeCheckout}
        disabled={
          !amountUSD ||
          Number(amountUSD) < 500 ||
          submitting ||
          loading ||
          pageLoading
        }
        className="w-full py-4 rounded-xl font-bold text-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: loading ? '#9ca3af' : '#B5850A' }}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {isFr ? 'Redirection vers Stripe...' : 'Redirecting to Stripe...'}
          </>
        ) : (
          <>
            🔒{' '}
            {!amountUSD || Number(amountUSD) === 0
              ? isFr
                ? 'Entrez un montant pour continuer'
                : 'Enter amount to continue'
              : submitting
                ? isFr
                  ? 'Traitement...'
                  : 'Processing...'
                : isFr
                  ? `Payer $${Number(amountUSD).toLocaleString()} via Stripe`
                  : `Pay $${Number(amountUSD).toLocaleString()} via Stripe`}
          </>
        )}
      </button>

      <p className="text-xs mt-1 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {isFr ? 'Montant minimum: $500 USD' : 'Minimum amount: $500 USD'}
      </p>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 rounded-xl text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          {isFr ? '← Annuler' : '← Cancel'}
        </button>
      )}

      <p className="text-center text-white/30 text-xs">
        🔒{' '}
        {isFr
          ? 'Paiement sécurisé par Stripe. Vos données bancaires ne sont jamais stockées sur nos serveurs.'
          : 'Payment secured by Stripe. Your card details are never stored on our servers.'}
      </p>
    </div>
  );
}
