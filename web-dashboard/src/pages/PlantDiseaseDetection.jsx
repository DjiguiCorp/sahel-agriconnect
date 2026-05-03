import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { analyzeDiseaseImage } from '../lib/diseaseAnalysis';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import {
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  Leaf,
  Shield,
  Stethoscope,
  ImageIcon,
} from 'lucide-react';

export default function PlantDiseaseDetection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [farmerId, setFarmerId] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const fileRef = useRef(null);
  const camRef = useRef(null);

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
    setSaveMsg('');
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
    setSaveMsg('');
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

  const saveResult = async () => {
    if (!result || !isSupabaseConfigured() || !supabase) {
      setSaveMsg('Supabase non configuré.');
      return;
    }
    const raw = farmerId.trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const fid = raw && uuidRe.test(raw) ? raw : null;
    if (raw && !fid) {
      setSaveMsg('UUID agriculteur invalide ou laissez vide.');
      return;
    }
    try {
      const { error: err } = await supabase.from('disease_detections').insert({
        farmer_id: fid,
        disease_name: result.disease_name,
        confidence: result.confidence,
        symptoms: result.symptoms,
        treatment: result.treatment,
        prevention: result.prevention,
        source: result.source || 'unknown',
      });
      if (err) throw err;
      setSaveMsg('Analyse enregistrée.');
    } catch (e) {
      setSaveMsg(e.message || 'Erreur enregistrement.');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setSaveMsg('');
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
              <p className="text-sm text-gray-600">
                Enregistrer dans Supabase (optionnel) — identifiant agriculteur si disponible :
              </p>
              <input
                type="text"
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder="UUID (optionnel)"
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                aria-label="UUID agriculteur"
              />
              <button type="button" onClick={saveResult} className="btn-secondary">
                Enregistrer l’analyse
              </button>
              {saveMsg && <p className="text-sm text-gray-700">{saveMsg}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary inline-block text-center">
                Consulter un expert
              </Link>
              <Link to="/enregistrer-agriculteur" className="border border-brand-sage text-brand-forest rounded-lg px-4 py-3 font-medium">
                Créer un profil agriculteur
              </Link>
            </div>

            <p className="text-xs text-gray-500 border-t pt-4">
              Cette analyse ne remplace pas une visite sur le terrain. En production, préférez une clé Anthropic côté
              serveur (variable ANTHROPIC_API_KEY sur Vercel) ou Plant.id (VITE_PLANT_ID_API_KEY).
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
