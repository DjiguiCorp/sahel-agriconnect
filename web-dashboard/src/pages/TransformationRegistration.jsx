import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProcessorRegistration from '../components/ProcessorRegistration';
import AppReturnBanner from '../components/AppReturnBanner';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import { API_BASE_URL } from '../config/api';

export default function TransformationRegistration() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState('month');
  const [showPayMethods, setShowPayMethods] = useState(false);
  const [payEmail, setPayEmail] = useState('');
  const [centerName, setCenterName] = useState('');

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setPaymentDone(true);
      setSuccess(true);
    }
  }, [searchParams]);

  const amountUsd = billingInterval === 'year' ? 1090 : 109;

  const handleTransformationPayment = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/stripe/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payEmail || '',
          tierKey: 'transformation',
          tierName:
            billingInterval === 'year'
              ? 'Transformation Center — Annual'
              : 'Transformation Center — Monthly',
          amountUsd,
          billingInterval,
          successUrl: `${window.location.origin}/transformation-registration?payment=success`,
          cancelUrl: `${window.location.origin}/transformation-registration?payment=cancelled`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(isFr ? 'Erreur de paiement. Veuillez réessayer.' : 'Payment error. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert(isFr ? 'Erreur de connexion. Veuillez réessayer.' : 'Connection error. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0b1f12' }}>
      <section
        style={{
          background: `
            radial-gradient(ellipse 120% 70% at 50% -10%,
              rgba(80,52,0,0.55) 0%,
              rgba(40,28,0,0.35) 40%,
              transparent 65%),
            radial-gradient(ellipse 70% 50% at 100% 30%,
              rgba(29,158,117,0.12) 0%, transparent 50%),
            linear-gradient(180deg, #1a1208 0%, #0b1f12 100%)
          `,
          borderBottom: '1px solid rgba(181,133,10,0.25)',
        }}
        className="py-14"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#F59E0B',
              borderColor: 'rgba(245,158,11,0.3)',
            }}
          >
            🏭 {isFr ? 'Centre de transformation' : 'Transformation Center'}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? 'Enregistrez votre centre de transformation' : 'Register Your Transformation Center'}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {isFr
              ? "Rejoignez le réseau de centres certifiés Sahel AgriConnect. Accédez aux coopératives, aux investisseurs et aux marchés d'exportation."
              : 'Join the Sahel AgriConnect certified center network. Access cooperatives, investors, and export markets.'}
          </p>
        </div>
      </section>

      <section
        className="max-w-4xl mx-auto px-4 py-8"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 0% 80%,
              rgba(20,55,40,0.35) 0%, transparent 50%)
          `,
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            ['🤝', isFr ? 'Coopératives certifiées' : 'Certified coops', isFr ? 'Accès direct' : 'Direct access'],
            ['💰', isFr ? 'Investisseurs AfriYield' : 'AfriYield investors', isFr ? 'Visibilité listing' : 'Listing visibility'],
            ['🌍', isFr ? 'Marchés export' : 'Export markets', isFr ? 'Réseau mondial' : 'Global network'],
            ['⭐', isFr ? 'Certification' : 'Certification', isFr ? 'Label qualité' : 'Quality label'],
          ].map(([icon, title, sub]) => (
            <div
              key={title}
              className="rounded-2xl p-4 text-center border"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-white/50 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(245,158,11,0.06)' }}
          >
            <h2 className="text-white font-bold text-lg">
              {paymentDone
                ? (isFr ? "📋 Formulaire d'enregistrement" : '📋 Registration Form')
                : (isFr ? '💳 Abonnement requis' : '💳 Subscription Required')}
            </h2>
            <p className="text-white/50 text-sm">
              {paymentDone
                ? (isFr
                    ? 'Paiement confirmé — complétez votre enregistrement.'
                    : 'Payment confirmed — complete your registration.')
                : (isFr
                    ? 'Payez d\'abord pour activer votre portail centre de transformation.'
                    : 'Pay first to activate your transformation center portal.')}
            </p>
          </div>

          <div className="p-6 registration-dark-zone">
            {paymentDone ? (
              <div>
                <div className="mb-4 p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold">
                  ✅ {isFr ? 'Paiement confirmé ! Complétez votre enregistrement.' : 'Payment confirmed! Complete your registration.'}
                </div>
                <ProcessorRegistration onProcessorAdded={() => { setPaymentDone(false); setSuccess(true); }} />
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <AppReturnBanner role="processor" />
                <div className="text-5xl mb-4">🏭</div>
                <h3 className="text-white font-bold text-xl mb-2">
                  {isFr ? 'Enregistrement reçu !' : 'Registration Received!'}
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
                  {isFr
                    ? 'Notre équipe examinera votre dossier et activera votre portail dans les 24 heures.'
                    : 'Our team will review your application and activate your portal within 24 hours.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-xl font-bold text-black"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  {isFr ? 'Voir le tableau de bord' : 'View Dashboard'}
                </button>
              </div>
            ) : showPayMethods ? (
              <div className="space-y-4">
                {checkoutLoading ? (
                  <p className="text-amber-300 text-sm text-center">...</p>
                ) : null}
                <PaymentMethodSelector
                  isFr={isFr}
                  subscriptionType="transformation_monthly"
                  amount={amountUsd}
                  amountLabel={
                    billingInterval === 'year'
                      ? isFr
                        ? '1 090$/an — Centre de transformation'
                        : '$1,090/year — Transformation Center'
                      : isFr
                        ? '109$/mois — Centre de transformation'
                        : '$109/month — Transformation Center'
                  }
                  email={payEmail}
                  entityName={centerName}
                  onStripeSelect={handleTransformationPayment}
                  onActivated={() => {
                    setPaymentDone(true);
                    setSuccess(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPayMethods(false)}
                  className="w-full text-xs text-white/50 hover:text-white"
                >
                  {isFr ? '← Retour' : '← Back'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-white font-bold text-lg mb-2">
                  {isFr ? '💳 Choisissez votre abonnement' : '💳 Choose Your Subscription'}
                </h3>
                {searchParams.get('payment') === 'cancelled' && (
                  <p className="text-red-400 text-sm">
                    {isFr ? 'Paiement annulé. Vous pouvez réessayer.' : 'Payment cancelled. You can try again.'}
                  </p>
                )}
                <label className="block text-sm text-white/70">
                  {isFr ? 'Email (requis pour Orange Money / Wave)' : 'Email (required for Orange Money / Wave)'}
                  <input
                    type="email"
                    value={payEmail}
                    onChange={(e) => setPayEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-black/30 border border-white/15 px-3 py-2.5 text-white text-sm"
                    placeholder="centre@email.com"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  {isFr ? 'Nom du centre (optionnel)' : 'Center name (optional)'}
                  <input
                    type="text"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-black/30 border border-white/15 px-3 py-2.5 text-white text-sm"
                  />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingInterval('month');
                      setShowPayMethods(true);
                    }}
                    className="rounded-xl p-5 border border-amber-500/30 bg-amber-500/10 text-left hover:border-amber-400"
                  >
                    <p className="text-amber-400 font-bold text-lg">$109 / {isFr ? 'mois' : 'month'}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {isFr ? 'Puis choisir la méthode de paiement →' : 'Then choose payment method →'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingInterval('year');
                      setShowPayMethods(true);
                    }}
                    className="rounded-xl p-5 border border-amber-400/50 bg-amber-500/15 text-left hover:border-amber-300"
                  >
                    <p className="text-amber-400 font-bold text-lg">$1,090 / {isFr ? 'an' : 'year'}</p>
                    <p className="text-green-400 text-xs mb-1">
                      {isFr ? 'Économisez $218/an' : 'Save $218/year'}
                    </p>
                    <p className="text-white/60 text-sm">
                      {isFr ? 'Puis choisir la méthode de paiement →' : 'Then choose payment method →'}
                    </p>
                  </button>
                </div>
                <p className="text-white/40 text-xs text-center">
                  🔒{' '}
                  {isFr
                    ? 'Stripe · Orange Money · Wave · Espèces'
                    : 'Stripe · Orange Money · Wave · Cash'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
