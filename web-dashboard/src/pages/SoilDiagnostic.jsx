import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { regionsByCountry } from '../data/sahelRegions';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
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

export default function SoilDiagnostic() {
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

  const regionOptions = useMemo(
    () => (regionsByCountry[country]?.length > 0 ? regionsByCountry[country] : ['Autre']),
    [country]
  );

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

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-forest to-brand-sage text-white py-12">
        <div className="section-container max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Diagnostic du sol</h1>
          <p className="text-white/90">
            Outil indicatif pour les petits producteurs — pas un substitut à une analyse de laboratoire.
          </p>
        </div>
      </section>

      <div className="section-container max-w-3xl py-10">
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 text-sm ${step > i + 1 ? 'text-brand-sage font-medium' : step === i + 1 ? 'text-brand-forest font-bold' : 'text-gray-400'}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step >= i + 1 ? 'bg-brand-sage text-white' : 'bg-gray-200'
                }`}
              >
                {i + 1}
              </span>
              {label}
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:inline" aria-hidden />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-semibold text-brand-forest flex items-center gap-2">
              <Palette className="w-6 h-6 text-brand-sage" aria-hidden />
              Informations sur le sol
            </h2>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Couleur du sol *</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {soilColors.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSoilColor(o.id)}
                    className={`border rounded-lg px-3 py-2 text-left text-sm ${soilColor === o.id ? 'border-brand-sage bg-brand-iconBg' : 'border-gray-200'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" aria-hidden />
                Texture *
              </p>
              <div className="grid grid-cols-2 gap-2">
                {textures.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTexture(o.id)}
                    className={`border rounded-lg px-3 py-2 text-sm ${texture === o.id ? 'border-brand-sage bg-brand-iconBg' : 'border-gray-200'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4" aria-hidden />
                Humidité habituelle *
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {humidities.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setHumidity(o.id)}
                    className={`border rounded-lg px-3 py-2 text-sm ${humidity === o.id ? 'border-brand-sage bg-brand-iconBg' : 'border-gray-200'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!soilColor || !texture || !humidity}
              onClick={() => setStep(2)}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Suivant
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-semibold text-brand-forest flex items-center gap-2">
              <Sprout className="w-6 h-6 text-brand-sage" aria-hidden />
              Contexte de culture
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country-soil" className="block text-sm font-medium text-gray-700 mb-1">
                  Pays *
                </label>
                <select
                  id="country-soil"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setRegion('');
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="region-soil" className="block text-sm font-medium text-gray-700 mb-1">
                  Région *
                </label>
                <select
                  id="region-soil"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">— Choisir —</option>
                  {regionOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Saison de culture *</p>
              <div className="flex flex-wrap gap-2">
                {seasons.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeason(s.id)}
                    className={`border rounded-lg px-4 py-2 text-sm ${season === s.id ? 'border-brand-sage bg-brand-iconBg' : 'border-gray-200'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="last-crop" className="block text-sm font-medium text-gray-700 mb-1">
                Dernière culture principale *
              </label>
              <select
                id="last-crop"
                value={lastCrop}
                onChange={(e) => setLastCrop(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {lastCrops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border rounded-lg py-3 flex items-center justify-center gap-2">
                <ChevronLeft className="w-5 h-5" aria-hidden />
                Retour
              </button>
              <button
                type="button"
                disabled={!region}
                onClick={runDiagnose}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiState.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                    Analyse IA…
                  </>
                ) : (
                  <>
                    Voir les résultats
                    <ChevronRight className="w-5 h-5" aria-hidden />
                  </>
                )}
              </button>
            </div>
            {aiState.err && <p className="text-sm text-red-700">{aiState.err}</p>}
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-brand-forest mb-6 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-brand-sage" aria-hidden />
                Résultats
              </h2>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Score (IA)</span>
                  <span className="text-2xl font-bold text-brand-forest">{result.score} / 100</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={result.score} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full bg-gradient-to-r from-brand-sage to-brand-forest transition-all duration-700"
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700">
                    <strong>Classement :</strong> {result.rating}
                  </span>
                  {result.sheaCompatible && (
                    <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-900 px-3 py-1">
                      Compatible karité
                    </span>
                  )}
                  {result.sesameCompatible && (
                    <span className="text-xs font-semibold rounded-full bg-emerald-100 text-emerald-900 px-3 py-1">
                      Compatible sésame
                    </span>
                  )}
                </div>
                {result.summary && <p className="text-sm text-gray-600 mt-3">{result.summary}</p>}
              </div>

              <h3 className="font-semibold text-brand-forest mb-2">Cultures recommandées</h3>
              {Array.isArray(result.recommendedCrops) && result.recommendedCrops.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
                  {result.recommendedCrops.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 mb-6">—</p>
              )}

              <h3 className="font-semibold text-brand-forest mb-2">Engrais recommandés</h3>
              {Array.isArray(result.fertilizers) && result.fertilizers.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
                  {result.fertilizers.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 mb-6">—</p>
              )}

              <h3 className="font-semibold text-brand-forest mb-2">Amendements</h3>
              {Array.isArray(result.amendments) && result.amendments.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
                  {result.amendments.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 mb-6">—</p>
              )}

              {Array.isArray(result.warnings) && result.warnings.length > 0 && (
                <>
                  <h3 className="font-semibold text-brand-forest mb-2">Alertes</h3>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    {result.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="card space-y-4">
              <h3 className="font-semibold text-brand-forest flex items-center gap-2">
                <Save className="w-5 h-5 text-brand-sage" aria-hidden />
                Sauvegarder ce diagnostic
              </h3>
              <p className="text-sm text-gray-600">
                Si vous avez déjà un identifiant agriculteur (inscription), collez-le ci-dessous. Sinon{' '}
                <Link to="/enregistrer-agriculteur" className="text-brand-sage font-medium underline">
                  créez votre profil
                </Link>
                .
              </p>
              <input
                type="text"
                placeholder="UUID agriculteur (optionnel)"
                value={farmerIdInput}
                onChange={(e) => setFarmerIdInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                aria-label="Identifiant agriculteur pour lier le diagnostic"
              />
              <button
                type="button"
                disabled={saveState.loading}
                onClick={saveDiagnostic}
                className="btn-primary inline-flex items-center gap-2"
              >
                {saveState.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Save className="w-5 h-5" aria-hidden />}
                Sauvegarder ce diagnostic
              </button>
              {saveState.msg && <p className="text-green-700 text-sm">{saveState.msg}</p>}
              {saveState.err && <p className="text-red-700 text-sm">{saveState.err}</p>}
            </div>

            {result.cooperativeBenefit && (
              <div className="card">
                <h3 className="font-semibold text-brand-forest mb-2">Avantage coopératif</h3>
                <p className="text-sm text-gray-700">{result.cooperativeBenefit}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep(2)} className="border border-gray-300 rounded-lg px-4 py-2">
                Modifier le contexte
              </button>
              <Link to="/contact" className="btn-secondary inline-block text-center">
                Consulter un expert
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
