import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import LocationSelector from '../components/LocationSelector';
import OtherInput from '../components/OtherInput';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import { API_ENDPOINTS } from '../config/api';

const NEED_TYPES = [
  { key: 'equipment', icon: '🚜', labelFr: 'Équipement agricole', labelEn: 'Farm Equipment' },
  { key: 'training', icon: '📚', labelFr: 'Formation', labelEn: 'Training' },
  { key: 'certification', icon: '⭐', labelFr: 'Certification', labelEn: 'Certification' },
  { key: 'irrigation', icon: '💧', labelFr: 'Irrigation', labelEn: 'Irrigation' },
  { key: 'seeds', icon: '🌱', labelFr: 'Semences & intrants', labelEn: 'Seeds & Inputs' },
  { key: 'financing', icon: '💰', labelFr: 'Financement', labelEn: 'Financing' },
  { key: 'market_access', icon: '🌍', labelFr: 'Accès aux marchés', labelEn: 'Market Access' },
  { key: 'other', icon: '📋', labelFr: 'Autre', labelEn: 'Other' },
];

const EQUIPMENT_OPTIONS = [
  { key: 'tractor', fr: 'Tracteur', en: 'Tractor' },
  { key: 'irrigation', fr: "Pompe d'irrigation", en: 'Irrigation pump' },
  { key: 'harvester', fr: 'Machine de récolte', en: 'Harvesting machine' },
  { key: 'dryer', fr: 'Séchoir', en: 'Dryer' },
  { key: 'storage', fr: 'Silo/stockage', en: 'Silo/storage' },
  { key: 'processor', fr: 'Machine de transformation', en: 'Processing machine' },
  { key: 'transport', fr: 'Véhicule de transport', en: 'Transport vehicle' },
  { key: 'solar', fr: 'Pompe solaire', en: 'Solar pump' },
  { key: 'other_equipment', fr: 'Autre équipement', en: 'Other equipment' },
];

export default function FarmerNeeds() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const { country: detectedCountry, region: detectedRegion } = useGeolocation();
  const { userName, userEmail } = useRegisteredUser();

  const [form, setForm] = useState({
    farmerName: userName || '',
    farmerPhone: '',
    farmerEmail: userEmail || '',
    cooperativeName: '',
    country: detectedCountry || '',
    region: detectedRegion || '',
    needType: '',
    specificEquipment: [],
    description: '',
    urgencyLevel: 'medium',
    autresNeeds: '',
    autresEquipment: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const toggleEquipment = (key) => {
    setForm((p) => {
      const set = new Set(p.specificEquipment);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...p, specificEquipment: Array.from(set) };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.needType) {
      setState((s) => ({
        ...s,
        err: isFr ? 'Veuillez sélectionner un type de besoin.' : 'Please select a need type.',
      }));
      return;
    }
    if (form.needType === 'other' && !form.autresNeeds.trim()) {
      setState((s) => ({
        ...s,
        err: isFr ? 'Précisez votre autre type de besoin.' : 'Please describe your other need type.',
      }));
      return;
    }
    if (
      form.needType === 'equipment' &&
      form.specificEquipment.includes('other_equipment') &&
      !form.autresEquipment.trim()
    ) {
      setState((s) => ({
        ...s,
        err: isFr ? "Précisez l'autre équipement." : 'Please specify the other equipment.',
      }));
      return;
    }
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(API_ENDPOINTS.FARMER_NEEDS.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          autresNeeds: form.autresNeeds || undefined,
          autresEquipment: form.autresEquipment || undefined,
        }),
      });
      if (!r.ok) throw new Error();
      setState({ loading: false, ok: true, err: '' });
    } catch {
      setState({
        loading: false,
        ok: false,
        err: isFr ? 'Erreur. Réessayez.' : 'Error. Please try again.',
      });
    }
  };

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }} className="text-white">
        <div className="section-container py-14">
          <span className="inline-block bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {isFr ? 'Mes besoins agricoles' : 'My Farm Needs'}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {isFr ? 'Exprimez vos besoins' : 'Submit Your Farm Needs'}
          </h1>
          <p className="text-white/75 text-lg max-w-2xl">
            {isFr
              ? 'Votre coopérative et notre équipe admin traitent vos demandes. Équipement, formation, certification, irrigation — exprimez votre besoin et soyez notifié à chaque étape.'
              : 'Your cooperative and our admin team process your requests. Equipment, training, certification, irrigation — submit your need and be notified at every step.'}
          </p>
        </div>
      </section>

      <section className="section-container py-10">
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            {
              icon: '📝',
              step: '1',
              title: isFr ? 'Vous soumettez' : 'You submit',
              sub: isFr ? 'Décrivez votre besoin' : 'Describe your need',
            },
            {
              icon: '🤝',
              step: '2',
              title: isFr ? 'Coopérative reçoit' : 'Cooperative receives',
              sub: isFr ? 'Votre coopérative est notifiée' : 'Your cooperative is notified',
            },
            {
              icon: '⚙️',
              step: '3',
              title: isFr ? 'Admin coordonne' : 'Admin coordinates',
              sub: isFr ? 'Ressources et solutions trouvées' : 'Resources and solutions found',
            },
            {
              icon: '✅',
              step: '4',
              title: isFr ? 'Vous êtes notifié' : 'You are notified',
              sub: isFr ? 'WhatsApp + email à chaque étape' : 'WhatsApp + email at each step',
            },
          ].map((s) => (
            <div
              key={s.step}
              className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm"
            >
              <span className="text-3xl mb-2">{s.icon}</span>
              <div className="w-6 h-6 rounded-full bg-[#B5850A] text-white text-xs font-bold flex items-center justify-center mb-2">
                {s.step}
              </div>
              <p className="font-semibold text-[#1a3c2e] text-sm">{s.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            {state.ok ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-[#1a3c2e] mb-2">
                  {isFr ? 'Besoin soumis !' : 'Need submitted!'}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  {isFr
                    ? 'Votre coopérative et notre équipe ont été notifiées. Vous serez contacté par WhatsApp à chaque étape du traitement.'
                    : 'Your cooperative and our team have been notified. You will be contacted by WhatsApp at each step.'}
                </p>
                <div className="bg-[#F5F0E8] rounded-xl p-4 mt-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-[#1a3c2e] mb-2">
                    {isFr ? '📱 Ce que vous recevrez :' : '📱 What you will receive:'}
                  </p>
                  {[
                    isFr
                      ? '✓ Confirmation que votre coopérative a reçu la demande'
                      : '✓ Confirmation your cooperative received the request',
                    isFr
                      ? '✓ Mise à jour quand la solution est en cours'
                      : '✓ Update when the solution is in progress',
                    isFr
                      ? '✓ Notification finale quand votre besoin est satisfait'
                      : '✓ Final notification when your need is fulfilled',
                  ].map((item, i) => (
                    <p key={i} className="text-xs text-gray-600 mt-1">
                      {item}
                    </p>
                  ))}
                </div>
                <Link
                  to="/my-dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: '#1a3c2e' }}
                >
                  {isFr ? 'Mon tableau de bord' : 'My dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a3c2e]">
                    {isFr ? 'Mon besoin agricole' : 'My Farm Need'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {isFr
                      ? 'Décrivez votre besoin. Votre coopérative sera notifiée.'
                      : 'Describe your need. Your cooperative will be notified.'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Votre nom' : 'Your name'} *
                    </label>
                    <input
                      value={form.farmerName}
                      onChange={(e) => setForm((p) => ({ ...p, farmerName: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Téléphone WhatsApp' : 'WhatsApp Phone'} *
                    </label>
                    <input
                      value={form.farmerPhone}
                      onChange={(e) => setForm((p) => ({ ...p, farmerPhone: e.target.value }))}
                      required
                      placeholder="+223 76 12 34 56"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Votre coopérative (si membre)' : 'Your cooperative (if member)'}
                  </label>
                  <input
                    value={form.cooperativeName}
                    onChange={(e) => setForm((p) => ({ ...p, cooperativeName: e.target.value }))}
                    placeholder={isFr ? 'Nom de votre coopérative' : 'Your cooperative name'}
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
                    {isFr ? 'Type de besoin' : 'Need Type'} *
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {NEED_TYPES.map((n) => (
                      <button
                        key={n.key}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, needType: n.key }))}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-medium transition ${
                          form.needType === n.key
                            ? 'border-[#1a3c2e] bg-[#1a3c2e]/8 text-[#1a3c2e]'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{n.icon}</span>
                        <span className="text-center leading-tight">{isFr ? n.labelFr : n.labelEn}</span>
                      </button>
                    ))}
                  </div>
                  {form.needType === 'other' && (
                    <OtherInput
                      value={form.autresNeeds}
                      onChange={(val) => setForm((p) => ({ ...p, autresNeeds: val }))}
                      placeholder={
                        isFr
                          ? 'Décrivez votre autre type de besoin...'
                          : 'Describe your other type of need...'
                      }
                    />
                  )}
                </div>

                {form.needType === 'equipment' && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {isFr ? 'Équipements spécifiques' : 'Specific Equipment'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <button
                          key={eq.key}
                          type="button"
                          onClick={() => toggleEquipment(eq.key)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition text-left ${
                            form.specificEquipment.includes(eq.key)
                              ? 'border-[#1a3c2e] bg-[#1a3c2e]/8 text-[#1a3c2e]'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          <span>{form.specificEquipment.includes(eq.key) ? '✓' : '○'}</span>
                          {isFr ? eq.fr : eq.en}
                        </button>
                      ))}
                    </div>
                    {form.specificEquipment.includes('other_equipment') && (
                      <OtherInput
                        value={form.autresEquipment}
                        onChange={(val) => setForm((p) => ({ ...p, autresEquipment: val }))}
                        placeholder={
                          isFr
                            ? 'Ex: Décortiqueuse, Batteuse, Semoir...'
                            : 'Ex: Thresher, Sheller, Seed drill...'
                        }
                      />
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{isFr ? 'Urgence' : 'Urgency'}</p>
                  <div className="flex gap-2">
                    {[
                      {
                        v: 'low',
                        fr: 'Faible',
                        en: 'Low',
                        c: 'bg-green-50 border-green-200 text-green-700',
                      },
                      {
                        v: 'medium',
                        fr: 'Moyen',
                        en: 'Medium',
                        c: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                      },
                      {
                        v: 'high',
                        fr: 'Élevé — urgent',
                        en: 'High — urgent',
                        c: 'bg-red-50 border-red-200 text-red-700',
                      },
                    ].map((u) => (
                      <button
                        key={u.v}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, urgencyLevel: u.v }))}
                        className={`flex-1 rounded-xl border-2 py-2 text-xs font-semibold transition ${
                          form.urgencyLevel === u.v ? u.c : 'border-gray-200 text-gray-400 bg-white'
                        }`}
                      >
                        {isFr ? u.fr : u.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Décrivez votre besoin' : 'Describe your need'} *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    required
                    rows={4}
                    placeholder={
                      isFr
                        ? "Ex: J'ai besoin d'un tracteur pour labourer mes 3 hectares avant la saison des pluies. Mon sol est argileux et difficile à travailler manuellement..."
                        : 'Ex: I need a tractor to plow my 3 hectares before the rainy season. My soil is clay and difficult to work manually...'
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] resize-none"
                  />
                </div>

                {state.err && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{state.err}</p>
                )}

                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full rounded-xl py-4 font-bold text-white text-sm disabled:opacity-50 hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
                >
                  {state.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isFr ? 'Soumettre mon besoin' : 'Submit my need'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
