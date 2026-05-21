import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExpertRequestModal from '../components/ExpertRequestModal';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { regionsByCountry } from '../data/sahelRegions';
import { ALL_COUNTRIES } from '../data/africanCountries';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  Sprout,
  Droplets,
  Palette,
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Save,
  Leaf,
} from 'lucide-react';

const STEPS = ['Sol', 'Contexte', 'Résultats'];

const soilColors = [
  { id: 'noir', label: 'Noir / foncé' },
  { id: 'rouge', label: 'Rouge / latéritique' },
  { id: 'sableux', label: 'Sableux / clair' },
  { id: 'argileux', label: 'Argileux / gris' },
];

const textures = [
  { id: 'sableux', label: 'Sableux' },
  { id: 'limoneux', label: 'Limoneux' },
  { id: 'argileux', label: 'Argileux' },
  { id: 'mixte', label: 'Mixte' },
];

const humidities = [
  { id: 'tres_sec', label: 'Très sec' },
  { id: 'sec', label: 'Sec' },
  { id: 'modere', label: 'Modéré' },
  { id: 'humide', label: 'Humide' },
];

const seasons = [
  { id: 'seche', label: 'Saison sèche' },
  { id: 'pluies', label: 'Saison des pluies' },
];

const lastCrops = ['Mil', 'Sorgho', 'Maïs', 'Arachide', 'Coton', 'Jachère', 'Autre'];

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1rem',
};

const CHIP_ACTIVE = {
  background: 'rgba(76,175,80,0.2)',
  border: '1.5px solid rgba(76,175,80,0.6)',
  color: '#4CAF50',
  borderRadius: '0.75rem',
};

const CHIP_INACTIVE = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.7)',
  borderRadius: '0.75rem',
};

const SELECT_CLS =
  'w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-green-500/60';

function ratingBadgeClass(rating) {
  switch (rating) {
    case 'Excellent':
      return 'bg-green-500/15 text-green-400 border border-green-500/30';
    case 'Bon':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    case 'Moyen':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'Faible':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    default:
      return 'bg-white/10 text-white/70 border border-white/20';
  }
}

export default function SoilDiagnostic() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [step, setStep] = useState(1);
  const [soilColor, setSoilColor] = useState('');
  const [texture, setTexture] = useState('');
  const [humidity, setHumidity] = useState('');
  const [country, setCountry] = useState('Mali');
  const [region, setRegion] = useState('');
  const [season, setSeason] = useState('seche');
  const [lastCrop, setLastCrop] = useState('Mil');
  const [result, setResult] = useState(null);
  const [farmerIdInput, setFarmerIdInput] = useState('');
  const [aiState, setAiState] = useState({ loading: false, err: '' });
  const [saveState, setSaveState] = useState({ loading: false, msg: '', err: '' });
  const [showExpertModal, setShowExpertModal] = useState(false);

  const soilExpertPrefill = useMemo(
    () => ({
      cropType: lastCrop,
      problemDescription: result
        ? `Diagnostic sol: ${result.rating}${result.summary ? ` - ${result.summary}` : ''}`
        : '',
      source: 'soil_diagnosis',
    }),
    [lastCrop, result]
  );

  const regionOptions = useMemo(
    () => (regionsByCountry[country]?.length > 0 ? regionsByCountry[country] : ['Autre']),
    [country]
  );

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  const runDiagnose = async () => {
    if (!soilColor || !texture || !humidity || !region) return;
    setAiState({ loading: true, err: '' });
    setResult(null);
    try {
      const res = await fetch(API_ENDPOINTS.SOIL.DIAGNOSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soilColor,
          texture,
          humidity,
          country,
          region,
          season,
          lastCrop,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setResult(data);
      captureEvent(AnalyticsEvents.DIAGNOSTIC_SOL_USED, { country, texture, season });
      setStep(3);
    } catch (e) {
      setAiState({ loading: false, err: e.message || 'Diagnostic impossible.' });
      return;
    } finally {
      setAiState((p) => ({ ...p, loading: false }));
    }
  };

  const saveDiagnostic = async () => {
    if (!result) return;
    setSaveState({ loading: true, msg: '', err: '' });
    const raw = farmerIdInput.trim();
    if (!raw) {
      setSaveState({ loading: false, msg: '', err: 'Ajoutez un identifiant agriculteur pour sauvegarder.' });
      return;
    }

    try {
      const r = await fetch(`${API_BASE_URL}/api/farmers/${encodeURIComponent(raw)}/soil-diagnostic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { soilColor, texture, humidity, country, region, season, lastCrop },
          result,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setSaveState({ loading: false, msg: 'Diagnostic sauvegardé.', err: '' });
    } catch (e) {
      setSaveState({ loading: false, msg: '', err: e.message || 'Erreur lors de la sauvegarde.' });
    }
  };

  const renderChip = (active, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 text-left text-sm transition"
      style={active ? CHIP_ACTIVE : CHIP_INACTIVE}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      <section
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% 0%,
              rgba(40,100,60,0.5) 0%,
              rgba(20,50,35,0.28) 45%,
              transparent 70%)
          `,
          borderBottom: '1px solid rgba(76,175,80,0.2)',
        }}
        className="py-14"
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(76,175,80,0.1)',
              color: '#4CAF50',
              borderColor: 'rgba(76,175,80,0.3)',
            }}
          >
            🌱 {isFr ? 'Diagnostic sol IA' : 'AI Soil Diagnostic'}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? 'Diagnostic de votre sol' : 'Soil Diagnostic'}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {isFr
              ? 'Décrivez votre sol en 2 étapes et obtenez des recommandations personnalisées de fertilisation et de culture.'
              : 'Describe your soil in 2 steps and get personalized fertilization and crop recommendations.'}
          </p>
          <p className="text-xs mt-4 text-white/40 max-w-xl mx-auto">
            {isFr
              ? 'Outil indicatif pour les petits producteurs — pas un substitut à une analyse de laboratoire.'
              : 'Indicative tool for smallholders — not a substitute for laboratory analysis.'}
          </p>
        </div>
      </section>

      <div className="section-container max-w-3xl py-10">
        <div className="mb-8">
          <div className="h-2 rounded-full overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: '#4CAF50' }}
            />
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {STEPS.map((label, i) => {
              const stepNum = i + 1;
              const done = step > stepNum;
              const active = step === stepNum;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2 text-sm ${active ? 'text-white font-bold' : done ? 'text-green-400 font-medium' : 'text-white/40'}`}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={
                      active
                        ? { background: '#4CAF50', color: 'black' }
                        : done
                          ? { background: '#22c55e', color: 'white' }
                          : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {stepNum}
                  </span>
                  {label}
                  {i < 2 && (
                    <ChevronRight className="w-4 h-4 text-white/20 hidden sm:inline" aria-hidden />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-6" style={CARD_STYLE}>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-[#4CAF50]" aria-hidden />
              {isFr ? 'Informations sur le sol' : 'Soil information'}
            </h2>
            <div>
              <p className="text-sm font-medium text-white/70 mb-2">
                {isFr ? 'Couleur du sol *' : 'Soil color *'}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {soilColors.map((o) => renderChip(soilColor === o.id, () => setSoilColor(o.id), o.label))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" aria-hidden />
                {isFr ? 'Texture *' : 'Texture *'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {textures.map((o) => renderChip(texture === o.id, () => setTexture(o.id), o.label))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4" aria-hidden />
                {isFr ? 'Humidité habituelle *' : 'Usual moisture *'}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {humidities.map((o) => renderChip(humidity === o.id, () => setHumidity(o.id), o.label))}
              </div>
            </div>
            <button
              type="button"
              disabled={!soilColor || !texture || !humidity}
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90"
              style={{ background: '#4CAF50', color: 'black' }}
            >
              {isFr ? 'Suivant' : 'Next'}
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-6" style={CARD_STYLE}>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Sprout className="w-6 h-6 text-[#4CAF50]" aria-hidden />
              {isFr ? 'Contexte de culture' : 'Growing context'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 [&_label]:text-white/70">
              <div>
                <label htmlFor="country-soil" className="block text-sm font-medium mb-1">
                  {isFr ? 'Pays *' : 'Country *'}
                </label>
                <select
                  id="country-soil"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setRegion('');
                  }}
                  className={SELECT_CLS}
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-brand-midGreen">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="region-soil" className="block text-sm font-medium mb-1">
                  {isFr ? 'Région *' : 'Region *'}
                </label>
                <select
                  id="region-soil"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="" className="bg-brand-midGreen">
                    — {isFr ? 'Choisir' : 'Choose'} —
                  </option>
                  {regionOptions.map((r) => (
                    <option key={r} value={r} className="bg-brand-midGreen">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 mb-2">
                {isFr ? 'Saison de culture *' : 'Growing season *'}
              </p>
              <div className="flex flex-wrap gap-2">
                {seasons.map((s) => renderChip(season === s.id, () => setSeason(s.id), s.label))}
              </div>
            </div>
            <div>
              <label htmlFor="last-crop" className="block text-sm font-medium text-white/70 mb-1">
                {isFr ? 'Dernière culture principale *' : 'Last main crop *'}
              </label>
              <select
                id="last-crop"
                value={lastCrop}
                onChange={(e) => setLastCrop(e.target.value)}
                className={SELECT_CLS}
              >
                {lastCrops.map((c) => (
                  <option key={c} value={c} className="bg-brand-midGreen">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl py-3 flex items-center justify-center gap-2 border transition hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', background: 'transparent' }}
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
                {isFr ? 'Retour' : 'Back'}
              </button>
              <button
                type="button"
                disabled={!region}
                onClick={runDiagnose}
                className="flex-1 rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90"
                style={{ background: '#4CAF50', color: 'black' }}
              >
                {aiState.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                    {isFr ? 'Analyse IA…' : 'AI analysis…'}
                  </>
                ) : (
                  <>
                    {isFr ? 'Voir les résultats' : 'View results'}
                    <ChevronRight className="w-5 h-5" aria-hidden />
                  </>
                )}
              </button>
            </div>
            {aiState.err && (
              <p
                className="text-sm text-red-300 rounded-lg px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {aiState.err}
              </p>
            )}
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-6">
            <div className="p-6" style={CARD_STYLE}>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-[#4CAF50]" aria-hidden />
                {isFr ? 'Résultats' : 'Results'}
              </h2>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/70">
                    {isFr ? 'Score (IA)' : 'Score (AI)'}
                  </span>
                  <span className="text-2xl font-bold text-[#4CAF50]">{result.score} / 100</span>
                </div>
                <div
                  className="h-4 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  role="progressbar"
                  aria-valuenow={result.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${result.score}%`, background: '#4CAF50' }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold rounded-full px-3 py-1 ${ratingBadgeClass(result.rating)}`}
                  >
                    {result.rating}
                  </span>
                  {result.sheaCompatible && (
                    <span
                      className="text-xs font-semibold rounded-full px-3 py-1"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      {isFr ? 'Compatible karité' : 'Shea compatible'}
                    </span>
                  )}
                  {result.sesameCompatible && (
                    <span
                      className="text-xs font-semibold rounded-full px-3 py-1"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                      {isFr ? 'Compatible sésame' : 'Sesame compatible'}
                    </span>
                  )}
                </div>
                {result.summary && <p className="text-sm text-white/70 mt-3">{result.summary}</p>}
              </div>

              <h3 className="font-semibold text-green-400 mb-2">
                {isFr ? 'Cultures recommandées' : 'Recommended crops'}
              </h3>
              {Array.isArray(result.recommendedCrops) && result.recommendedCrops.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-white mb-6">
                  {result.recommendedCrops.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/40 mb-6">—</p>
              )}

              <h3 className="font-semibold text-green-400 mb-2">
                {isFr ? 'Engrais recommandés' : 'Recommended fertilizers'}
              </h3>
              {Array.isArray(result.fertilizers) && result.fertilizers.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-white mb-6">
                  {result.fertilizers.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/40 mb-6">—</p>
              )}

              <h3 className="font-semibold text-green-400 mb-2">
                {isFr ? 'Amendements' : 'Amendments'}
              </h3>
              {Array.isArray(result.amendments) && result.amendments.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-white mb-6">
                  {result.amendments.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/40 mb-6">—</p>
              )}

              {Array.isArray(result.warnings) && result.warnings.length > 0 && (
                <>
                  <h3 className="font-semibold text-green-400 mb-2">{isFr ? 'Alertes' : 'Warnings'}</h3>
                  <ul className="list-disc list-inside space-y-1 text-red-400">
                    {result.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="p-6 space-y-4" style={CARD_STYLE}>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-[#4CAF50]" aria-hidden />
                {isFr ? 'Sauvegarder ce diagnostic' : 'Save this diagnostic'}
              </h3>
              <p className="text-sm text-white/40">
                {isFr ? (
                  <>
                    Si vous avez déjà un identifiant agriculteur (inscription), collez-le ci-dessous. Sinon{' '}
                    <Link to="/enregistrer-agriculteur" className="text-[#4CAF50] font-medium underline">
                      créez votre profil
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    If you already have a farmer ID from registration, paste it below. Otherwise{' '}
                    <Link to="/enregistrer-agriculteur" className="text-[#4CAF50] font-medium underline">
                      create your profile
                    </Link>
                    .
                  </>
                )}
              </p>
              <input
                type="text"
                placeholder={isFr ? 'UUID agriculteur (optionnel)' : 'Farmer UUID (optional)'}
                value={farmerIdInput}
                onChange={(e) => setFarmerIdInput(e.target.value)}
                className={`${SELECT_CLS} font-mono`}
                aria-label={isFr ? 'Identifiant agriculteur pour lier le diagnostic' : 'Farmer ID to link diagnostic'}
              />
              <button
                type="button"
                disabled={saveState.loading}
                onClick={saveDiagnostic}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#4CAF50', color: 'black' }}
              >
                {saveState.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                ) : (
                  <Save className="w-5 h-5" aria-hidden />
                )}
                {isFr ? 'Sauvegarder ce diagnostic' : 'Save this diagnostic'}
              </button>
              {saveState.msg && <p className="text-green-400 text-sm">{saveState.msg}</p>}
              {saveState.err && <p className="text-red-400 text-sm">{saveState.err}</p>}
            </div>

            {result.cooperativeBenefit && (
              <div className="p-6" style={CARD_STYLE}>
                <h3 className="font-semibold text-green-400 mb-2">
                  {isFr ? 'Avantage coopératif' : 'Cooperative benefit'}
                </h3>
                <p className="text-sm text-white/70">{result.cooperativeBenefit}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl px-4 py-2 border transition hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', background: 'transparent' }}
            >
              {isFr ? 'Modifier le contexte' : 'Edit context'}
            </button>

            <section className="rounded-2xl border p-5" style={CARD_STYLE}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👩‍🌾</span>
                <h3 className="font-bold text-white text-base">
                  {isFr ? "Besoin d'un agronome ?" : 'Need an agronomist?'}
                </h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                {isFr
                  ? "L'analyse IA du sol est un bon point de départ, mais un expert peut confirmer vos recommandations de fertilisation sur le terrain."
                  : 'AI soil analysis is a good start, but an expert can confirm your fertilization recommendations in the field.'}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: '🤝',
                    title: isFr ? 'Via ma coopérative' : 'Via my cooperative',
                    desc: isFr
                      ? 'Votre coopérative peut organiser une analyse de sol complémentaire.'
                      : 'Your cooperative can arrange supplemental soil analysis.',
                    cta: isFr ? 'Contacter ma coop' : 'Contact my coop',
                    action: () => window.open('/contact', '_blank'),
                    color: '#1D9E75',
                    locked: false,
                    lockMsg: '',
                  },
                  {
                    icon: '⭐',
                    title: 'Producer Pro',
                    desc: isFr
                      ? 'Analyses sol illimitées + accès prioritaire aux agronomes certifiés.'
                      : 'Unlimited soil analyses + priority access to certified agronomists.',
                    cta: isFr ? 'Passer à Producer Pro' : 'Upgrade to Producer Pro',
                    action: () => window.open('/producer-pro-registration', '_blank'),
                    color: '#4CAF50',
                    locked: false,
                    lockMsg: '',
                  },
                  {
                    icon: '📞',
                    title: isFr ? 'Expert sol certifié' : 'Certified soil expert',
                    desc: isFr
                      ? 'Soumettez votre diagnostic — un agronome répond sous 24h.'
                      : 'Submit your diagnostic — an agronomist replies within 24h.',
                    cta: isFr ? 'Demander une consultation' : 'Request consultation',
                    action: () => setShowExpertModal(true),
                    color: '#3b82f6',
                    locked: false,
                    lockMsg: '',
                  },
                ].map(({ icon, title, desc, cta, action, color, locked, lockMsg }) => (
                  <div
                    key={title}
                    className="rounded-xl border p-4"
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
            </section>
          </div>
        )}
      </div>

      <ExpertRequestModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        prefillData={soilExpertPrefill}
      />
    </div>
  );
}
