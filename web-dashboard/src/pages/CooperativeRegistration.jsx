import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Users, Tractor, BadgeCheck, BriefcaseBusiness, Globe, Loader2, Check } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import LocationSelector from '../components/LocationSelector';
import OtherInput from '../components/OtherInput';

const BENEFIT_KEYS = ['recruitment', 'equipment', 'certification', 'investor', 'export'];
const BENEFIT_ICONS = [Users, Tractor, BadgeCheck, BriefcaseBusiness, Globe];
const CERT_KEYS = ['none', 'local', 'regional', 'international'];
const CERT_VALUES = ['None', 'Local', 'Regional', 'International'];
const CROP_KEYS = ['shea', 'sesame', 'cashew', 'mango', 'rice', 'cotton', 'millet', 'sorghum', 'other'];
const CROP_VALUES = [
  'Shea Butter',
  'Sesame',
  'Cashew',
  'Mango',
  'Rice',
  'Cotton',
  'Millet',
  'Sorghum',
  'Other',
];
const INTEREST_KEYS = ['equipment', 'certification', 'diaspora', 'export'];
const INTEREST_VALUES = ['Equipment Fund', 'Certification', 'Diaspora Investment', 'Export Program'];

const TOTAL_STEPS = 3;

export default function CooperativeRegistration() {
  const { t, i18n } = useTranslation();
  const { registerCooperative } = useRegisteredUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cooperativeName: '',
    country: 'Sénégal',
    regionCity: '',
    memberCount: '',
    primaryCrops: [],
    autresCrops: '',
    certificationStatus: 'None',
    leaderName: '',
    email: '',
    phone: '',
    interests: [],
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const toggleArrayItem = (key, value) => {
    setForm((p) => {
      const set = new Set(p[key] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...p, [key]: Array.from(set) };
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(API_ENDPOINTS.COOPERATIVES.REGISTER_PLATFORM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          memberCount: Number(form.memberCount || 0),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || 'Request failed');
      }
      if (form.email && form.leaderName) {
        // Store as cooperative with pending_payment — NOT as farmer
        registerCooperative(form.email, form.leaderName);
      }
      setState({ loading: false, ok: true, err: '' });
    } catch (err) {
      setState({ loading: false, ok: false, err: err.message || 'Error' });
    }
  };

  return (
    <div>
      {/* Hero — keep exactly as is */}
      <section className="bg-gradient-to-br from-[#1a3c2e] via-[#1a3c2e] to-[#143326] text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('cooperativeReg.hero.title')}
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            {t('cooperativeReg.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Benefits — only before success, step 1 */}
      {!state.ok && step === 1 && (
        <section className="section-container py-12 md:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFIT_KEYS.map((key, i) => {
              const Icon = BENEFIT_ICONS[i];
              return (
                <div key={key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a3c2e]">
                    {t(`cooperativeReg.benefits.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-gray-600 text-sm">{t(`cooperativeReg.benefits.${key}.text`)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Multi-step form */}
      <section className="section-container pt-0 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          {!state.ok && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#1a3c2e]">
                  {i18n.language === 'fr'
                    ? `Étape ${step} sur ${TOTAL_STEPS}`
                    : `Step ${step} of ${TOTAL_STEPS}`}
                </span>
                <span className="text-sm text-gray-400">
                  {step === 1
                    ? i18n.language === 'fr'
                      ? 'Informations de base'
                      : 'Basic Information'
                    : step === 2
                      ? i18n.language === 'fr'
                        ? 'Votre coopérative'
                        : 'Your Cooperative'
                      : i18n.language === 'fr'
                        ? 'Programmes & Envoi'
                        : 'Programs & Submit'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(step / TOTAL_STEPS) * 100}%`,
                    background: 'linear-gradient(90deg, #1a3c2e, #B5850A)',
                  }}
                />
              </div>
              {/* Step dots */}
              <div className="flex justify-between mt-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      s < step
                        ? 'bg-[#1a3c2e] text-white'
                        : s === step
                          ? 'bg-[#B5850A] text-white'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {state.ok ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 md:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⏳</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1a3c2e] mb-3">
                {i18n.language === 'fr'
                  ? 'Demande reçue — En attente de paiement'
                  : 'Application received — Awaiting payment'}
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                {i18n.language === 'fr'
                  ? 'Votre coopérative est enregistrée. Notre équipe vous contactera dans les 48 heures avec les instructions de paiement. Votre portail sera activé après confirmation du paiement de 199$/an.'
                  : 'Your cooperative is registered. Our team will contact you within 48 hours with payment instructions. Your portal will be activated after payment confirmation of $199/year.'}
              </p>

              <div className="text-left bg-[#F5F0E8] rounded-2xl p-5 mb-6 border border-[#B5850A]/20">
                <p className="font-bold text-[#1a3c2e] mb-4 text-sm">
                  {i18n.language === 'fr' ? '📋 Prochaines étapes :' : '📋 Next steps:'}
                </p>
                <div className="space-y-3">
                  {[
                    {
                      icon: '1️⃣',
                      title: i18n.language === 'fr' ? 'Email de confirmation' : 'Confirmation email',
                      desc:
                        i18n.language === 'fr'
                          ? 'Vous recevez un email avec les instructions de paiement'
                          : 'You receive an email with payment instructions',
                    },
                    {
                      icon: '2️⃣',
                      title: i18n.language === 'fr' ? 'Paiement — 199$/an' : 'Payment — $199/year',
                      desc:
                        i18n.language === 'fr'
                          ? 'Virement bancaire, Mobile Money ou Western Union'
                          : 'Bank transfer, Mobile Money, or Western Union',
                    },
                    {
                      icon: '3️⃣',
                      title: i18n.language === 'fr' ? 'Activation du portail' : 'Portal activation',
                      desc:
                        i18n.language === 'fr'
                          ? 'Notre équipe active votre portail coopérative dans les 24h après réception'
                          : 'Our team activates your cooperative portal within 24h of receipt',
                    },
                    {
                      icon: '4️⃣',
                      title: i18n.language === 'fr' ? 'Accès complet' : 'Full access',
                      desc:
                        i18n.language === 'fr'
                          ? 'Gestion des membres, certifications, connexion AfriYield'
                          : 'Member management, certifications, AfriYield connection',
                    },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{icon}</span>
                      <div>
                        <p className="font-semibold text-[#1a3c2e] text-sm">{title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-left">
                <p className="font-semibold text-[#1a3c2e] text-sm mb-2">
                  💳 {i18n.language === 'fr' ? 'Méthodes de paiement acceptées :' : 'Accepted payment methods:'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {['Mobile Money (Orange, Wave, MTN)', 'Virement bancaire', 'Western Union', 'MoneyGram'].map(
                    (m) => (
                      <span key={m} className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                        {m}
                      </span>
                    )
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {i18n.language === 'fr' ? 'Contactez-nous pour les détails de paiement : ' : 'Contact us for payment details: '}
                  <a href="mailto:info@djiguicorporation.org" className="text-[#1a3c2e] font-semibold hover:underline">
                    info@djiguicorporation.org
                  </a>
                </p>
              </div>

              <a
                href="mailto:info@djiguicorporation.org?subject=Paiement adhésion coopérative — Sahel AgriConnect"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: '#B5850A' }}
              >
                📧 {i18n.language === 'fr' ? 'Contacter pour payer' : 'Contact to pay'}
              </a>

              <p className="text-xs text-gray-400 mt-4">
                {i18n.language === 'fr'
                  ? "Votre portail reste inactif jusqu'à réception du paiement. Aucune donnée n'est perdue."
                  : 'Your portal remains inactive until payment is received. No data is lost.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 md:p-8">
              {/* STEP 1 — Basic Information */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1a3c2e]">
                      {i18n.language === 'fr' ? 'Informations de base' : 'Basic Information'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {i18n.language === 'fr'
                        ? 'Commençons par vous identifier.'
                        : "Let's start by identifying you."}
                    </p>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      {t('cooperativeReg.form.cooperativeName')} *
                    </span>
                    <input
                      name="cooperativeName"
                      value={form.cooperativeName}
                      onChange={onChange}
                      required
                      placeholder={
                        i18n.language === 'fr'
                          ? 'Ex: Coopérative Karité du Sahel'
                          : 'Ex: Sahel Shea Cooperative'
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none text-sm"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      {t('cooperativeReg.form.leaderName')} *
                    </span>
                    <input
                      name="leaderName"
                      value={form.leaderName}
                      onChange={onChange}
                      required
                      placeholder={i18n.language === 'fr' ? 'Votre nom complet' : 'Your full name'}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none text-sm"
                    />
                  </label>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        {t('cooperativeReg.form.email')} *
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        required
                        placeholder="votre@email.com"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none text-sm"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        {t('cooperativeReg.form.phone')}
                        <span className="text-gray-400 font-normal ml-1">(WhatsApp)</span>
                      </span>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={onChange}
                        placeholder="+223 76 12 34 56"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none text-sm"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!form.cooperativeName || !form.leaderName || !form.email) {
                        setState((s) => ({
                          ...s,
                          err:
                            i18n.language === 'fr'
                              ? 'Veuillez remplir tous les champs obligatoires.'
                              : 'Please fill all required fields.',
                        }));
                        return;
                      }
                      setState((s) => ({ ...s, err: '' }));
                      setStep(2);
                    }}
                    className="w-full rounded-xl bg-[#1a3c2e] text-white font-bold py-3.5 hover:bg-[#143326] transition text-sm"
                  >
                    {i18n.language === 'fr' ? 'Continuer →' : 'Continue →'}
                  </button>

                  {state.err && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                      {state.err}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 2 — Cooperative Details */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1a3c2e]">
                      {i18n.language === 'fr' ? 'Votre coopérative' : 'Your Cooperative'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {i18n.language === 'fr'
                        ? 'Parlez-nous de votre structure et de vos productions.'
                        : 'Tell us about your structure and productions.'}
                    </p>
                  </div>

                  <LocationSelector
                    value={{ country: form.country, region: form.regionCity }}
                    onChange={({ country, region }) =>
                      setForm((p) => ({ ...p, country, regionCity: region }))
                    }
                    required
                    showDetectedBanner={true}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        {t('cooperativeReg.form.memberCount')} *
                      </span>
                      <input
                        type="number"
                        min="0"
                        name="memberCount"
                        value={form.memberCount}
                        onChange={onChange}
                        required
                        placeholder="Ex: 45"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none text-sm"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        {t('cooperativeReg.form.certificationStatus')}
                      </span>
                      <select
                        name="certificationStatus"
                        value={form.certificationStatus}
                        onChange={onChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white text-sm"
                      >
                        {CERT_KEYS.map((k, i) => (
                          <option key={k} value={CERT_VALUES[i]}>
                            {t(`cooperativeReg.form.certStatuses.${k}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      {t('cooperativeReg.form.primaryCrops')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {CROP_KEYS.map((k, i) => {
                        const on = form.primaryCrops.includes(CROP_VALUES[i]);
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleArrayItem('primaryCrops', CROP_VALUES[i])}
                            className={`text-sm rounded-xl border px-3 py-2.5 text-center font-medium transition ${
                              on
                                ? 'bg-[#1a3c2e] border-[#1a3c2e] text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#B5850A]/50'
                            }`}
                          >
                            {t(`cooperativeReg.form.crops.${k}`)}
                          </button>
                        );
                      })}
                    </div>
                    {form.primaryCrops.includes('Other') && (
                      <OtherInput
                        value={form.autresCrops}
                        onChange={(val) => setForm((p) => ({ ...p, autresCrops: val }))}
                        placeholder={
                          i18n.language === 'fr'
                            ? 'Ex: Fonio, Niébé, Moringa...'
                            : 'Ex: Fonio, Cowpea, Moringa...'
                        }
                      />
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold py-3 hover:bg-gray-50 transition text-sm"
                    >
                      ← {i18n.language === 'fr' ? 'Retour' : 'Back'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!form.memberCount) {
                          setState((s) => ({
                            ...s,
                            err:
                              i18n.language === 'fr'
                                ? 'Le nombre de membres est requis.'
                                : 'Member count is required.',
                          }));
                          return;
                        }
                        setState((s) => ({ ...s, err: '' }));
                        setStep(3);
                      }}
                      className="flex-1 rounded-xl bg-[#1a3c2e] text-white font-bold py-3 hover:bg-[#143326] transition text-sm"
                    >
                      {i18n.language === 'fr' ? 'Continuer →' : 'Continue →'}
                    </button>
                  </div>

                  {state.err && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                      {state.err}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 3 — Programs + Summary + Submit */}
              {step === 3 && (
                <form onSubmit={submit} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1a3c2e]">
                      {i18n.language === 'fr' ? "Programmes d'intérêt" : 'Programs of Interest'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {i18n.language === 'fr'
                        ? 'Quels programmes souhaitez-vous activer pour votre coopérative ?'
                        : 'Which programs would you like to activate for your cooperative?'}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {INTEREST_KEYS.map((k, i) => {
                      const active = form.interests.includes(INTEREST_VALUES[i]);
                      const icons = ['🔧', '⭐', '💰', '🌍'];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleArrayItem('interests', INTEREST_VALUES[i])}
                          className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition ${
                            active
                              ? 'border-[#1a3c2e] bg-[#1a3c2e]/5'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl flex-shrink-0">{icons[i]}</span>
                          <div>
                            <p
                              className={`font-semibold text-sm ${active ? 'text-[#1a3c2e]' : 'text-gray-700'}`}
                            >
                              {t(`cooperativeReg.form.interestOptions.${k}`)}
                            </p>
                            {active && (
                              <p className="text-xs text-green-600 mt-0.5">
                                ✓ {i18n.language === 'fr' ? 'Sélectionné' : 'Selected'}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary card */}
                  <div className="bg-[#F5F0E8] rounded-2xl p-5 border border-[#B5850A]/20">
                    <p className="font-bold text-[#1a3c2e] mb-3 text-sm">
                      {i18n.language === 'fr'
                        ? '📋 Résumé de votre inscription :'
                        : '📋 Your registration summary:'}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                      <p>
                        <span className="text-gray-400">Coopérative:</span>{' '}
                        <strong>{form.cooperativeName}</strong>
                      </p>
                      <p>
                        <span className="text-gray-400">
                          {i18n.language === 'fr' ? 'Responsable:' : 'Leader:'}
                        </span>{' '}
                        <strong>{form.leaderName}</strong>
                      </p>
                      <p>
                        <span className="text-gray-400">
                          {i18n.language === 'fr' ? 'Pays:' : 'Country:'}
                        </span>{' '}
                        <strong>{form.country}</strong>
                      </p>
                      <p>
                        <span className="text-gray-400">
                          {i18n.language === 'fr' ? 'Membres:' : 'Members:'}
                        </span>{' '}
                        <strong>{form.memberCount}</strong>
                      </p>
                      {form.primaryCrops.length > 0 && (
                        <p className="sm:col-span-2">
                          <span className="text-gray-400">
                            {i18n.language === 'fr' ? 'Cultures:' : 'Crops:'}
                          </span>{' '}
                          <strong>{form.primaryCrops.join(', ')}</strong>
                          {form.primaryCrops.includes('Other') && form.autresCrops && (
                            <span className="text-[#B5850A] italic">
                              {' '}
                              (+ {form.autresCrops})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    {/* Pricing reminder */}
                    <div className="mt-3 pt-3 border-t border-[#B5850A]/20 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {i18n.language === 'fr' ? 'Adhésion coopérative:' : 'Cooperative membership:'}
                      </span>
                      <span className="font-bold text-[#1a3c2e]">{t('cooperativeReg.plan.price')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {i18n.language === 'fr'
                        ? 'Aucun paiement requis maintenant — notre équipe vous contactera pour finaliser.'
                        : 'No payment required now — our team will contact you to finalize.'}
                    </p>
                  </div>

                  {state.err && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                      {state.err}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold py-3 hover:bg-gray-50 transition text-sm"
                    >
                      ← {i18n.language === 'fr' ? 'Retour' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={state.loading}
                      className="flex-1 rounded-xl bg-[#B5850A] text-[#1a3c2e] font-bold py-3.5 hover:bg-[#9a7109] transition disabled:opacity-60 inline-flex items-center justify-center gap-2 text-sm"
                    >
                      {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                      {state.loading
                        ? i18n.language === 'fr'
                          ? 'Envoi...'
                          : 'Sending...'
                        : t('cooperativeReg.form.submit')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
