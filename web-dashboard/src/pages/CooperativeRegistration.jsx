import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Users, Tractor, BadgeCheck, BriefcaseBusiness, Globe, Loader2, Check } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import LocationSelector from '../components/LocationSelector';

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
  const { registerUser } = useRegisteredUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cooperativeName: '',
    country: 'Sénégal',
    regionCity: '',
    memberCount: '',
    primaryCrops: [],
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
    setState((s) => ({ ...s, loading: true, ok: false, err: '' }));
    try {
      const r = await fetch(API_ENDPOINTS.COOPERATIVES.REGISTER_PLATFORM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, memberCount: Number(form.memberCount || 0) }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || 'Request failed');
      }
      setState({ loading: false, ok: true, err: '' });
      registerUser(form.email, form.leaderName);
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        ok: false,
        err: err.message || t('cooperativeReg.form.error'),
      }));
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

      {/* Benefits — keep exactly as is, only show on step 1 */}
      {step === 1 && (
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
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#1a3c2e] mb-3">
                {i18n.language === 'fr' ? 'Inscription reçue !' : 'Registration received!'}
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('cooperativeReg.form.success')}</p>
              {/* What happens next */}
              <div className="text-left bg-[#F5F0E8] rounded-2xl p-6 mb-6">
                <p className="font-bold text-[#1a3c2e] mb-4">
                  {i18n.language === 'fr' ? '📋 Ce qui se passe ensuite :' : '📋 What happens next:'}
                </p>
                <div className="space-y-3">
                  {[
                    {
                      icon: '1️⃣',
                      text:
                        i18n.language === 'fr'
                          ? 'Notre équipe examine votre dossier dans les 48 heures'
                          : 'Our team reviews your application within 48 hours',
                    },
                    {
                      icon: '2️⃣',
                      text:
                        i18n.language === 'fr'
                          ? 'Vous recevez un email de confirmation avec les prochaines étapes'
                          : 'You receive a confirmation email with next steps',
                    },
                    {
                      icon: '3️⃣',
                      text:
                        i18n.language === 'fr'
                          ? 'Votre coopérative est activée et visible sur la plateforme'
                          : 'Your cooperative is activated and visible on the platform',
                    },
                    {
                      icon: '4️⃣',
                      text:
                        i18n.language === 'fr'
                          ? 'Accédez aux outils de gestion, certifications et investisseurs diaspora'
                          : 'Access management tools, certifications, and diaspora investors',
                    },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="text-lg flex-shrink-0">{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/my-dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: '#1a3c2e' }}
                >
                  {i18n.language === 'fr' ? 'Accéder à mon tableau de bord' : 'Go to my dashboard'}
                </a>
                <a
                  href="/afri-yield"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
                >
                  {i18n.language === 'fr' ? 'Découvrir AfriYield Exchange' : 'Discover AfriYield Exchange'}
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-6">
                {i18n.language === 'fr'
                  ? 'Pour supprimer votre compte, contactez-nous à info@djiguicorporation.org'
                  : 'To delete your account, contact us at info@djiguicorporation.org'}
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
