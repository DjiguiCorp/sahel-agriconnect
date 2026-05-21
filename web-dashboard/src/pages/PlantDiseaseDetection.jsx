import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExpertRequestModal from '../components/ExpertRequestModal';
import { analyzeDiseaseImage } from '../lib/diseaseAnalysis';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { Loader2, AlertTriangle, ImageIcon } from 'lucide-react';

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1.5rem',
};

const INPUT_CLS =
  'w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/60 placeholder:text-white/30';

export default function PlantDiseaseDetection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
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
      setError(isFr ? 'Veuillez choisir une image.' : 'Please choose an image file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError(isFr ? 'Image trop volumineuse (max 5 Mo).' : 'Image too large (max 5 MB).');
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
      setError(isFr ? 'Sélectionnez ou prenez une photo.' : 'Select or take a photo.');
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
      setError(e.message || (isFr ? 'Analyse impossible.' : 'Analysis failed.'));
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
        if (!cancelled)
          setAiSolution({
            loading: false,
            err: e.message || (isFr ? 'Solutions IA indisponibles.' : 'AI solutions unavailable.'),
            data: null,
          });
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
      setSaveState({
        loading: false,
        msg: '',
        err: isFr ? 'Ajoutez un identifiant agriculteur pour sauvegarder.' : 'Add a farmer ID to save.',
      });
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
      setSaveState({
        loading: false,
        msg: isFr ? 'Analyse sauvegardée.' : 'Analysis saved.',
        err: '',
      });
    } catch (e) {
      setSaveState({
        loading: false,
        msg: '',
        err: e.message || (isFr ? 'Erreur sauvegarde.' : 'Save error.'),
      });
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
    <div style={{ minHeight: '100vh' }}>
      <section
        style={{
          background: 'linear-gradient(135deg, #0d2040 0%, #060c1f 100%)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
        }}
        className="py-14"
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(59,130,246,0.1)',
              color: '#60a5fa',
              borderColor: 'rgba(59,130,246,0.3)',
            }}
          >
            🔬 {isFr ? 'Vision IA' : 'AI Vision'} · Gemini + PlantVillage
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? 'Détection de maladies des cultures' : 'Crop Disease Detection'}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-4">
            {isFr
              ? "Photographiez votre culture — l'IA identifie la maladie et vous propose un traitement adapté en quelques secondes."
              : 'Photograph your crop — AI identifies the disease and suggests appropriate treatment in seconds.'}
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs border"
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            🌿{' '}
            {isFr
              ? 'Base de données: PlantVillage (Penn State) — Open Source'
              : 'Dataset: PlantVillage (Penn State) — Open Source'}
          </div>
        </div>
      </section>

      <section className="section-container max-w-3xl py-10 space-y-8">
        <div className="p-5 border-l-4" style={{ ...CARD_STYLE, borderLeftColor: '#3b82f6' }}>
          <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#60a5fa]" aria-hidden />
            {isFr ? 'Comment utiliser' : 'How to use'}
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-white/60">
            <li>
              {isFr
                ? 'Photographier une feuille ou fruit net, bien éclairé.'
                : 'Photograph a clear, well-lit leaf or fruit.'}
            </li>
            <li>
              {isFr
                ? 'Importer ou utiliser « Prendre une photo » sur mobile.'
                : 'Upload or use “Take a photo” on mobile.'}
            </li>
            <li>
              {isFr
                ? "Lancer l'analyse et consulter un expert en cas de doute."
                : 'Run analysis and consult an expert if unsure.'}
            </li>
          </ol>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPickFile}
        />

        <div className="p-6" style={CARD_STYLE}>
          {!preview ? (
            <div
              role="button"
              tabIndex={0}
              className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-blue-400/50"
              style={{
                borderColor: 'rgba(59,130,246,0.3)',
                background: 'rgba(59,130,246,0.04)',
              }}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
              }}
            >
              <div className="text-5xl mb-4">📷</div>
              <p className="text-white font-semibold text-base mb-1">
                {isFr ? 'Cliquez ou glissez une photo de votre culture' : 'Click or drag a photo of your crop'}
              </p>
              <p className="text-white/40 text-sm mb-4">{isFr ? 'JPEG, PNG · Max 5MB' : 'JPEG, PNG · Max 5MB'}</p>
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    background: 'rgba(59,130,246,0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}
                >
                  📁 {isFr ? 'Choisir un fichier' : 'Choose file'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCamera();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    background: 'rgba(76,175,80,0.15)',
                    color: '#4CAF50',
                    border: '1px solid rgba(76,175,80,0.3)',
                  }}
                >
                  📷 {isFr ? 'Prendre une photo' : 'Take a photo'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-xl border p-2 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' }}
              >
                <img
                  src={preview}
                  alt={isFr ? 'Aperçu de la culture' : 'Crop preview'}
                  className="w-full max-h-96 object-contain rounded-xl"
                />
              </div>
              {loading && (
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl py-10"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <Loader2 className="h-10 w-10 animate-spin text-[#60a5fa]" aria-hidden />
                  <p className="text-white/60 text-sm">
                    {isFr ? 'Analyse en cours…' : 'Analysis in progress…'}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={analyze}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-base transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#3b82f6', color: 'white' }}
              >
                {loading
                  ? isFr
                    ? 'Analyse en cours…'
                    : 'Analyzing…'
                  : isFr
                    ? '🔬 Analyser la maladie'
                    : '🔬 Analyze disease'}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-medium border transition hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
              >
                {isFr ? "Changer l'image" : 'Change image'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            className="p-4 rounded-xl text-red-300 flex gap-2 text-sm"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
            role="alert"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div
              className="p-6"
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: '1rem',
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">🔬 {result.disease_name}</h2>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs mb-4"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {isFr ? 'Source' : 'Source'}: {result.source}
                {result.source?.toLowerCase().includes('plant') ? ' · PlantVillage' : ''}
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">{isFr ? 'Confiance' : 'Confidence'}</span>
                  <span className="font-semibold text-blue-400">{result.confidence} %</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${result.confidence}%`, background: '#3b82f6' }}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border" style={CARD_STYLE}>
              <h3 className="font-semibold text-blue-400 mb-2">
                {isFr ? 'Symptômes observés' : 'Observed symptoms'}
              </h3>
              <p className="text-sm text-white/70">{result.symptoms}</p>
            </div>

            <div className="p-5 rounded-2xl border" style={CARD_STYLE}>
              <h3 className="font-semibold text-green-400 mb-2">
                {isFr ? 'Traitement recommandé' : 'Recommended treatment'}
              </h3>
              <p className="text-sm text-white/70">{result.treatment}</p>
            </div>

            <div className="p-5 rounded-2xl border" style={CARD_STYLE}>
              <h3 className="font-semibold text-amber-400 mb-2">{isFr ? 'Prévention' : 'Prevention'}</h3>
              <p className="text-sm text-white/70">{result.prevention}</p>
            </div>

            <div className="p-5 space-y-3" style={CARD_STYLE}>
              <p className="text-sm text-white/40">
                {isFr
                  ? 'Identifiant agriculteur (optionnel) — pour sauvegarder le résultat :'
                  : 'Farmer ID (optional) — to save this result:'}
              </p>
              <input
                type="text"
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder={isFr ? 'UUID (optionnel)' : 'UUID (optional)'}
                className={INPUT_CLS}
                aria-label={isFr ? 'UUID agriculteur' : 'Farmer UUID'}
              />
              <button
                type="button"
                onClick={saveResult}
                disabled={saveState.loading}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)' }}
              >
                {saveState.loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                {isFr ? "Sauvegarder l'analyse" : 'Save analysis'}
              </button>
              {saveState.msg && <p className="text-sm text-green-400">{saveState.msg}</p>}
              {saveState.err && <p className="text-sm text-red-400">{saveState.err}</p>}
            </div>

            <div className="p-5 space-y-3" style={CARD_STYLE}>
              <h3 className="font-semibold text-white">
                {isFr ? 'Solutions IA recommandées' : 'Recommended AI solutions'}
              </h3>
              {aiSolution.loading && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Loader2 className="w-4 h-4 animate-spin text-[#60a5fa]" aria-hidden />
                  {isFr ? 'Génération des solutions…' : 'Generating solutions…'}
                </div>
              )}
              {aiSolution.err && <p className="text-sm text-red-400">{aiSolution.err}</p>}
              {aiSolution.data?.success && (
                <div className="space-y-3 text-sm text-white/70">
                  {aiSolution.data.summary && (
                    <p
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(181,133,10,0.08)',
                        border: '1px solid rgba(181,133,10,0.25)',
                        color: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      <strong className="text-amber-400">{isFr ? 'Synthèse :' : 'Summary:'}</strong>{' '}
                      {aiSolution.data.summary}
                    </p>
                  )}
                  {aiSolution.data.solution && (
                    <div>
                      <p className="font-semibold text-blue-400 mb-1">{isFr ? 'Solution' : 'Solution'}</p>
                      <p className="whitespace-pre-wrap">{aiSolution.data.solution}</p>
                    </div>
                  )}
                  {Array.isArray(aiSolution.data.steps) && aiSolution.data.steps.length > 0 && (
                    <div>
                      <p className="font-semibold text-blue-400 mb-1">{isFr ? 'Étapes' : 'Steps'}</p>
                      <ol className="list-decimal list-inside space-y-1 text-white">
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
              <div className="p-5 space-y-3" style={CARD_STYLE}>
                <h3 className="font-semibold text-green-400">
                  {isFr ? 'Avantage coopératif' : 'Cooperative benefit'}
                </h3>
                {cooperativeMember ? (
                  <p className="text-sm text-white/70">
                    {isFr
                      ? 'Votre coopérative peut vous connecter à un technicien spécialisé.'
                      : 'Your cooperative can connect you with a specialized technician.'}
                  </p>
                ) : (
                  <div
                    className="p-4 rounded-xl border flex gap-3"
                    style={{ background: 'rgba(29,158,117,0.08)', borderColor: 'rgba(29,158,117,0.25)' }}
                  >
                    <p className="text-sm text-white/70">
                      {isFr
                        ? 'Votre coopérative peut vous connecter à un technicien spécialisé. '
                        : 'Your cooperative can connect you with a specialized technician. '}
                      <Link to="/cooperative-registration" className="text-[#1D9E75] underline font-semibold">
                        {isFr ? 'Rejoindre une coopérative' : 'Join a cooperative'}
                      </Link>
                    </p>
                  </div>
                )}

                <label className="flex items-start gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={cooperativeMember}
                    onChange={(e) => setCooperativeMember(e.target.checked)}
                    className="mt-1 accent-blue-400"
                  />
                  {isFr ? "Je suis membre d'une coopérative" : 'I am a cooperative member'}
                </label>
              </div>
            )}

            <section className="rounded-2xl border p-5" style={CARD_STYLE}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👩‍🌾</span>
                <h3 className="font-bold text-white text-base">
                  {isFr ? "Besoin d'un phytopathologiste ?" : 'Need a plant pathologist?'}
                </h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                {isFr
                  ? "L'IA identifie la maladie, mais un expert peut confirmer le diagnostic et adapter le traitement à votre parcelle."
                  : 'AI identifies the disease, but an expert can confirm the diagnosis and tailor treatment to your field.'}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: '🤝',
                    title: isFr ? 'Via ma coopérative' : 'Via my cooperative',
                    desc: isFr
                      ? 'Alertez votre coopérative pour une visite de terrain.'
                      : 'Alert your cooperative for a field visit.',
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
                      ? 'Diagnostics illimités + ligne directe experts maladies.'
                      : 'Unlimited diagnostics + direct line to disease experts.',
                    cta: isFr ? 'Passer à Producer Pro' : 'Upgrade to Producer Pro',
                    action: () => window.open('/producer-pro-registration', '_blank'),
                    color: '#3b82f6',
                    locked: false,
                    lockMsg: '',
                  },
                  {
                    icon: '📞',
                    title: isFr ? 'Expert maladies' : 'Disease expert',
                    desc: isFr
                      ? 'Envoyez votre photo et diagnostic — réponse sous 24h.'
                      : 'Send your photo and diagnosis — reply within 24h.',
                    cta: isFr ? 'Demander une consultation' : 'Request consultation',
                    action: () => setShowExpertModal(true),
                    color: '#60a5fa',
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

              <Link
                to="/enregistrer-agriculteur"
                className="inline-block mt-4 text-sm font-medium text-[#60a5fa] hover:underline"
              >
                {isFr ? 'Créer un profil agriculteur →' : 'Create a farmer profile →'}
              </Link>
            </section>

            <p className="text-xs text-white/40 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
              {isFr
                ? 'Cette analyse est fournie à titre indicatif. Consultez un expert pour confirmation sur le terrain.'
                : 'This analysis is indicative only. Consult an expert for field confirmation.'}
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
