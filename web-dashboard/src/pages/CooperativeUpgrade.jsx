import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { isStripeCheckoutAvailable, createCheckoutSession } from '../lib/stripeCheckout';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

const COOP_PRICE_USD = 199;
const GROWTH_REQUIRED = 51;
const COOP_TOKEN = 'sac_coop_token';

export default function CooperativeUpgrade() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [verifiedMemberCount, setVerifiedMemberCount] = useState(0);
  const [eligible, setEligible] = useState(false);
  const [showPayMethods, setShowPayMethods] = useState(false);

  const email =
    typeof window !== 'undefined' ? localStorage.getItem('sac_coop_email') || '' : '';
  const coopName =
    typeof window !== 'undefined' ? localStorage.getItem('sac_coop_name') || '' : '';
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem(COOP_TOKEN) || localStorage.getItem(COOP_TOKEN) || ''
      : '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChecking(true);
      try {
        if (!token) {
          if (!cancelled) {
            setEligible(false);
            setVerifiedMemberCount(0);
          }
          return;
        }
        const r = await fetch(`${API_BASE_URL}/api/cooperatives/my-portal/growth-eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        const count = Number(d.verifiedMemberCount ?? 0);
        setVerifiedMemberCount(count);
        setEligible(Boolean(d.eligible) || count >= GROWTH_REQUIRED);
        if (!r.ok && d.error) setError(d.error);
      } catch (e) {
        if (!cancelled) setError(e.message || (isFr ? 'Erreur de chargement.' : 'Load error.'));
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFr, token]);

  const startCheckout = async () => {
    setError('');
    if (!eligible || verifiedMemberCount < GROWTH_REQUIRED) {
      setError(
        isFr
          ? 'Vous devez avoir 51 membres vérifiés pour accéder au plan Croissance.'
          : 'You need 51 verified members to access the Growth plan.'
      );
      return;
    }
    if (!isStripeCheckoutAvailable()) {
      setError(isFr ? 'Paiement Stripe indisponible.' : 'Stripe checkout unavailable.');
      return;
    }
    setLoading(true);
    try {
      const result = await createCheckoutSession('cooperative_growth', {
        email,
        billingInterval: 'year',
        amountUsd: COOP_PRICE_USD,
        tierName: isFr ? 'Coopérative Croissance' : 'Growth Cooperative',
        cooperativeName: coopName,
        memberCount: verifiedMemberCount,
        successUrl: `${window.location.origin}/cooperative-portal?upgrade=success`,
        cancelUrl: `${window.location.origin}/cooperative-upgrade?cancelled=1`,
      });
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
            memberCount: verifiedMemberCount,
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
            ? "Débloquez la certification, AfriYield Exchange et l'export diaspora pour 199$/an. Requis pour les coopératives de 51+ membres vérifiés."
            : 'Unlock certification, AfriYield Exchange, and diaspora export for $199/year. Required for cooperatives with 51+ verified members.'}
        </p>

        {checking ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : !eligible ? (
          <div className="rounded-2xl border border-white/15 bg-black/20 p-5 text-center mb-4">
            <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-white/85 leading-relaxed mb-4">
              {isFr
                ? `Vous avez ${verifiedMemberCount} membres vérifiés. Atteignez 51 membres vérifiés pour débloquer le plan Croissance.`
                : `You have ${verifiedMemberCount} verified members. Reach 51 verified members to unlock the Growth plan.`}
            </p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: `${Math.min(100, Math.round((verifiedMemberCount / GROWTH_REQUIRED) * 100))}%`,
                }}
              />
            </div>
            <Link
              to="/cooperative-portal"
              className="inline-flex px-5 py-3 rounded-xl bg-[#1a3c2e] text-white font-bold text-sm hover:opacity-90"
            >
              {isFr ? 'Retour au portail' : 'Back to portal'}
            </Link>
          </div>
        ) : showPayMethods ? (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : null}
            {error ? <p className="text-red-400 text-sm mb-4 text-center">{error}</p> : null}
            <PaymentMethodSelector
              isFr={isFr}
              subscriptionType="cooperative_growth"
              amount={COOP_PRICE_USD}
              amountLabel={isFr ? '199$/an — Plan Croissance' : '$199/year — Growth Plan'}
              authToken={token}
              email={email}
              entityName={coopName}
              onStripeSelect={startCheckout}
              onActivated={() => {
                navigate('/cooperative-portal?upgrade=success');
              }}
            />
          </>
        ) : (
          <>
            <ul className="space-y-2 text-sm text-white/70 mb-8">
              {[
                isFr ? 'Workflow de certification' : 'Certification workflow',
                isFr ? 'Référencement AfriYield Exchange' : 'AfriYield Exchange listing',
                isFr ? 'Export vers marchés diaspora' : 'Export to diaspora markets',
                isFr ? "Éligibilité fonds d'équipement" : 'Equipment fund eligibility',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-amber-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            {error ? <p className="text-red-400 text-sm mb-4 text-center">{error}</p> : null}
            <button
              type="button"
              onClick={() => setShowPayMethods(true)}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition"
            >
              {isFr ? 'Choisir une méthode de paiement →' : 'Choose a payment method →'}
            </button>
          </>
        )}

        <div className="mt-4 flex justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-white/50 hover:text-white"
          >
            {isFr ? 'Retour' : 'Back'}
          </button>
          <Link to="/cooperative-portal" className="text-white/50 hover:text-white">
            {isFr ? 'Portail' : 'Portal'}
          </Link>
        </div>
      </div>
    </div>
  );
}
