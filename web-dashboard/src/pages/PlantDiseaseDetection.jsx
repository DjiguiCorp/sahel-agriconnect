import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ExpertRequestModal from '../components/ExpertRequestModal';
import { analyzeDiseaseImage } from '../lib/diseaseAnalysis';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  Leaf,
  Shield,
  Stethoscope,
  ImageIcon,
  Lock,
} from 'lucide-react';

export default function PlantDiseaseDetection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [farmerId, setFarmerId] = useState('');
  const [saveState, setSaveState] = useState({ loading: false, msg: '', err: '' });
  const [cooperativeMember, setCooperativeMember] = useState(false);
  const [aiSolution, setAiSolution] = useState({ loading: false, err: '', data: null });
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [showExpertModal, setShowExpertModal] = useState(false);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Veuillez choisir une image.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image trop volumineuse (max 5 Mo).');
      return;
    }
    setError('');
    setFile(f);
    setResult(null);
    setSaveState({ loading: false, msg: '', err: '' });
    setAiSolution({ loading: false, err: '', data: null });
    const r = new FileReader();
    r.onload = () => setPreview(r.result);
    r.readAsDataURL(f);
  };

  const openCamera = () => {
    camRef.current?.click();
  };

  const analyze = async () => {
    if (!file) {
      setError('Sélectionnez ou prenez une photo.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setSaveState({ loading: false, msg: '', err: '' });
    setAiSolution({ loading: false, err: '', data: null });
    try {
      const data = await analyzeDiseaseImage(file);
      setResult(data);
      captureEvent(AnalyticsEvents.DISEASE_DETECTION_USED, { source: data.source });
      captureEvent(AnalyticsEvents.DISEASE_DETECTION_COMPLETED, {
        disease: data.disease_name,
        source: data.source,
      });
    } catch (e) {
      setError(e.message || 'Analyse impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!result?.disease_name) return;
      setAiSolution({ loading: true, err: '', data: null });
      try {
        const r = await fetch(API_ENDPOINTS.THINKTANK.SOLVE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem: result.disease_name,
            category: 'Pests & Diseases',
            cropType: 'Non précisé',
            region: 'Non précisée',
            cooperativeMember,
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
        if (!cancelled) setAiSolution({ loading: false, err: '', data: j });
      } catch (e) {
        if (!cancelled) setAiSolution({ loading: false, err: e.message || 'Solutions IA indisponibles.', data: null });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [result?.disease_name, cooperativeMember]);

  const saveResult = async () => {
    if (!result) return;
    const raw = farmerId.trim();
    if (!raw) {
      setSaveState({ loading: false, msg: '', err: 'Ajoutez un identifiant agriculteur pour sauvegarder.' });
      return;
    }
    setSaveState({ loading: true, msg: '', err: '' });
    try {
      const r = await fetch(`${API_BASE_URL}/api/farmers/${encodeURIComponent(raw)}/disease-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setSaveState({ loading: false, msg: 'Analyse sauvegardée.', err: '' });
    } catch (e) {
      setSaveState({ loading: false, msg: '', err: e.message || 'Erreur sauvegarde.' });
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setSaveState({ loading: false, msg: '', err: '' });
    setAiSolution({ loading: false, err: '', data: null });
    if (fileRef.current) fileRef.current.value = '';
    if (camRef.current) camRef.current.value = '';
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-forest to-brand-sage text-white py-12">
        <div className="section-container max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Détection de maladies des plantes</h1>
          <p className="text-white/90">Photo nette du feuillage ou de la partie atteinte — résultat indicatif.</p>
        </div>
      </section>

      <section className="section-container max-w-3xl py-12 space-y-8">
        <div className="card border-l-4 border-brand-sage bg-brand-cream/40">
          <h2 className="font-semibold text-brand-forest mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" aria-hidden />
            Comment utiliser
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Photographier une feuille ou fruit net, bien éclairé.</li>
            <li>Importer ou utiliser « Prendre une photo » sur mobile.</li>
            <li>Lancer l’analyse et consulter un expert en cas de doute.</li>
          </ol>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} id="file-disease" />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPickFile}
          id="cam-disease"
        />

        {!preview ? (
          <div className="card border-2 border-dashed border-gray-300">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center py-8">
              <label
                htmlFor="file-disease"
                className="btn-primary inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5" aria-hidden />
                Choisir une image
              </label>
              <button type="button" onClick={openCamera} className="btn-secondary inline-flex items-center gap-2">
                <Camera className="w-5 h-5" aria-hidden />
                Prendre une photo
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 pb-4">JPG, PNG, WebP — max 5 Mo</p>
          </div>
        ) : (
          <div className="card space-y-4">
            <img src={preview} alt="Aperçu de la culture" className="w-full max-h-96 object-contain rounded-lg border bg-gray-50" />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={analyze}
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2 flex-1 min-w-[200px] justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-5 h-5" aria-hidden />
                    Analyser
                  </>
                )}
              </button>
              <button type="button" onClick={reset} disabled={loading} className="border border-gray-300 rounded-lg px-4 py-3">
                Changer l’image
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-brand-forest mb-2 flex items-center gap-2">
                <Leaf className="w-7 h-7 text-brand-sage" aria-hidden />
                {result.disease_name}
              </h2>
              <p className="text-xs text-gray-500 mb-4">Source : {result.source}</p>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Confiance</span>
                  <span className="font-semibold text-brand-forest">{result.confidence} %</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-amber rounded-full transition-all" style={{ width: `${result.confidence}%` }} />
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-brand-forest mb-1">Symptômes observés</h3>
                  <p className="text-sm">{result.symptoms}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-forest mb-1">Traitement recommandé</h3>
                  <p className="text-sm">{result.treatment}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-forest mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4" aria-hidden />
                    Prévention
                  </h3>
                  <p className="text-sm">{result.prevention}</p>
                </div>
              </div>
            </div>

            <div className="card space-y-3">
              <p className="text-sm text-gray-600">Identifiant agriculteur (optionnel) — pour sauvegarder le résultat :</p>
              <input
                type="text"
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder="UUID (optionnel)"
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                aria-label="UUID agriculteur"
              />
              <button type="button" onClick={saveResult} disabled={saveState.loading} className="btn-secondary inline-flex items-center gap-2">
                {saveState.loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Sauvegarder l’analyse
              </button>
              {saveState.msg && <p className="text-sm text-green-700">{saveState.msg}</p>}
              {saveState.err && <p className="text-sm text-red-700">{saveState.err}</p>}
            </div>

            <div className="card space-y-3">
              <h3 className="font-semibold text-brand-forest">Solutions IA recommandées</h3>
              {aiSolution.loading && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Génération des solutions…
                </div>
              )}
              {aiSolution.err && <p className="text-sm text-red-700">{aiSolution.err}</p>}
              {aiSolution.data?.success && (
                <div className="space-y-3 text-sm text-gray-700">
                  {aiSolution.data.summary && (
                    <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                      <strong>Synthèse :</strong> {aiSolution.data.summary}
                    </p>
                  )}
                  {aiSolution.data.solution && (
                    <div>
                      <p className="font-semibold text-brand-forest mb-1">Solution</p>
                      <p className="whitespace-pre-wrap">{aiSolution.data.solution}</p>
                    </div>
                  )}
                  {Array.isArray(aiSolution.data.steps) && aiSolution.data.steps.length > 0 && (
                    <div>
                      <p className="font-semibold text-brand-forest mb-1">Étapes</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {aiSolution.data.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>

            {typeof result.confidence === 'number' && result.confidence > 70 && (
              <div className="card">
                <h3 className="font-semibold text-brand-forest mb-2">Avantage coopératif</h3>
                {cooperativeMember ? (
                  <p className="text-sm text-gray-700">Votre coopérative peut vous connecter à un technicien spécialisé.</p>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-3">
                    <Lock className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden />
                    <p className="text-sm text-emerald-900">
                      Votre coopérative peut vous connecter à un technicien spécialisé.{' '}
                      <Link to="/cooperative-registration" className="underline font-semibold">
                        Rejoindre une coopérative
                      </Link>
                    </p>
                  </div>
                )}

                <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={cooperativeMember}
                    onChange={(e) => setCooperativeMember(e.target.checked)}
                    className="mt-1"
                  />
                  Je suis membre d&apos;une coopérative
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowExpertModal(true)}
                className="btn-primary inline-block text-center"
              >
                Consulter un expert
              </button>
              <Link to="/enregistrer-agriculteur" className="border border-brand-sage text-brand-forest rounded-lg px-4 py-3 font-medium">
                Créer un profil agriculteur
              </Link>
            </div>

            <p className="text-xs text-gray-500 border-t pt-4">
              Cette analyse est fournie à titre indicatif. Consultez un expert pour confirmation sur le terrain.
            </p>
          </div>
        )}
      </section>

      <ExpertRequestModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        prefillData={{
          diseaseDetected: result?.disease_name,
          cropType: result?.plant_type,
          problemDescription: result?.symptoms,
          source: 'disease_detection',
        }}
      />
    </div>
  );
}
