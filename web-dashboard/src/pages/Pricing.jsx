import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Factory, Building2, Landmark, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

const TIER_KEYS = ['farmerBasic', 'producerPro', 'transformationCenter', 'enterprise'];
const TIER_PRICES = ['', '$32', '$109', '$999'];
const TIER_AMOUNTS_USD = [0, 32, 109, 999];
const TIER_ICONS = [Sprout, Factory, Building2, Landmark];
const TIER_LINKS = ['/dashboard', '/contact', '/contact', '/platform-licensing'];
const TIER_VARIANTS = ['outline', 'gold', 'gold', 'gold'];
const TIER_POPULAR = [false, true, false, false];

// USD → XOF (rough; real conversion happens at the gateway)
const USD_TO_XOF = 620;

const isAfricanLocale = () => {
  if (typeof navigator === 'undefined') return false;
  const lang = navigator.language || '';
  return lang.startsWith('fr') || lang.includes('ML') || lang.includes('BF') || lang.includes('NE');
};

const getPaymentMethod = (tierIndex) => {
  if (tierIndex === 0) return 'free';
  if (tierIndex === 3) return 'stripe'; // enterprise always Stripe
  return isAfricanLocale() ? 'mobile_money' : 'stripe';
};

export default function Pricing() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [pendingTierIndex, setPendingTierIndex] = useState(null);
  const [pendingTierName, setPendingTierName] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('orange');
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const detectedMethod = useMemo(
    () => (pendingTierIndex == null ? null : getPaymentMethod(pendingTierIndex)),
    [pendingTierIndex]
  );

  const openSubscribeModal = (tierIndex, tierName) => {
    const amount = TIER_AMOUNTS_USD[tierIndex];
    if (!amount) return;
    setPendingTierIndex(tierIndex);
    setPendingTierName(tierName);
    setPaymentEmail('');
    setPaymentPhone('');
    setSelectedMethod('orange');
    setPaymentError('');
    setSubscribeModalOpen(true);
  };

  const closeSubscribeModal = () => {
    setSubscribeModalOpen(false);
    setPendingTierIndex(null);
    setPendingTierName('');
    setPaymentEmail('');
    setPaymentPhone('');
    setPaymentError('');
    setLoading(false);
  };

  const handlePayment = async () => {
    if (pendingTierIndex == null) return;
    const method = getPaymentMethod(pendingTierIndex);
    const amount = TIER_AMOUNTS_USD[pendingTierIndex];
    const tierName = pendingTierName;
    const email = paymentEmail.trim();
    const phone = paymentPhone.trim();
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    if (method === 'free') {
      closeSubscribeModal();
      return;
    }
    if (!email) {
      setPaymentError('Please enter your email.');
      return;
    }
    if (method === 'mobile_money' && selectedMethod !== 'stripe' && !phone) {
      setPaymentError('Please enter your mobile money phone number.');
      return;
    }

    setLoading(true);
    setPaymentError('');

    try {
      // Stripe — enterprise OR diaspora / non-African user
      if (method === 'stripe' || selectedMethod === 'stripe') {
        const res = await fetch(`${apiBase}/api/payments/stripe/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            tierKey: TIER_KEYS[pendingTierIndex],
            tierName,
            amountUsd: amount,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setPaymentError(data.error || 'Stripe checkout failed');
        }
        return;
      }

      // Orange Money Web Pay
      if (selectedMethod === 'orange') {
        const amountXof = Math.round(amount * USD_TO_XOF);
        const res = await fetch(`${apiBase}/api/payments/orange/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phone,
            amount: amountXof,
            currency: 'XOF',
            tierName,
            orderId: `SAC-${TIER_KEYS[pendingTierIndex]}-${Date.now()}`,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setPaymentError(data.error || 'Orange Money initiation failed');
        }
        return;
      }

      // MTN MoMo Collections — request to pay
      if (selectedMethod === 'mtn') {
        const amountXof = Math.round(amount * USD_TO_XOF);
        const res = await fetch(`${apiBase}/api/payments/mtn/request-to-pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phone,
            amount: amountXof,
            currency: 'XOF',
            tierName,
          }),
        });
        const data = await res.json();
        if (data.success) {
          closeSubscribeModal();
          // eslint-disable-next-line no-alert
          alert(
            data.message ||
              'Payment request sent to your phone. Approve it in the MTN MoMo app.'
          );
        } else {
          setPaymentError(data.error || 'MTN MoMo request failed');
        }
        return;
      }
    } catch (e) {
      setPaymentError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showPhoneField =
    detectedMethod === 'mobile_money' && selectedMethod !== 'stripe';
  const showMethodPicker = detectedMethod === 'mobile_money';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {subscribeModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscribe-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h2 id="subscribe-modal-title" className="text-lg font-bold text-[#1a3c2e] mb-1">
              {t('pricing.subscribeTitle', 'Subscribe')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {pendingTierName} — {t('pricing.subscribeEmailHint', 'Enter your email to continue to secure checkout.')}
            </p>

            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="payment-email">
              Email
            </label>
            <input
              id="payment-email"
              type="email"
              autoComplete="email"
              value={paymentEmail}
              onChange={(e) => setPaymentEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#1a3c2e]"
              placeholder="you@example.com"
            />

            {showMethodPicker && (
              <>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('pricing.payMethod', 'Payment method')}
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('orange')}
                    className={`py-2 rounded-xl text-sm font-semibold border ${
                      selectedMethod === 'orange'
                        ? 'border-[#FF7900] bg-[#FFF4EB] text-[#7A3A00]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🟠 Orange Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('mtn')}
                    className={`py-2 rounded-xl text-sm font-semibold border ${
                      selectedMethod === 'mtn'
                        ? 'border-[#FFCC00] bg-[#FFF8DB] text-[#665100]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🟡 MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('stripe')}
                    className={`py-2 rounded-xl text-sm font-semibold border ${
                      selectedMethod === 'stripe'
                        ? 'border-[#1a3c2e] bg-[#EAF1ED] text-[#1a3c2e]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    💳 Card
                  </button>
                </div>
              </>
            )}

            {showPhoneField && (
              <>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="payment-phone">
                  Mobile money number
                </label>
                <input
                  id="payment-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  placeholder="+223 XX XX XX XX"
                />
              </>
            )}

            {detectedMethod === 'stripe' && (
              <p className="text-xs text-gray-500 mb-3">
                {t(
                  'pricing.stripeHint',
                  'You will be redirected to Stripe to complete payment securely.'
                )}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeSubscribeModal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading || !paymentEmail.trim() || (showPhoneField && !paymentPhone.trim())}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1a3c2e] text-white hover:bg-[#143326] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? t('pricing.processing', 'Processing…')
                    : t('pricing.payNow', 'Pay now')}
                </button>
              </div>
              {paymentError && (
                <p className="text-sm text-red-600 mt-2 text-center">{paymentError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a3c2e] mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Main pricing tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {TIER_KEYS.map((key, i) => {
          const Icon = TIER_ICONS[i];
          const isEnterprise = key === 'enterprise';
          const isPopular = TIER_POPULAR[i];
          return (
            <div
              key={key}
              className={`relative rounded-2xl border p-7 flex flex-col h-full ${
                isEnterprise
                  ? 'border-[#B5850A] bg-gradient-to-b from-[#1a3c2e] to-[#143326] text-white shadow-xl'
                  : 'border-gray-200 bg-white shadow-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B5850A] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {t('pricing.popular')}
                </div>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                isEnterprise ? 'bg-[#B5850A]/20' : 'bg-green-50'
              }`}>
                <Icon className={`w-5 h-5 ${isEnterprise ? 'text-[#B5850A]' : 'text-[#1a3c2e]'}`} />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${isEnterprise ? 'text-white' : 'text-[#1a3c2e]'}`}>
                {t(`pricing.tiers.${key}.name`)}
              </h3>
              <div className="mb-5">
                <span className={`text-3xl font-bold ${isEnterprise ? 'text-[#B5850A]' : 'text-[#1a3c2e]'}`}>
                  {TIER_PRICES[i] || t('pricing.free')}
                </span>
                {TIER_PRICES[i] && (
                  <span className={`text-sm ${isEnterprise ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('pricing.perMonth')}
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {t(`pricing.tiers.${key}.features`, { returnObjects: true }).map((feat, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isEnterprise ? 'text-[#B5850A]' : 'text-[#1a3c2e]'}`} />
                    <span className={isEnterprise ? 'text-gray-200' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
              </ul>
              {TIER_PRICES[i] ? (
                <button
                  type="button"
                  onClick={() => openSubscribeModal(i, t(`pricing.tiers.${key}.name`))}
                  className={`w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer ${
                    isEnterprise
                      ? 'bg-[#B5850A] text-white hover:bg-[#9a7009]'
                      : 'bg-[#1a3c2e] text-white hover:bg-[#143326]'
                  }`}
                >
                  {t(`pricing.tiers.${key}.cta`)}
                </button>
              ) : (
                <Link
                  to={TIER_LINKS[i]}
                  className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white transition"
                >
                  {t(`pricing.tiers.${key}.cta`)}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom three sections */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Cooperative */}
        <div className="rounded-2xl border-2 border-[#1a3c2e] bg-white p-7 flex flex-col">
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{t('pricing.cooperative.title')}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-1">{t('pricing.cooperative.description')}</p>
          <p className="text-2xl font-bold text-[#B5850A] mb-5">{t('pricing.cooperative.price')}</p>
          <Link to="/cooperative-registration" className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#1a3c2e] text-white hover:bg-[#143326] transition">
            {t('pricing.cooperative.cta')}
          </Link>
        </div>

        {/* Government */}
        <div className="rounded-2xl border-2 border-[#B5850A] bg-white p-7 flex flex-col">
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{t('pricing.government.title')}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-1">{t('pricing.government.description')}</p>
          <p className="text-2xl font-bold text-[#B5850A] mb-5">{t('pricing.government.price')}</p>
          <Link to="/platform-licensing" className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#B5850A] text-white hover:bg-[#9a7009] transition">
            {t('pricing.government.cta')}
          </Link>
        </div>

        {/* Diaspora Investor */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-7 flex flex-col">
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{t('pricing.diaspora.title')}</h3>
          <p className="text-gray-600 text-sm mb-2 flex-1">{t('pricing.diaspora.description')}</p>
          <p className="text-sm text-[#1a3c2e] font-medium mb-5">✓ {t('pricing.diaspora.track')}</p>
          <Link to="/afri-yield/register" className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white transition">
            {t('pricing.diaspora.cta')}
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1a3c2e] text-center mb-8">{t('pricing.faq.title')}</h2>
        <div className="space-y-3">
          {[1,2,3,4].map(n => (
            <div key={n} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === n ? null : n)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-[#1a3c2e] hover:bg-gray-50 transition"
              >
                <span>{t(`pricing.faq.q${n}`)}</span>
                {openFaq === n
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                }
              </button>
              {openFaq === n && (
                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                  {t(`pricing.faq.a${n}`)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
