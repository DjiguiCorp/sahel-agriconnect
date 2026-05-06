import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  Bug,
  Layers,
  Package,
  TrendingUp,
  Wrench,
  Loader2,
  ShoppingBag,
  Lock,
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

export default function ThinkTank() {
  const [selectedId, setSelectedId] = useState(null);
  const [problem, setProblem] = useState('');
  const [cropType, setCropType] = useState(CROP_OPTIONS[0]);
  const [region, setRegion] = useState('');
  const [cooperativeMember, setCooperativeMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

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
    <div className="min-h-screen bg-stone-50">
      <section className="relative overflow-hidden border-b border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Think Tank Agricole — Solutions IA pour vos défis
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            Des réponses expertes, instantanées, adaptées à votre réalité
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Catégorie du problème</h2>
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
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  active
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="font-medium text-stone-900">{title}</span>
              </button>
            );
          })}
        </div>

        {selectedId && (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label htmlFor="thinktank-problem" className="mb-2 block text-sm font-medium text-stone-700">
                Votre situation
              </label>
              <textarea
                id="thinktank-problem"
                rows={5}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="thinktank-crop" className="mb-2 block text-sm font-medium text-stone-700">
                  Type de culture
                </label>
                <select
                  id="thinktank-crop"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="thinktank-region" className="mb-2 block text-sm font-medium text-stone-700">
                  Région / pays
                </label>
                <input
                  id="thinktank-region"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Ex. : Kaffrine, Sénégal"
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white p-4">
              <input
                type="checkbox"
                checked={cooperativeMember}
                onChange={(e) => setCooperativeMember(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700">Je suis membre d&apos;une coopérative</span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-base font-semibold text-white shadow transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? 'Envoi…' : 'Obtenir une solution IA'}
            </button>
          </form>
        )}

        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-amber-600" aria-hidden />
            <p className="text-center text-stone-700">Analyse en cours par notre expert IA…</p>
          </div>
        )}

        {result?.success && !loading && (
          <div ref={resultsRef} className="mt-12 space-y-8 scroll-mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-stone-600">Niveau d&apos;urgence</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${urgencyStyle.badge}`}>
                {urgencyStyle.label}
              </span>
            </div>

            {result.summary && (
              <div className="rounded-2xl border border-amber-200 bg-amber-100/80 p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900/80">Synthèse</h3>
                <p className="mt-2 text-lg text-amber-950">{result.summary}</p>
              </div>
            )}

            {result.solution && (
              <section>
                <h3 className="text-xl font-semibold text-stone-900">Solution</h3>
                <p className="mt-3 whitespace-pre-wrap text-stone-700 leading-relaxed">{result.solution}</p>
              </section>
            )}

            {Array.isArray(result.steps) && result.steps.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-stone-900">Étapes à suivre</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-stone-700">
                  {result.steps.map((step, i) => (
                    <li key={i} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {Array.isArray(result.inputs) && result.inputs.length > 0 && (
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-stone-900">
                  <ShoppingBag className="h-5 w-5 text-amber-700" aria-hidden />
                  Intrants nécessaires
                </h3>
                <ul className="space-y-2 text-stone-700">
                  {result.inputs.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
              {!cooperativeMember ? (
                <div className="relative p-6">
                  <div className="blur-sm select-none opacity-60" aria-hidden>
                    <h3 className="text-xl font-semibold text-emerald-900">Avantage coopératif</h3>
                    <p className="mt-2 text-stone-700">
                      {typeof result.cooperativeBenefit === 'string' ? result.cooperativeBenefit : ''}
                    </p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-50/85 p-4 text-center backdrop-blur-[2px]">
                    <Lock className="h-8 w-8 text-emerald-700" aria-hidden />
                    <p className="max-w-md text-sm text-stone-800">
                      Adhérez à une coopérative pour voir les avantages collectifs détaillés pour ce type de
                      problème.
                    </p>
                    <Link
                      to="/cooperative-registration"
                      className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                    >
                      Rejoindre une coopérative
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-emerald-900">Avantage coopératif</h3>
                  <p className="mt-2 whitespace-pre-wrap text-stone-800 leading-relaxed">
                    {result.cooperativeBenefit}
                  </p>
                </div>
              )}
            </section>

            <section className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-stone-900">Support additionnel</h3>
              {!cooperativeMember ? (
                <div className="relative mt-4 min-h-[140px]">
                  <div className="blur-sm select-none opacity-50" aria-hidden>
                    <p className="text-stone-600">
                      Demandes prioritaires aux techniciens et experts via la plateforme.
                    </p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 p-4 text-center">
                    <Lock className="h-8 w-8 text-stone-500" aria-hidden />
                    <p className="max-w-md text-sm text-stone-700">
                      Ce canal est réservé aux coopératives adhérentes. Rejoignez une coopérative pour demander une
                      visite ou parler à un expert.
                    </p>
                    <Link
                      to="/cooperative-registration"
                      className="text-sm font-semibold text-amber-700 underline hover:text-amber-900"
                    >
                      Rejoindre une coopérative
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/contact?topic=technician-visit"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Demander une visite de technicien
                  </Link>
                  <Link
                    to="/contact?topic=expert"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-semibold text-stone-900 hover:bg-stone-50"
                  >
                    Contacter un expert
                  </Link>
                </div>
              )}
              {cooperativeMember && result.additionalSupport?.description && (
                <p className="mt-4 text-sm text-stone-600">{result.additionalSupport.description}</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
