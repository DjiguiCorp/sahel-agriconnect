import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import LocationSelector from '../components/LocationSelector';

const API = API_BASE_URL.replace(/\/$/, '');
const TOTAL_STEPS = 4;

const CROP_LABELS = {
  shea: 'Shea Butter',
  sesame: 'Sesame',
  cashew: 'Cashew',
  millet: 'Millet',
  cotton: 'Cotton',
  rice: 'Rice',
  sorghum: 'Sorghum',
  other: 'Other',
};

function buildObjectifsProduction(form) {
  const goals = [];
  if (
    form.exportGoals &&
    form.targetMarkets.some((m) => ['europe', 'usa', 'asia'].includes(m))
  ) {
    goals.push('Export international');
  } else if (form.exportGoals || form.lookingForBuyers) {
    goals.push('Export régional');
  } else {
    goals.push('Souveraineté alimentaire locale');
  }
  return goals;
}

export default function ProducerProRegistration() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState({ country: '', region: '' });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    farmSizeHectares: '',
    primaryCrops: [],
    yearsExperience: '',
    hasIrrigation: false,
    certificationStatus: 'none',
    cooperativeMember: false,
    cooperativeName: '',
    exportGoals: false,
    targetMarkets: [],
    annualProductionKg: '',
    storageCapacity: false,
    lookingForBuyers: false,
    lookingForFinancing: false,
    billing: 'monthly',
    acceptTerms: false,
  });

  const set = (field, value) =>
    setForm((p) => ({ ...p, [field]: value }));

  const toggleArr = (field, val) => {
    setForm((p) => {
      const arr = p[field] || [];
      return {
        ...p,
        [field]: arr.includes(val)
          ? arr.filter((x) => x !== val)
          : [...arr, val],
      };
    });
  };

  const validate = () => {
    if (step === 1 && (!form.fullName || !form.email || !form.phone || !location.country)) {
      setError(
        isFr
          ? 'Nom, email, téléphone et pays sont requis'
          : 'Name, email, phone and country are required'
      );
      return false;
    }
    if (step === 2 && !form.farmSizeHectares) {
      setError(
        isFr
          ? "Taille de l'exploitation requise"
          : 'Farm size is required'
      );
      return false;
    }
    if (step === 4 && !form.acceptTerms) {
      setError(
        isFr
          ? 'Vous devez accepter les conditions'
          : 'You must accept the terms'
      );
      return false;
    }
    setError('');
    return true;
  };

  const next = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const back = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const buildFarmerPayload = () => {
    const cultures =
      form.primaryCrops.length > 0
        ? form.primaryCrops.map((c) => CROP_LABELS[c] || c)
        : ['Other'];

    return {
      nom: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      telephone: form.phone.replace(/\s+/g, ' ').trim(),
      region: location.region.trim() || 'Unknown',
      country: location.country,
      superficie: Number(form.farmSizeHectares) || 0,
      cultures,
      latitude: '0',
      longitude: '0',
      typeExploitation: 'Commerciale/Indépendante',
      lienCooperative: form.cooperativeMember ? 'Oui' : 'Non',
      nomCooperative: form.cooperativeMember ? form.cooperativeName.trim() : '',
      objectifsProduction: buildObjectifsProduction(form),
      accesElectricite: 'Non',
      accesStockage: form.storageCapacity ? 'Oui' : 'Non',
      irrigation: form.hasIrrigation ? 'Oui' : 'Non',
      producerProMeta: {
        tier: 'producer_pro',
        yearsExperience: form.yearsExperience,
        certificationStatus: form.certificationStatus,
        exportGoals: form.exportGoals,
        targetMarkets: form.targetMarkets,
        annualProductionKg: form.annualProductionKg,
        lookingForBuyers: form.lookingForBuyers,
        lookingForFinancing: form.lookingForFinancing,
        billing: form.billing,
      },
    };
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      const regRes = await fetch(`${API}/api/farmers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildFarmerPayload()),
      });
      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok) {
        const msg =
          regData?.error ||
          regData?.details?.join?.(', ') ||
          regData?.details ||
          'Registration failed';
        throw new Error(typeof msg === 'string' ? msg : 'Registration failed');
      }

      const stripeRes = await fetch(`${API}/api/payments/stripe/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          tierKey: 'producer_pro',
          tierName: 'Producer Pro',
          amountUsd: form.billing === 'annual' ? 299 : 29.99,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });
      const stripeData = await stripeRes.json().catch(() => ({}));
      if (!stripeRes.ok) {
        throw new Error(stripeData?.error || 'Payment session failed');
      }

      if (stripeData.url) {
        window.location.href = stripeData.url;
        return;
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const CROPS = [
    ['shea', isFr ? 'Karité' : 'Shea Butter'],
    ['sesame', 'Sesame'],
    ['cashew', isFr ? 'Cajou' : 'Cashew'],
    ['millet', isFr ? 'Mil' : 'Millet'],
    ['cotton', isFr ? 'Coton' : 'Cotton'],
    ['rice', isFr ? 'Riz' : 'Rice'],
    ['sorghum', isFr ? 'Sorgho' : 'Sorghum'],
    ['other', isFr ? 'Autre' : 'Other'],
  ];

  const MARKETS = [
    ['europe', isFr ? 'Europe' : 'Europe'],
    ['usa', 'USA'],
    ['asia', isFr ? 'Asie' : 'Asia'],
    ['africa', isFr ? 'Afrique régionale' : 'Regional Africa'],
    ['local', isFr ? 'Marché local' : 'Local market'],
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-[#060f0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isFr ? 'Bienvenue dans Producer Pro!' : 'Welcome to Producer Pro!'}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {isFr
              ? 'Votre inscription a été reçue. Notre équipe vous contactera pour activer votre compte.'
              : 'Your registration was received. Our team will contact you to activate your account.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl font-bold text-black"
            style={{ backgroundColor: '#B5850A' }}
          >
            {isFr ? 'Aller au tableau de bord' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060f0a] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm font-semibold mb-3">
            ⭐ {isFr ? 'Inscription Producer Pro' : 'Producer Pro Registration'}
          </span>
          <h1 className="text-2xl font-bold text-white">
            {isFr
              ? 'Maximisez votre potentiel agricole'
              : 'Maximize Your Agricultural Potential'}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {isFr
              ? `$29.99/mois · Étape ${step} sur ${TOTAL_STEPS}`
              : `$29.99/month · Step ${step} of ${TOTAL_STEPS}`}
          </p>
        </div>

        <div className="flex items-center gap-1 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step > i + 1
                    ? 'bg-green-500 text-white'
                    : step === i + 1
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {step > i + 1 ? '✓' : i + 1}
              </div>
              {i < TOTAL_STEPS - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    step > i + 1 ? 'bg-green-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          {step === 1 && (
            <>
              <h3 className="text-white font-bold">
                👤 {isFr ? 'Informations personnelles' : 'Personal Information'}
              </h3>
              {[
                ['fullName', isFr ? 'Nom complet *' : 'Full Name *', isFr ? 'Prénom et nom' : 'First and last name', 'text'],
                ['email', isFr ? 'Email *' : 'Email *', 'your@email.com', 'email'],
                ['phone', isFr ? 'Téléphone *' : 'Phone *', '+223...', 'tel'],
              ].map(([field, label, placeholder, type]) => (
                <div key={field}>
                  <label className="block text-white/60 text-xs font-medium mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field]}
                    placeholder={placeholder}
                    onChange={(e) => set(field, e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/30"
                  />
                </div>
              ))}
              <LocationSelector
                value={location}
                onChange={setLocation}
                required={true}
                showDetectedBanner={true}
                className="[&_label]:text-white/60 [&_select]:bg-black/30 [&_select]:border-white/15 [&_select]:text-white [&_select]:rounded-lg"
              />
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-white font-bold">
                🌾 {isFr ? 'Profil de votre exploitation' : 'Your Farm Profile'}
              </h3>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  {isFr ? 'Surface cultivée (hectares) *' : 'Cultivated area (hectares) *'}
                </label>
                <input
                  type="number"
                  value={form.farmSizeHectares}
                  placeholder={isFr ? 'Ex: 5' : 'e.g. 5'}
                  onChange={(e) => set('farmSizeHectares', e.target.value)}
                  className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/30"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-2">
                  {isFr ? 'Cultures principales' : 'Primary Crops'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CROPS.map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleArr('primaryCrops', val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.primaryCrops.includes(val)
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-transparent text-white/60 border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  {isFr ? "Années d'expérience" : 'Years of experience'}
                </label>
                <select
                  value={form.yearsExperience}
                  onChange={(e) => set('yearsExperience', e.target.value)}
                  className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  {[
                    ['0-2', isFr ? 'Moins de 2 ans' : 'Less than 2 years'],
                    ['2-5', isFr ? '2 à 5 ans' : '2 to 5 years'],
                    ['5-10', isFr ? '5 à 10 ans' : '5 to 10 years'],
                    ['10+', isFr ? 'Plus de 10 ans' : 'More than 10 years'],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  {isFr ? 'Certification actuelle' : 'Current certification'}
                </label>
                <select
                  value={form.certificationStatus}
                  onChange={(e) => set('certificationStatus', e.target.value)}
                  className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60"
                >
                  <option value="none">{isFr ? 'Aucune' : 'None'}</option>
                  <option value="local">{isFr ? 'Locale' : 'Local'}</option>
                  <option value="regional">{isFr ? 'Régionale' : 'Regional'}</option>
                  <option value="international">International</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasIrrigation}
                  onChange={(e) => set('hasIrrigation', e.target.checked)}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-white/70 text-sm">
                  {isFr ? "J'ai un système d'irrigation" : 'I have an irrigation system'}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cooperativeMember}
                  onChange={(e) => set('cooperativeMember', e.target.checked)}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-white/70 text-sm">
                  {isFr ? "Je suis membre d'une coopérative" : 'I am a cooperative member'}
                </span>
              </label>
              {form.cooperativeMember && (
                <input
                  type="text"
                  value={form.cooperativeName}
                  placeholder={isFr ? 'Nom de la coopérative' : 'Cooperative name'}
                  onChange={(e) => set('cooperativeName', e.target.value)}
                  className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/30"
                />
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-white font-bold">
                🎯 {isFr ? 'Vos objectifs Producer Pro' : 'Your Producer Pro Goals'}
              </h3>
              <p className="text-white/50 text-xs">
                {isFr
                  ? 'Ces informations nous permettent de personnaliser votre expérience.'
                  : 'This helps us personalize your experience.'}
              </p>
              {[
                ['exportGoals', isFr ? "J'ai des objectifs d'exportation" : 'I have export goals'],
                ['lookingForBuyers', isFr ? 'Je cherche des acheteurs directs' : 'I am looking for direct buyers'],
                [
                  'lookingForFinancing',
                  isFr ? 'Je cherche du financement agricole' : 'I am looking for agricultural financing',
                ],
                ['storageCapacity', isFr ? "J'ai une capacité de stockage" : 'I have storage capacity'],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form[field]}
                    onChange={(e) => set(field, e.target.checked)}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span className="text-white/80 text-sm">{label}</span>
                </label>
              ))}

              {form.exportGoals && (
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2">
                    {isFr ? 'Marchés cibles' : 'Target Markets'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MARKETS.map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => toggleArr('targetMarkets', val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.targetMarkets.includes(val)
                            ? 'bg-amber-500 text-black border-amber-500'
                            : 'bg-transparent text-white/60 border-white/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  {isFr ? 'Production annuelle estimée (kg)' : 'Estimated annual production (kg)'}
                </label>
                <input
                  type="number"
                  value={form.annualProductionKg}
                  placeholder={isFr ? 'Ex: 5000' : 'e.g. 5000'}
                  onChange={(e) => set('annualProductionKg', e.target.value)}
                  className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/30"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-white font-bold">
                💳 {isFr ? 'Choisissez votre plan' : 'Choose Your Plan'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: 'monthly',
                    price: '$29.99',
                    period: isFr ? '/mois' : '/month',
                    label: isFr ? 'Mensuel' : 'Monthly',
                    sub: isFr ? 'Annulable à tout moment' : 'Cancel anytime',
                  },
                  {
                    id: 'annual',
                    price: '$299',
                    period: isFr ? '/an' : '/year',
                    label: isFr ? 'Annuel' : 'Annual',
                    sub: isFr ? 'Économisez ~$60/an' : 'Save ~$60/year',
                    badge: isFr ? 'Meilleure valeur' : 'Best value',
                  },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => set('billing', b.id)}
                    className={`p-4 rounded-xl border text-left relative transition-all ${
                      form.billing === b.id
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {b.badge && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        {b.badge}
                      </span>
                    )}
                    <p className="text-amber-400 font-bold text-xl">
                      {b.price}
                      <span className="text-sm font-normal">{b.period}</span>
                    </p>
                    <p className="text-white font-semibold text-sm mt-1">{b.label}</p>
                    <p className="text-white/40 text-xs">{b.sub}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-white/60 text-xs font-semibold mb-2">
                  {isFr ? '💳 Méthodes de paiement acceptées:' : '💳 Accepted payment methods:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay', 'Orange Money', 'Wave', 'Zelle'].map(
                    (m) => (
                      <span key={m} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-md">
                        {m}
                      </span>
                    )
                  )}
                </div>
                <p className="text-white/30 text-xs mt-2">
                  🔒{' '}
                  {isFr
                    ? 'Paiement sécurisé · Données bancaires jamais stockées'
                    : 'Secure payment · Card data never stored'}
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(e) => set('acceptTerms', e.target.checked)}
                  className="mt-0.5 accent-amber-500 w-4 h-4"
                />
                <span className="text-white/60 text-xs leading-relaxed">
                  {isFr
                    ? "J'accepte les conditions d'utilisation et la politique de confidentialité de Sahel AgriConnect."
                    : 'I accept the Sahel AgriConnect Terms of Service and Privacy Policy.'}
                </span>
              </label>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                onClick={back}
                type="button"
                className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 text-sm font-medium"
              >
                ← {isFr ? 'Retour' : 'Back'}
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                type="button"
                className="flex-1 py-3 rounded-xl font-bold text-black text-sm"
                style={{ backgroundColor: '#B5850A' }}
              >
                {isFr ? 'Continuer →' : 'Continue →'}
              </button>
            ) : (
              <button
                onClick={submit}
                type="button"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#B5850A' }}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    {isFr ? 'Traitement...' : 'Processing...'}
                  </>
                ) : (
                  `💳 ${isFr ? 'Procéder au paiement' : 'Proceed to Payment'}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
