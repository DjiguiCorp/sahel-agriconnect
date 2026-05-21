import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExpertRequestModal from '../components/ExpertRequestModal';
import {
  Droplet,
  Bug,
  Layers,
  Package,
  TrendingUp,
  Wrench,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const CATEGORIES = [
  { id: 'irrigation', title: 'Irrigation & eau', apiValue: 'Irrigation & Water', Icon: Droplet },
  { id: 'pests', title: 'Ravageurs & maladies', apiValue: 'Pests & Diseases', Icon: Bug },
  { id: 'soil', title: 'Sol & fertilité', apiValue: 'Soil & Fertility', Icon: Layers },
  { id: 'harvest', title: 'Récolte & stockage', apiValue: 'Harvest & Storage', Icon: Package },
  { id: 'market', title: 'Marché & prix', apiValue: 'Market & Pricing', Icon: TrendingUp },
  { id: 'equipment', title: 'Équipement & machinerie', apiValue: 'Equipment & Machinery', Icon: Wrench },
];

const CROP_OPTIONS = [
  'Karité (shea)',
  'Sésame',
  'Mil',
  'Sorgho',
  'Maïs',
  'Riz',
  'Niébé',
  'Arachide',
  'Coton',
  'Tomate',
  'Autre culture',
];

const URGENCY = {
  immediate: { badge: 'bg-red-600 text-white', label: 'Action immédiate' },
  within_week: { badge: 'bg-orange-500 text-white', label: 'Sous une semaine' },
  seasonal: { badge: 'bg-emerald-600 text-white', label: 'Calendrier agricole' },
};

const inputCls =
  'w-full rounded-xl border text-white text-sm px-4 py-3 focus:outline-none focus:border-amber-500/60';

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  borderColor: 'rgba(255,255,255,0.12)',
};

export default function ThinkTank() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [selectedId, setSelectedId] = useState(null);
  const [problem, setProblem] = useState('');
  const [cropType, setCropType] = useState(CROP_OPTIONS[0]);
  const [region, setRegion] = useState('');
  const [cooperativeMember, setCooperativeMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const resultsRef = useRef(null);

  const expertPrefill = useMemo(
    () => ({
      problemDescription: problem.trim()
        ? [
            problem.trim(),
            result?.summary ? `Synthèse IA: ${result.summary}` : '',
            result?.solution ? `Solution IA: ${result.solution}` : '',
          ]
          .filter(Boolean)
          .join('\n\n')
        : '',
      cropType,
      urgency:
        result?.urgency && ['immediate', 'within_week', 'seasonal'].includes(result.urgency)
          ? result.urgency
          : undefined,
      source: 'think_tank',
    }),
    [problem, cropType, result]
  );

  const selected = CATEGORIES.find((c) => c.id === selectedId);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!selected) {
      setError('Veuillez choisir une catégorie de problème.');
      return;
    }
    const trimmed = problem.trim();
    if (!trimmed) {
      setError('Décrivez votre problème pour obtenir une solution.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.THINKTANK.SOLVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: trimmed,
          category: selected.apiValue,
          cropType: cropType || 'Non précisé',
          region: region.trim() || 'Non précisée',
          cooperativeMember,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      setResult(data);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      setError(err.message || 'Impossible de contacter le service.');
    } finally {
      setLoading(false);
    }
  }

  const urgencyKey = result?.urgency && URGENCY[result.urgency] ? result.urgency : 'seasonal';
  const urgencyStyle = URGENCY[urgencyKey];

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <section
        style={{
          background: 'linear-gradient(135deg, #1a3c1a 0%, #0f2010 100%)',
          borderBottom: '1px solid rgba(181,133,10,0.2)',
        }}
        className="py-16"
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(181,133,10,0.1)',
              color: '#B5850A',
              borderColor: 'rgba(181,133,10,0.3)',
            }}
          >
            🧠 {isFr ? 'Alimenté par IA' : 'Powered by AI'} · Gemini Pro
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? 'Think Tank Agricole' : 'Agricultural Think Tank'}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-6">
            {isFr
              ? "Des solutions expertes et instantanées pour vos défis agricoles. Décrivez votre problème, obtenez un plan d'action concret."
              : 'Expert, instant solutions for your farming challenges. Describe your problem, get a concrete action plan.'}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>🤖 Gemini Pro AI</span>
            <span>·</span>
            <span>🌿 PlantVillage Dataset</span>
            <span>·</span>
            <span>🌍 {isFr ? 'Adapté Sahel' : 'Sahel-optimized'}</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-white font-semibold text-sm mb-4">
          {isFr ? '1. Choisissez une catégorie' : '1. Choose a category'}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ id, title, Icon }) => {
            const active = selectedId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSelectedId(id);
                  setError('');
                }}
                className="flex items-center gap-3 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                style={
                  active
                    ? {
                        background: 'rgba(181,133,10,0.15)',
                        border: '1.5px solid rgba(181,133,10,0.5)',
                        borderRadius: '1rem',
                      }
                    : {
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                      }
                }
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-[#B5850A] text-black' : 'bg-white/10 text-white/60'
                  }`}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="font-medium text-white">{title}</span>
              </button>
            );
          })}
        </div>

        {selectedId && (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <p className="text-white font-semibold text-sm">
              {isFr ? '2. Décrivez votre situation' : '2. Describe your situation'}
            </p>
            <div>
              <label htmlFor="thinktank-problem" className="mb-2 block text-sm font-medium text-white/70">
                {isFr ? 'Votre situation' : 'Your situation'}
              </label>
              <textarea
                id="thinktank-problem"
                rows={5}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder={isFr ? 'Décrivez votre problème en détail...' : 'Describe your problem in detail...'}
                className={`${inputCls} resize-none placeholder:text-white/30`}
                style={inputStyle}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="thinktank-crop" className="mb-2 block text-sm font-medium text-white/70">
                  {isFr ? 'Type de culture' : 'Crop type'}
                </label>
                <select
                  id="thinktank-crop"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-brand-midGreen text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="thinktank-region" className="mb-2 block text-sm font-medium text-white/70">
                  {isFr ? 'Région / pays' : 'Region / country'}
                </label>
                <input
                  id="thinktank-region"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={isFr ? 'Ex. : Kaffrine, Sénégal' : 'e.g. Kaffrine, Senegal'}
                  className={`${inputCls} placeholder:text-white/30`}
                  style={inputStyle}
                />
              </div>
            </div>

            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
              style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)' }}
            >
              <input
                type="checkbox"
                checked={cooperativeMember}
                onChange={(e) => setCooperativeMember(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 accent-[#B5850A]"
              />
              <span className="text-sm text-white/70">
                {isFr ? "Je suis membre d'une coopérative" : 'I am a cooperative member'}
              </span>
            </label>

            {error && (
              <p
                className="rounded-lg px-4 py-3 text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 inline-flex items-center justify-center gap-2"
              style={{ background: '#B5850A', color: 'black' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  {isFr ? 'Envoi…' : 'Sending…'}
                </>
              ) : isFr ? (
                'Obtenir une solution IA'
              ) : (
                'Get an AI solution'
              )}
            </button>
          </form>
        )}

        {loading && (
          <div
            className="mt-12 flex flex-col items-center justify-center gap-3 rounded-2xl py-12"
            style={{ border: '1px solid rgba(181,133,10,0.25)', background: 'rgba(181,133,10,0.08)' }}
          >
            <Loader2 className="h-10 w-10 animate-spin text-[#B5850A]" aria-hidden />
            <p className="text-center text-white/70">
              {isFr ? 'Analyse en cours par notre expert IA…' : 'Analysis in progress by our AI expert…'}
            </p>
          </div>
        )}

        {result?.success && !loading && (
          <div ref={resultsRef} className="mt-12 space-y-8 scroll-mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-white/50">
                {isFr ? "Niveau d'urgence" : 'Urgency level'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${urgencyStyle.badge}`}>
                {urgencyStyle.label}
              </span>
            </div>

            {result.summary && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(181,133,10,0.08)',
                  border: '1px solid rgba(181,133,10,0.25)',
                }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400">
                  {isFr ? 'Synthèse' : 'Summary'}
                </h3>
                <p className="mt-2 text-lg text-white/70">{result.summary}</p>
              </div>
            )}

            {result.solution && (
              <section
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <h3 className="text-xl font-semibold text-white">{isFr ? 'Solution' : 'Solution'}</h3>
                <p className="mt-3 whitespace-pre-wrap text-white/60 leading-relaxed">{result.solution}</p>
              </section>
            )}

            {Array.isArray(result.steps) && result.steps.length > 0 && (
              <section
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <h3 className="text-xl font-semibold text-white">{isFr ? 'Étapes à suivre' : 'Steps to follow'}</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-white/60">
                  {result.steps.map((step, i) => (
                    <li key={i} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {Array.isArray(result.inputs) && result.inputs.length > 0 && (
              <section
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
                  <ShoppingBag className="h-5 w-5 text-[#B5850A]" aria-hidden />
                  {isFr ? 'Intrants nécessaires' : 'Required inputs'}
                </h3>
                <ul className="space-y-2 text-white/60">
                  {result.inputs.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#B5850A]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'rgba(29,158,117,0.06)', borderColor: 'rgba(29,158,117,0.2)' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🤝</span>
                  <h3 className="font-bold text-white text-base">
                    {isFr ? 'Avantage coopérative' : 'Cooperative Benefit'}
                  </h3>
                </div>
                {!cooperativeMember ? (
                  <div>
                    <div className="blur-sm select-none opacity-50 pointer-events-none mb-3">
                      <p className="text-white/60 text-sm">
                        {typeof result.cooperativeBenefit === 'string' ? result.cooperativeBenefit : ''}
                      </p>
                    </div>
                    <div
                      className="rounded-xl border p-4 text-center"
                      style={{ background: 'rgba(29,158,117,0.08)', borderColor: 'rgba(29,158,117,0.25)' }}
                    >
                      <p className="text-white/70 text-sm mb-3">
                        {isFr
                          ? 'Rejoignez une coopérative pour accéder aux avantages collectifs — équipement partagé, stockage groupé, prix négociés.'
                          : 'Join a cooperative to access collective benefits — shared equipment, group storage, negotiated prices.'}
                      </p>
                      <Link
                        to="/cooperative-registration"
                        className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-black"
                        style={{ background: '#1D9E75' }}
                      >
                        {isFr ? 'Rejoindre une coopérative →' : 'Join a Cooperative →'}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{result.cooperativeBenefit}</p>
                )}
              </div>
            </section>

            <section
              className="rounded-2xl border p-5"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👩‍🌾</span>
                <h3 className="font-bold text-white text-base">
                  {isFr ? "Besoin d'un expert humain ?" : 'Need a Human Expert?'}
                </h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                {isFr
                  ? "L'IA donne de bonnes recommandations, mais rien ne remplace un expert de terrain qui connaît votre région et votre culture."
                  : 'AI gives good recommendations, but nothing replaces a field expert who knows your region and crop.'}
              </p>

              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                {[
                  {
                    icon: '🤝',
                    title: isFr ? 'Via ma coopérative' : 'Via my cooperative',
                    desc: isFr
                      ? 'Votre coopérative peut vous mettre en relation avec un technicien local.'
                      : 'Your cooperative can connect you with a local technician.',
                    cta: isFr ? 'Contacter ma coop' : 'Contact my coop',
                    action: () => window.open('/contact', '_blank'),
                    color: '#1D9E75',
                    locked: !cooperativeMember,
                    lockMsg: isFr ? 'Réservé aux membres' : 'Members only',
                  },
                  {
                    icon: '⭐',
                    title: 'Producer Pro',
                    desc: isFr
                      ? 'Accès prioritaire aux experts — disponible 24/7 pour les abonnés Pro.'
                      : 'Priority expert access — available 24/7 for Pro subscribers.',
                    cta: isFr ? 'Passer à Producer Pro' : 'Upgrade to Producer Pro',
                    action: () => window.open('/producer-pro-registration', '_blank'),
                    color: '#B5850A',
                    locked: false,
                    lockMsg: '',
                  },
                  {
                    icon: '📞',
                    title: isFr ? 'Consulter un expert' : 'Consult an Expert',
                    desc: isFr
                      ? 'Soumettez une demande — un agronome vous répond sous 24h.'
                      : 'Submit a request — an agronomist replies within 24h.',
                    cta: isFr ? 'Demander une consultation' : 'Request consultation',
                    action: () => setShowExpertModal(true),
                    color: '#3b82f6',
                    locked: false,
                    lockMsg: '',
                  },
                ].map(({ icon, title, desc, cta, action, color, locked, lockMsg }) => (
                  <div
                    key={title}
                    className="rounded-xl border p-4 relative"
                    style={{
                      background: `${color}08`,
                      borderColor: `${color}25`,
                      opacity: locked ? 0.7 : 1,
                    }}
                  >
                    <div className="text-xl mb-2">{icon}</div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-white/50 text-xs mt-1 mb-3 leading-relaxed">{desc}</p>
                    <button
                      type="button"
                      onClick={locked ? undefined : action}
                      disabled={locked}
                      className="w-full py-2 rounded-lg text-xs font-bold transition-opacity disabled:cursor-not-allowed"
                      style={{
                        background: locked ? 'rgba(255,255,255,0.08)' : `${color}20`,
                        color: locked ? 'rgba(255,255,255,0.3)' : color,
                        border: `1px solid ${locked ? 'rgba(255,255,255,0.1)' : `${color}40`}`,
                      }}
                    >
                      {locked ? `🔒 ${lockMsg}` : cta}
                    </button>
                  </div>
                ))}
              </div>

              {cooperativeMember && result.additionalSupport?.description && (
                <p className="text-sm text-white/50">{result.additionalSupport.description}</p>
              )}
            </section>
          </div>
        )}
      </div>

      <ExpertRequestModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        prefillData={expertPrefill}
      />
    </div>
  );
}
