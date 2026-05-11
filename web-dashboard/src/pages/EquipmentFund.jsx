import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { HandCoins, Loader2, Check, ArrowRight } from 'lucide-react';
import LocationSelector from '../components/LocationSelector';
import OtherInput from '../components/OtherInput';
import { useGeolocation } from '../hooks/useGeolocation';

const EQUIPMENT_KEYS = [
  'Tractors',
  'Irrigation',
  'Harvesting',
  'Drying & Storage',
  'Processing Machinery',
  'Transport',
  'Other',
];
const EQUIPMENT_ICONS = ['🚜', '💧', '🌾', '🏠', '⚙️', '🚛', '✏️'];

const HOW_STEPS = ['step1', 'step2', 'step3', 'step4'];
const HOW_ICONS = ['📋', '💰', '🚜', '📈'];

export default function EquipmentFund() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const { country: detectedCountry, region: detectedRegion } = useGeolocation();

  const [form, setForm] = useState({
    cooperativeName: '',
    country: detectedCountry || '',
    region: detectedRegion || '',
    equipmentNeeded: [],
    estimatedValue: '',
    farmersBenefiting: '',
    email: '',
    phone: '',
    urgencyLevel: 'medium',
    additionalNeeds: '',
    autresEquipement: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const toggleEquipment = (c) => {
    setForm((p) => {
      const set = new Set(p.equipmentNeeded);
      if (set.has(c)) set.delete(c);
      else set.add(c);
      return { ...p, equipmentNeeded: Array.from(set) };
    });
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const needsOtherDetail =
      form.equipmentNeeded.includes('Autres') ||
      form.equipmentNeeded.includes('Other');
    if (needsOtherDetail && !form.autresEquipement.trim()) {
      setState({
        loading: false,
        ok: false,
        err: isFr ? "Précisez l'équipement (Autre)." : 'Please specify other equipment.',
      });
      return;
    }
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(API_ENDPOINTS.EQUIPMENT_FUND.APPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cooperativeName: form.cooperativeName,
          country: form.country,
          region: form.region,
          equipmentNeeded: form.equipmentNeeded,
          estimatedValue: Number(form.estimatedValue || 0),
          farmersBenefiting: Number(form.farmersBenefiting || 0),
          email: form.email,
          phone: form.phone,
          urgencyLevel: form.urgencyLevel,
          additionalNeeds: form.additionalNeeds,
          autresEquipement: form.autresEquipement || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || j.message || 'Error');
      setState({ loading: false, ok: true, err: '' });
    } catch (err) {
      setState({ loading: false, ok: false, err: err.message || t('equipmentFund.form.error') });
    }
  };

  return (
    <div>
      {/* Hero */}
      <section
        style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 100%)' }}
        className="text-white"
      >
        <div className="section-container py-16 md:py-20">
          <span className="inline-block bg-[#B5850A]/20 text-[#B5850A] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {t('equipmentFund.hero.badge')}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-3xl">
            {t('equipmentFund.hero.title')}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">{t('equipmentFund.hero.subtitle')}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="section-container py-14">
        <h2 className="text-2xl font-bold text-[#1a3c2e] mb-8 text-center">
          {t('equipmentFund.how.title')}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-[#1a3c2e]/8 flex items-center justify-center text-3xl mb-4 border border-[#1a3c2e]/10">
                {HOW_ICONS[i]}
              </div>
              <div className="w-7 h-7 rounded-full bg-[#B5850A] text-white text-xs font-bold flex items-center justify-center mb-3">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-gray-700 leading-snug">
                {t(`equipmentFund.how.${step}`)}
              </p>
              {i < HOW_STEPS.length - 1 && (
                <ArrowRight className="w-5 h-5 text-gray-300 mt-4 hidden lg:block absolute -right-3 top-10" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <section className="section-container pt-0 pb-20">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Form — takes 2/3 width */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            {state.ok ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-[#1a3c2e] mb-2">
                  {isFr ? 'Demande reçue !' : 'Application received!'}
                </h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">{t('equipmentFund.form.success')}</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link
                    to="/cooperative-registration"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: '#1a3c2e' }}
                  >
                    {isFr ? 'Inscrire ma coopérative' : 'Register cooperative'}
                  </Link>
                  <Link
                    to="/afri-yield"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#1a3c2e] text-[#1a3c2e]"
                  >
                    AfriYield Exchange
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a3c2e]">{t('equipmentFund.form.title')}</h2>
                  <p className="text-gray-500 text-sm mt-1">{t('equipmentFund.form.subtitle')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('equipmentFund.form.cooperativeName')} *
                  </label>
                  <input
                    name="cooperativeName"
                    value={form.cooperativeName}
                    onChange={onChange}
                    required
                    placeholder={
                      isFr ? 'Ex: Coopérative Karité du Sahel' : 'Ex: Sahel Shea Cooperative'
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </div>

                <LocationSelector
                  value={{ country: form.country, region: form.region }}
                  onChange={({ country, region }) => setForm((p) => ({ ...p, country, region }))}
                  required
                  showDetectedBanner={true}
                />

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {t('equipmentFund.form.equipmentNeeded')} *
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EQUIPMENT_KEYS.map((eq, i) => {
                      const on = form.equipmentNeeded.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(eq)}
                          className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                            on
                              ? 'border-[#1a3c2e] bg-[#1a3c2e]/8 text-[#1a3c2e]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span>{EQUIPMENT_ICONS[i]}</span>
                          <span className="text-xs leading-tight text-left">
                            {t(`equipmentFund.categories.${eq}`)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {form.equipmentNeeded.includes('Autres') || form.equipmentNeeded.includes('Other') ? (
                    <OtherInput
                      value={form.autresEquipement}
                      onChange={(val) => setForm((p) => ({ ...p, autresEquipement: val }))}
                      placeholder={
                        isFr
                          ? 'Ex: Décortiqueuse, Grenier solaire, Pompe à eau...'
                          : 'Ex: Thresher, Solar grain silo, Water pump...'
                      }
                    />
                  ) : null}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('equipmentFund.form.estimatedValue')}
                    </label>
                    <input
                      type="number"
                      name="estimatedValue"
                      value={form.estimatedValue}
                      onChange={onChange}
                      placeholder="Ex: 15000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('equipmentFund.form.farmersBenefiting')}
                    </label>
                    <input
                      type="number"
                      name="farmersBenefiting"
                      value={form.farmersBenefiting}
                      onChange={onChange}
                      placeholder="Ex: 45"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isFr ? "Niveau d'urgence" : 'Urgency Level'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: 'low',
                        label: isFr ? 'Faible' : 'Low',
                        color: 'border-green-200 text-green-700 bg-green-50',
                      },
                      {
                        value: 'medium',
                        label: isFr ? 'Moyen' : 'Medium',
                        color: 'border-yellow-200 text-yellow-700 bg-yellow-50',
                      },
                      {
                        value: 'high',
                        label: isFr ? 'Élevé' : 'High',
                        color: 'border-red-200 text-red-700 bg-red-50',
                      },
                    ].map((u) => (
                      <button
                        key={u.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, urgencyLevel: u.value }))}
                        className={`rounded-xl border-2 py-2 text-sm font-medium transition ${
                          form.urgencyLevel === u.value
                            ? u.color
                            : 'border-gray-200 text-gray-500 bg-white'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('equipmentFund.form.email')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      required
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Téléphone (WhatsApp)' : 'Phone (WhatsApp)'}
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      placeholder="+223 76 12 34 56"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Besoins supplémentaires ou contexte' : 'Additional needs or context'}
                  </label>
                  <textarea
                    name="additionalNeeds"
                    value={form.additionalNeeds}
                    onChange={onChange}
                    rows={3}
                    placeholder={
                      isFr
                        ? 'Décrivez votre situation, vos cultures, pourquoi cet équipement est nécessaire...'
                        : 'Describe your situation, crops, why this equipment is needed...'
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] resize-none"
                  />
                </div>

                {state.err && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    {state.err}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state.loading || form.equipmentNeeded.length === 0}
                  className="w-full rounded-xl py-4 font-bold text-white text-sm disabled:opacity-50 hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
                >
                  {state.loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                  {state.loading ? (isFr ? 'Envoi...' : 'Sending...') : t('equipmentFund.form.submit')}
                </button>
              </form>
            )}
          </div>

          {/* Right sidebar — 1/3 width */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #1a3c2e, #143326)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#B5850A]/20 flex items-center justify-center mb-4">
                <HandCoins className="w-5 h-5 text-[#B5850A]" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('equipmentFund.investor.title')}</h3>
              <p className="text-white/70 text-sm mb-5 leading-relaxed">{t('equipmentFund.investor.body')}</p>
              <Link
                to="/afri-yield/register"
                className="block w-full text-center py-3 rounded-xl font-bold text-sm text-[#1a3c2e]"
                style={{ background: '#B5850A' }}
              >
                {t('equipmentFund.investor.cta')}
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-[#1a3c2e] mb-4 text-sm uppercase tracking-wide">
                {t('equipmentFund.categories.title')}
              </h3>
              <div className="space-y-2">
                {EQUIPMENT_KEYS.map((eq, i) => (
                  <div key={eq} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{EQUIPMENT_ICONS[i]}</span>
                    <span>{t(`equipmentFund.categories.${eq}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F5F0E8] rounded-2xl p-5 border border-[#B5850A]/20">
              <p className="font-bold text-[#1a3c2e] mb-2 text-sm">
                {isFr ? '🤝 Déjà membre d\'une coopérative ?' : '🤝 Already a cooperative member?'}
              </p>
              <p className="text-gray-600 text-xs mb-3">
                {isFr
                  ? 'Si votre coopérative est enregistrée sur Sahel AgriConnect, vous avez accès à ces équipements via votre coopérative.'
                  : 'If your cooperative is registered on Sahel AgriConnect, you access equipment through your cooperative.'}
              </p>
              <Link
                to="/cooperative-registration"
                className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm text-white"
                style={{ background: '#1a3c2e' }}
              >
                {isFr ? 'Inscrire ma coopérative' : 'Register my cooperative'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
