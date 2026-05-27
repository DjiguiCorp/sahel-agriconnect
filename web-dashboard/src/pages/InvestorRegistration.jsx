import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { Loader2 } from 'lucide-react';
import { useWebSession } from '../hooks/useWebSession';
import { useGeolocation } from '../hooks/useGeolocation';
import { AFRICAN_COUNTRIES, legacyCountryToAppName } from '../data/africanCountries';
import {
  DEFAULT_INVESTOR_RESIDENCE,
  INVESTOR_RESIDENCE_I18N_KEYS,
} from '../data/investorResidenceCountries';
import AppReturnBanner from '../components/AppReturnBanner';

const RESIDENCE = [
  ...AFRICAN_COUNTRIES,
  'France',
  'United Kingdom',
  'United States',
  'Canada',
].filter((v, i, a) => a.indexOf(v) === i);

const normalizeCountry = (c) => {
  if (c === 'USA') return 'United States';
  if (c === 'UK') return 'United Kingdom';
  return c;
};

const RANGES = ['$1,000–$5,000', '$5,000–$25,000', '$25,000–$100,000', '$100,000+'];
const HEARD = ['Diaspora community', 'Social media', 'Friend or family', 'Event or conference', 'Other'];

const INPUT_CLS =
  'w-full rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-amber-500/60';
const LABEL_CLS = 'text-sm font-medium text-white/90';
const ERR_BOX = 'rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400';

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.08)',
  borderColor: 'rgba(255,255,255,0.14)',
};

const TRACK_CARD_BASE = {
  background: 'rgba(181,133,10,0.06)',
  border: '1px solid rgba(181,133,10,0.2)',
};

export default function InvestorRegistration() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skipToKYC = searchParams.get('step') === 'kyc';
  const fromApp = searchParams.get('from') === 'app';
  const urlLang = i18n.language === 'en' ? 'en' : 'fr';
  const isFr = i18n.language === 'fr';
  const { registerInvestor } = useWebSession();
  const { country: detectedCountry, detected } = useGeolocation();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryOfResidence: DEFAULT_INVESTOR_RESIDENCE,
    investmentTrack: 'Track A — Operations',
    commodityShea: false,
    commoditySesame: false,
    commodityBoth: false,
    investmentRange: RANGES[0],
    heardAbout: HEARD[0],
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [kycPhase, setKycPhase] = useState(false);
  const [idUploaded, setIdUploaded] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [idType, setIdType] = useState('passport');
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [pendingReturnUrl, setPendingReturnUrl] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    const stepKyc = searchParams.get('step') === 'kyc';
    if (paymentSuccess && stepKyc) {
      setSuccess(true);
      setPaymentDone(true);
    }
    if (!skipToKYC) return;
    const email = localStorage.getItem('afriyield_investor_email');
    const name = localStorage.getItem('afriyield_investor_name');
    if (email && name) {
      setForm((p) => ({ ...p, email, fullName: name }));
      setSuccess(true);
      setKycPhase(true);
    }
  }, [skipToKYC]);

  useEffect(() => {
    if (!detected || !detectedCountry) return;
    const normalized = normalizeCountry(
      legacyCountryToAppName(detectedCountry) || detectedCountry
    );
    if (!RESIDENCE.some((r) => r.toLowerCase() === String(normalized).toLowerCase())) return;
    setForm((p) => {
      if (p.countryOfResidence && p.countryOfResidence !== DEFAULT_INVESTOR_RESIDENCE) return p;
      return { ...p, countryOfResidence: normalized };
    });
  }, [detected, detectedCountry]);

  const trackOptions = useMemo(
    () => [
      {
        value: 'Track A — Operations',
        label: t('afriYield.registration.trackAOption'),
        hint: t('afriYield.registration.trackAHint'),
      },
      {
        value: 'Track B — Brand & Market',
        label: t('afriYield.registration.trackBOption'),
        hint: t('afriYield.registration.trackBHint'),
      },
      {
        value: 'Both Tracks',
        label: t('afriYield.registration.bothTracksOption'),
        hint: t('afriYield.registration.bothTracksHint'),
      },
    ],
    [t]
  );

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'commodityBoth' && checked) {
        setForm((p) => ({ ...p, commodityBoth: true, commodityShea: false, commoditySesame: false }));
        return;
      }
      if ((name === 'commodityShea' || name === 'commoditySesame') && checked) {
        setForm((p) => ({ ...p, [name]: checked, commodityBoth: false }));
        return;
      }
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const commodityInterest = () => {
    if (form.commodityBoth) return ['Both'];
    const out = [];
    if (form.commodityShea) out.push('Shea Butter');
    if (form.commoditySesame) out.push('Sesame');
    return out.length ? out : [];
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      countryOfResidence: normalizeCountry(form.countryOfResidence),
      investmentTrack: form.investmentTrack,
      commodityInterest: commodityInterest(),
      investmentRange: form.investmentRange,
      heardAbout: form.heardAbout,
      message: form.message || '',
    };

    try {
      const r = await fetch(API_ENDPOINTS.INVESTORS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || data.message || t('afriYield.registration.errorGeneric'));
        return;
      }
      localStorage.setItem('afriyield_investor_email', form.email);
      localStorage.setItem('afriyield_investor_name', form.fullName);
      setKycPhase(false);
      setKycSubmitted(false);
      setIdFile(null);
      setIdUploaded(false);
      setSuccess(true);
      registerInvestor(form.email, form.fullName);
    } catch (err) {
      setError(err.message || t('afriYield.registration.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitKyc = async () => {
    if (!idFile) return;
    setKycSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorEmail: form.email,
          investorName: form.fullName,
          countryOfResidence: normalizeCountry(form.countryOfResidence),
          idType,
          photoIdUploaded: true,
          acceptedTerms: true,
          acceptedRiskDisclosure: true,
          acceptedPrivacyPolicy: true,
          digitalSignature: form.fullName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && !data.success) {
        console.error('KYC submit error:', data.error || res.status);
      }
      setKycSubmitted(true);
      const returnUrl = localStorage.getItem('afriyield_invest_return');
      if (returnUrl) {
        setPendingReturnUrl(returnUrl);
        localStorage.removeItem('afriyield_invest_return');
        setTimeout(() => navigate(returnUrl), 1200);
      }
    } catch (e) {
      console.error('KYC submit error:', e);
      setKycSubmitted(true);
      const returnUrl = localStorage.getItem('afriyield_invest_return');
      if (returnUrl) {
        setPendingReturnUrl(returnUrl);
        localStorage.removeItem('afriyield_invest_return');
        setTimeout(() => navigate(returnUrl), 1200);
      }
    } finally {
      setKycSubmitting(false);
    }
  };

  const returnOpp = pendingReturnUrl || localStorage.getItem('afriyield_invest_return');

  const residenceLabel = (c) => {
    const key = INVESTOR_RESIDENCE_I18N_KEYS[c];
    return key ? t(`afriYield.registration.${key}`) : c;
  };
  const heardLabel = (h) => {
    const map = {
      'Diaspora community': 'heardDiaspora',
      'Social media': 'heardSocial',
      'Friend or family': 'heardFriend',
      'Event or conference': 'heardEvent',
      Other: 'heardOther',
    };
    const k = map[h];
    return k ? t(`afriYield.registration.${k}`) : h;
  };

  const idTypeLabel = (val) => {
    const labels = {
      passport: isFr ? 'passeport' : 'passport',
      national_id: isFr ? "pièce d'identité" : 'ID document',
      drivers_license: isFr ? 'permis de conduire' : "driver's license",
      residence_permit: isFr ? 'titre de séjour' : 'residence permit',
    };
    return labels[val] || (isFr ? "pièce d'identité" : 'ID document');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0b1f12' }}>
      <section
        style={{
          background: `
            radial-gradient(ellipse 140% 90% at 50% -20%,
              rgba(30,80,140,0.75) 0%,
              rgba(20,50,90,0.5) 35%,
              transparent 65%),
            radial-gradient(ellipse 70% 55% at 95% 30%,
              rgba(181,133,10,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 5% 70%,
              rgba(29,158,117,0.15) 0%, transparent 50%),
            linear-gradient(180deg, #0a1838 0%, #0b1f12 100%)
          `,
          borderBottom: '1px solid rgba(181,133,10,0.25)',
        }}
        className="py-14"
      >
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">{t('afriYield.registration.pageTitle')}</h1>
          <p className="mt-3 text-lg text-[#B5850A] font-medium">{t('afriYield.registration.subtitle')}</p>
        </div>
      </section>

      <section
        className="section-container pb-20"
        style={{
          background: `
            radial-gradient(ellipse 100% 70% at 50% 100%,
              rgba(20,55,40,0.5) 0%, transparent 55%),
            radial-gradient(ellipse 80% 50% at 0% 50%,
              rgba(20,48,96,0.35) 0%, transparent 50%)
          `,
        }}
      >
        <div
          className="max-w-2xl mx-auto rounded-2xl border p-8 glass-card-strong"
          style={CARD_STYLE}
        >
          {success && !kycPhase && !paymentDone && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-white font-bold text-xl mb-2">
                {isFr ? 'Inscription enregistrée !' : 'Registration Received!'}
              </h3>
              <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
                {isFr
                  ? "Pour accéder à AfriYield Exchange, une cotisation d'accès annuelle est requise. Elle couvre la vérification KYC et donne accès à toutes les opportunités."
                  : 'To access AfriYield Exchange, an annual access fee is required. It covers KYC verification and grants access to all opportunities.'}
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mb-6 max-w-sm mx-auto text-left">
                <p className="text-amber-400 font-bold text-base mb-3">
                  AfriYield Exchange — {isFr ? 'Accès annuel' : 'Annual Access'}
                </p>
                <ul className="space-y-2 text-xs text-white/60 mb-4">
                  <li>✓ {isFr ? 'Vérification KYC incluse' : 'KYC verification included'}</li>
                  <li>✓ {isFr ? 'Accès à toutes les opportunités Track A et B' : 'Access to all Track A and B opportunities'}</li>
                  <li>✓ {isFr ? 'Rapports de marché mensuels' : 'Monthly market reports'}</li>
                  <li>✓ {isFr ? 'Protection escrow sur tous les deals' : 'Escrow protection on all deals'}</li>
                </ul>
                <p className="text-white font-bold text-2xl text-center">$99 / {isFr ? 'an' : 'year'}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const API = import.meta.env.VITE_API_BASE_URL || '';
                    const r = await fetch(`${API}/api/payments/stripe/create-session`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'afriyield_access',
                        email: form.email,
                        name: form.fullName,
                        successUrl: `${window.location.origin}/afri-yield/register?payment=success&step=kyc&from=${fromApp ? 'app' : 'web'}&lang=${urlLang}`,
                        cancelUrl: `${window.location.href.split('?')[0]}?payment=cancelled&from=${fromApp ? 'app' : 'web'}&lang=${urlLang}`,
                      }),
                    });
                    const data = await r.json();
                    if (data.url) window.location.href = data.url;
                  } catch (e) {
                    console.error('Stripe checkout error:', e);
                  }
                }}
                className="w-full max-w-sm mx-auto block py-4 rounded-xl font-bold text-black text-sm"
                style={{ backgroundColor: '#B5850A' }}
              >
                {isFr ? '→ Payer et accéder à AfriYield' : '→ Pay and access AfriYield'} — $99
              </button>
              <p className="mt-3 text-white/30 text-xs text-center">
                {isFr
                  ? 'Paiement sécurisé via Stripe · Visa, Mastercard, Amex'
                  : 'Secure payment via Stripe · Visa, Mastercard, Amex'}
              </p>
            </div>
          )}

          {success && !kycPhase && paymentDone && (
            <div className="text-center py-8">
              <AppReturnBanner role="investor" />
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-white font-bold text-xl mb-2">
                {isFr ? 'Paiement confirmé !' : 'Payment confirmed!'}
              </h3>
              <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
                {isFr
                  ? "Votre accès est activé. Complétez maintenant la vérification KYC pour investir."
                  : 'Your access is activated. Complete KYC verification now to start investing.'}
              </p>
              <button
                type="button"
                onClick={() => setKycPhase(true)}
                className="w-full max-w-sm mx-auto block py-4 rounded-xl font-bold text-black text-sm"
                style={{ backgroundColor: '#B5850A' }}
              >
                {isFr ? '→ Compléter la vérification KYC' : '→ Complete KYC Verification'}
              </button>
            </div>
          )}

          {success && kycPhase && !kycSubmitted && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setKycPhase(false)}
                  className="text-white/50 hover:text-white text-sm"
                >
                  ← {isFr ? 'Retour' : 'Back'}
                </button>
                <h3 className="text-white font-bold text-lg">
                  🔐 {isFr ? "Vérification d'identité (KYC)" : 'Identity Verification (KYC)'}
                </h3>
              </div>

              <div>
                <label className="block text-white/70 text-xs font-medium mb-2">
                  {isFr ? "Type de pièce d'identité *" : 'ID Document Type *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['passport', isFr ? '🛂 Passeport' : '🛂 Passport'],
                    ['national_id', isFr ? '🪪 Carte nationale' : '🪪 National ID'],
                    ['drivers_license', isFr ? '🚗 Permis de conduire' : "🚗 Driver's License"],
                    ['residence_permit', isFr ? '📋 Titre de séjour' : '📋 Residence Permit'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setIdType(val)}
                      className="py-3 px-3 rounded-xl text-xs font-medium border text-left transition-all"
                      style={{
                        background: idType === val ? 'rgba(181,133,10,0.15)' : 'rgba(255,255,255,0.08)',
                        borderColor: idType === val ? 'rgba(181,133,10,0.5)' : 'rgba(255,255,255,0.1)',
                        color: idType === val ? '#B5850A' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-xs font-medium mb-2">
                  {isFr
                    ? `Photo de votre ${idTypeLabel(idType)} *`
                    : `Photo of your ${idTypeLabel(idType)} *`}
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: idFile ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)',
                    background: idFile ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.08)',
                  }}
                  onClick={() => document.getElementById('id-upload')?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') document.getElementById('id-upload')?.click();
                  }}
                >
                  <input
                    id="id-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIdFile(file);
                        setIdUploaded(true);
                      }
                    }}
                  />
                  {idFile ? (
                    <div>
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-green-400 font-semibold text-sm">{idFile.name}</p>
                      <p className="text-white/50 text-xs mt-1">
                        {isFr ? 'Cliquez pour changer' : 'Click to change'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-3">📷</div>
                      <p className="text-white font-semibold text-sm">
                        {isFr
                          ? "Cliquez pour télécharger votre pièce d'identité"
                          : 'Click to upload your ID document'}
                      </p>
                      <p className="text-white/50 text-xs mt-2">
                        {isFr
                          ? 'JPEG, PNG ou PDF · Max 10MB · Photo claire et lisible'
                          : 'JPEG, PNG or PDF · Max 10MB · Clear readable photo'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-white/60 text-xs font-semibold mb-2">
                  {isFr ? '📋 Exigences pour la photo:' : '📋 Photo requirements:'}
                </p>
                <ul className="space-y-1 text-xs text-white/50">
                  <li>
                    ✓ {isFr ? 'Photo claire, nette et bien éclairée' : 'Clear, sharp, well-lit photo'}
                  </li>
                  <li>
                    ✓{' '}
                    {isFr
                      ? 'Tous les 4 coins de la pièce visibles'
                      : 'All 4 corners of the document visible'}
                  </li>
                  <li>✓ {isFr ? 'Texte entièrement lisible' : 'Text fully readable'}</li>
                  <li>✓ {isFr ? "Pas de reflets ni d'ombres" : 'No glare or shadows'}</li>
                  <li>✓ {isFr ? 'Document valide (non expiré)' : 'Valid document (not expired)'}</li>
                </ul>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-amber-400 text-xs leading-relaxed">
                  🔒{' '}
                  {isFr
                    ? "Votre pièce d'identité est chiffrée et utilisée uniquement pour la vérification KYC conformément aux réglementations anti-blanchiment (AML/KYC). Elle ne sera jamais partagée avec des tiers."
                    : 'Your ID document is encrypted and used solely for KYC verification in compliance with anti-money laundering regulations (AML/KYC). It will never be shared with third parties.'}
                </p>
              </div>

              <button
                type="button"
                disabled={!idFile || kycSubmitting}
                onClick={submitKyc}
                className="w-full py-4 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity inline-flex items-center justify-center gap-2"
                style={{
                  backgroundColor: idFile ? '#B5850A' : '#6b7280',
                  color: idFile ? 'black' : 'white',
                }}
              >
                {kycSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                {isFr ? '✅ Soumettre la vérification KYC' : '✅ Submit KYC Verification'}
              </button>
            </div>
          )}

          {success && kycPhase && kycSubmitted && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-white font-bold text-xl mb-2">
                {isFr ? 'KYC soumis avec succès !' : 'KYC Submitted Successfully!'}
              </h3>
              <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
                {isFr
                  ? "Votre pièce d'identité a été reçue. Notre équipe de conformité examinera votre dossier et vous informera par email."
                  : 'Your ID document has been received. Our compliance team will review your file and notify you by email.'}
              </p>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-w-xs mx-auto text-left mb-6 space-y-2">
                {[
                  [isFr ? 'Statut' : 'Status', isFr ? '⏳ En cours de révision' : '⏳ Under review'],
                  [isFr ? 'Délai' : 'Timeline', isFr ? '24-48 heures ouvrables' : '24-48 business hours'],
                  [isFr ? 'Notification' : 'Notification', isFr ? 'Email de confirmation' : 'Confirmation email'],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-white/40">{l}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
              {kycSubmitted && returnOpp && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                  <p className="text-amber-400 text-xs">
                    {isFr
                      ? "↩️ Vous serez redirigé vers l'opportunité dans quelques secondes..."
                      : '↩️ You will be redirected to the opportunity in a few seconds...'}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate('/afri-yield/portal')}
                className="w-full max-w-sm mx-auto block py-4 rounded-xl font-bold text-black text-sm mb-3"
                style={{ backgroundColor: '#1D9E75' }}
              >
                {isFr ? '→ Mon portail AfriYield' : '→ My AfriYield portal'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/afri-yield/opportunities')}
                className="w-full max-w-sm mx-auto block py-3 rounded-xl font-bold text-white text-sm border border-white/20"
              >
                {isFr ? 'Voir les opportunités' : 'Browse opportunities'}
              </button>
            </div>
          )}

          {!success && (
            <form onSubmit={submit} className="space-y-6">
              {error ? (
                <div className={ERR_BOX} role="alert">
                  {error}
                </div>
              ) : null}

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.fullName')} *</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  required
                  className={INPUT_CLS}
                />
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.email')} *</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className={INPUT_CLS}
                />
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.phone')}</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className={INPUT_CLS}
                  placeholder={t('afriYield.registration.phonePlaceholder')}
                />
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.countryOfResidence')}</span>
                <select
                  name="countryOfResidence"
                  value={form.countryOfResidence}
                  onChange={onChange}
                  className={INPUT_CLS}
                  style={{ color: 'white' }}
                >
                  {RESIDENCE.map((c) => (
                    <option key={c} value={c}>
                      {residenceLabel(c)}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-3">
                <legend className={LABEL_CLS}>{t('afriYield.registration.investmentTrack')}</legend>
                {trackOptions.map((opt) => {
                  const selected = form.investmentTrack === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className="flex gap-3 rounded-lg p-4 cursor-pointer transition-all"
                      style={{
                        ...TRACK_CARD_BASE,
                        ...(selected
                          ? {
                              background: 'rgba(181,133,10,0.15)',
                              border: '1px solid rgba(181,133,10,0.5)',
                            }
                          : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="investmentTrack"
                        value={opt.value}
                        checked={selected}
                        onChange={onChange}
                        className="mt-1 accent-[#B5850A]"
                      />
                      <span>
                        <span className="font-semibold text-white">{opt.label}</span>
                        <span className="block text-sm text-white/60">{opt.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <div>
                <p className={`${LABEL_CLS} mb-2`}>{t('afriYield.registration.commodityInterest')}</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    ['commodityShea', 'commodityShea', 'afriYield.sheaButter'],
                    ['commoditySesame', 'commoditySesame', 'afriYield.sesame'],
                    ['commodityBoth', 'commodityBoth', 'afriYield.registration.bothCommodities'],
                  ].map(([name, key, labelKey]) => (
                    <label key={name} className="inline-flex items-center gap-2 text-white/80">
                      <input
                        type="checkbox"
                        name={name}
                        checked={form[key]}
                        onChange={onChange}
                        className="rounded accent-[#B5850A]"
                      />
                      <span>{t(labelKey)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.investmentRange')}</span>
                <select
                  name="investmentRange"
                  value={form.investmentRange}
                  onChange={onChange}
                  className={INPUT_CLS}
                  style={{ color: 'white' }}
                >
                  {RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.heardAbout')}</span>
                <select
                  name="heardAbout"
                  value={form.heardAbout}
                  onChange={onChange}
                  className={INPUT_CLS}
                  style={{ color: 'white' }}
                >
                  {HEARD.map((h) => (
                    <option key={h} value={h}>
                      {heardLabel(h)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('afriYield.registration.messageOptional')}</span>
                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={onChange}
                  className={`${INPUT_CLS} resize-none`}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl py-4 font-bold hover:opacity-90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                style={{ background: '#B5850A', color: 'black' }}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                {t('afriYield.registration.submit')}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
