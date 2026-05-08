import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Globe, Leaf, Loader2, Mail, Phone, Package, Trash2, Users, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import LocationSelector from './LocationSelector';

const PRODUCT_OPTIONS = ['Karité', 'Sésame', 'Cajou', 'Mangue', 'Arachide', 'Coton', 'Mil', 'Sorgho', 'Niébé', 'Riz'];
const PRODUCER_CERTS = ['Aucune', 'Bio local', 'Conventionnel', 'Export/FDA en cours'];
const BUYER_CERTS = ['Aucune', 'Bio', 'USDA Organic', 'Halal', 'Autre'];

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retailer', label: 'Épicerie africaine' },
  { value: 'distributor', label: 'Distributeur' },
  { value: 'importer', label: 'Importateur' },
  { value: 'manufacturer', label: 'Fabricant' },
  { value: 'other', label: 'Autre' },
];

function apiUrl(path) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

export default function DiasporaPartnership() {
  const [tab, setTab] = useState('producer'); // producer | buyer | matching
  const tabsRef = useRef(null);
  const { registerUser } = useRegisteredUser();
  const isFr = /^fr\b/i.test(String(navigator.language || '').toLowerCase());

  const [activeProducers, setActiveProducers] = useState([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [activeErr, setActiveErr] = useState('');

  const [contactProducer, setContactProducer] = useState(null);

  const [producerSubmitted, setProducerSubmitted] = useState(false);
  const [buyerSubmitted, setBuyerSubmitted] = useState(false);

  const [producerSubmitting, setProducerSubmitting] = useState(false);
  const [buyerSubmitting, setBuyerSubmitting] = useState(false);
  const [producerError, setProducerError] = useState('');
  const [buyerError, setBuyerError] = useState('');

  const [prodForm, setProdForm] = useState({
    fullName: '',
    cooperativeName: '',
    country: 'Mali',
    region: '',
    products: [],
    monthlyVolumeKg: '',
    certification: 'Aucune',
    exportExperience: 'none',
    email: '',
    phone: '',
    whatsapp: '',
  });

  const [buyForm, setBuyForm] = useState({
    fullName: '',
    businessName: '',
    businessType: 'restaurant',
    cityState: '',
    country: 'USA',
    region: '',
    productsSought: [],
    monthlyVolumeNeededKg: '',
    certificationRequired: 'Aucune',
    importExperience: false,
    email: '',
    phone: '',
    whatsapp: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function loadActive() {
      setLoadingActive(true);
      setActiveErr('');
      try {
        const res = await fetch(apiUrl('/api/diaspora/producers'));
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || 'Erreur lors du chargement des producteurs');
        }
        if (!cancelled) setActiveProducers(Array.isArray(json?.producers) ? json.producers : []);
      } catch (e) {
        if (!cancelled) setActiveErr(e?.message || 'Erreur');
      } finally {
        if (!cancelled) setLoadingActive(false);
      }
    }
    loadActive();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = activeProducers.length;

  const scrollToTabs = () => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleArray = (setter, key, item) => {
    setter((prev) => ({
      ...prev,
      [key]: prev[key].includes(item) ? prev[key].filter((x) => x !== item) : [...prev[key], item],
    }));
  };

  const producerPayload = useMemo(() => {
    return {
      fullName: prodForm.fullName.trim(),
      cooperativeName: prodForm.cooperativeName.trim() || undefined,
      country: prodForm.country,
      region: prodForm.region.trim() || undefined,
      products: prodForm.products,
      monthlyVolumeKg: prodForm.monthlyVolumeKg !== '' ? Number(prodForm.monthlyVolumeKg) : undefined,
      certification: prodForm.certification,
      email: prodForm.email.trim() || undefined,
      phone: prodForm.phone.trim(),
      whatsapp: prodForm.whatsapp.trim() || undefined,
      exportExperience: prodForm.exportExperience,
    };
  }, [prodForm]);

  const buyerPayload = useMemo(() => {
    return {
      fullName: buyForm.fullName.trim(),
      businessName: buyForm.businessName.trim(),
      businessType: buyForm.businessType,
      cityState: buyForm.cityState.trim() || undefined,
      country: buyForm.country.trim() || 'USA',
      productsSought: buyForm.productsSought,
      monthlyVolumeNeededKg: buyForm.monthlyVolumeNeededKg !== '' ? Number(buyForm.monthlyVolumeNeededKg) : undefined,
      email: buyForm.email.trim(),
      phone: buyForm.phone.trim() || undefined,
      whatsapp: buyForm.whatsapp.trim() || undefined,
      importExperience: Boolean(buyForm.importExperience),
      certificationRequired: buyForm.certificationRequired || undefined,
    };
  }, [buyForm]);

  const submitProducer = async (e) => {
    e.preventDefault();
    setProducerError('');

    if (!prodForm.fullName.trim() || !prodForm.phone.trim() || !prodForm.country) {
      setProducerError('Nom, pays et téléphone sont obligatoires.');
      return;
    }
    if (!prodForm.products.length) {
      setProducerError('Veuillez sélectionner au moins un produit disponible.');
      return;
    }

    setProducerSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/diaspora/producers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producerPayload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de l\'envoi');
      setProducerSubmitted(true);
      registerUser(prodForm.email || prodForm.phone, prodForm.fullName);
    } catch (err) {
      setProducerError(err?.message || 'Erreur');
    } finally {
      setProducerSubmitting(false);
    }
  };

  const submitBuyer = async (e) => {
    e.preventDefault();
    setBuyerError('');

    if (!buyForm.fullName.trim() || !buyForm.businessName.trim() || !buyForm.email.trim()) {
      setBuyerError('Nom, entreprise et email sont obligatoires.');
      return;
    }
    if (!buyForm.productsSought.length) {
      setBuyerError('Veuillez sélectionner au moins un produit recherché.');
      return;
    }

    setBuyerSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/diaspora/buyers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyerPayload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de l\'envoi');
      setBuyerSubmitted(true);
    } catch (err) {
      setBuyerError(err?.message || 'Erreur');
    } finally {
      setBuyerSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <section className="bg-[#1a3c2e] text-white text-center py-16 px-4 -mx-4 mb-10 md:-mx-8 rounded-none">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Partenariat Diaspora &amp; Producteurs
        </h1>
        <p className="text-white/90 max-w-3xl mx-auto text-base md:text-lg">
          La passerelle directe entre les producteurs africains et les acheteurs de la diaspora mondiale
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
            <Package className="w-4 h-4" aria-hidden />
            50+ Produits disponibles
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
            <Globe className="w-4 h-4" aria-hidden />
            Acheteurs USA, Europe &amp; Golfe
          </span>
        </div>
      </section>

      <section className="bg-[#fbf6ea] border border-[#efe6cf] rounded-2xl p-5 md:p-6 mb-10">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl border border-[#e7efe8] shadow-sm overflow-hidden">
            <div className="h-2 bg-[#1a3c2e]" />
            <div className="p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">🌾 Vous êtes Producteur?</h2>
              <p className="text-gray-700 mb-5">
                Inscrivez votre profil, vos produits et volumes. Notre équipe vous met en relation avec des acheteurs qualifiés de
                la diaspora africaine dans le monde entier.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTab('producer');
                  scrollToTabs();
                }}
                className="w-full md:w-auto inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-[#1a3c2e] text-white font-semibold hover:bg-[#163326]"
              >
                Créer mon profil producteur
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#f3ead0] shadow-sm overflow-hidden">
            <div className="h-2 bg-[#c7a44b]" />
            <div className="p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">🌍 Vous êtes Acheteur Diaspora?</h2>
              <p className="text-gray-700 mb-5">
                Trouvez des producteurs africains vérifiés pour approvisionner votre restaurant, épicerie ou entreprise d&apos;import.
                Produits certifiés, traçables, livrables.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTab('buyer');
                  scrollToTabs();
                }}
                className="w-full md:w-auto inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-[#c7a44b] text-gray-900 font-semibold hover:bg-[#b99743]"
              >
                Créer mon profil acheteur
              </button>
            </div>
          </div>
        </div>
      </section>

      <div ref={tabsRef} />

      <div className="flex justify-center border-b border-gray-200 mb-8 gap-0">
        <button
          type="button"
          onClick={() => setTab('producer')}
          className={[
            'px-4 py-3 font-semibold border-b-2 -mb-px flex items-center gap-2',
            tab === 'producer' ? 'border-green-700 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800',
          ].join(' ')}
        >
          <Leaf className="w-4 h-4" aria-hidden />
          Je suis Producteur
        </button>
        <button
          type="button"
          onClick={() => setTab('buyer')}
          className={[
            'px-4 py-3 font-semibold border-b-2 -mb-px flex items-center gap-2',
            tab === 'buyer' ? 'border-green-700 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800',
          ].join(' ')}
        >
          <Globe className="w-4 h-4" aria-hidden />
          Je suis Acheteur Diaspora
        </button>
        <button
          type="button"
          onClick={() => setTab('matching')}
          className={[
            'px-4 py-3 font-semibold border-b-2 -mb-px flex items-center gap-2',
            tab === 'matching' ? 'border-green-700 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800',
          ].join(' ')}
        >
          <Users className="w-4 h-4" aria-hidden />
          Producteurs Disponibles ({activeCount})
        </button>
      </div>

      {tab === 'producer' && (
        <div className="space-y-6">
          <HowItWorks
            steps={[
              { title: 'Créez votre profil', desc: 'Remplissez vos informations et produits disponibles' },
              { title: 'Vérification', desc: 'Notre équipe vérifie votre profil sous 48h' },
              { title: 'Mise en relation', desc: 'Nous vous connectons avec des acheteurs qualifiés' },
              { title: 'Négociation & Vente', desc: 'Négociez directement et finalisez vos contrats' },
            ]}
          />

          {!producerSubmitted ? (
            <form onSubmit={submitProducer} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
              {producerError ? <p className="text-sm text-red-700 mb-4">{producerError}</p> : null}

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <Field label="Nom complet *">
                    <input
                      value={prodForm.fullName}
                      onChange={(e) => setProdForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Nom de la coopérative">
                    <input
                      value={prodForm.cooperativeName}
                      onChange={(e) => setProdForm((p) => ({ ...p, cooperativeName: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Pays *">
                    <LocationSelector
                      value={{ country: prodForm.country, region: prodForm.region }}
                      onChange={({ country, region }) => setProdForm((p) => ({ ...p, country, region }))}
                      required
                      showDetectedBanner={true}
                    />
                  </Field>

                  <Field label="Téléphone *">
                    <input
                      value={prodForm.phone}
                      onChange={(e) => setProdForm((p) => ({ ...p, phone: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Numéro WhatsApp">
                    <input
                      value={prodForm.whatsapp}
                      onChange={(e) => setProdForm((p) => ({ ...p, whatsapp: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={prodForm.email}
                      onChange={(e) => setProdForm((p) => ({ ...p, email: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-2">Produits disponibles *</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRODUCT_OPTIONS.map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-2 text-sm border rounded-lg px-2 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          <input type="checkbox" checked={prodForm.products.includes(p)} onChange={() => toggleArray(setProdForm, 'products', p)} />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Field label="Volume mensuel (kg)">
                    <input
                      type="number"
                      min="0"
                      value={prodForm.monthlyVolumeKg}
                      onChange={(e) => setProdForm((p) => ({ ...p, monthlyVolumeKg: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Certification">
                    <select
                      value={prodForm.certification}
                      onChange={(e) => setProdForm((p) => ({ ...p, certification: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      {PRODUCER_CERTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Expérience export">
                    <select
                      value={prodForm.exportExperience}
                      onChange={(e) => setProdForm((p) => ({ ...p, exportExperience: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="none">Aucune</option>
                      <option value="local">Local seulement</option>
                      <option value="regional">Régional</option>
                      <option value="international">International</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#e9d7a7] bg-[#fff7df] p-4 text-sm text-gray-800">
                <p className="font-semibold mb-1">📋 Après votre inscription:</p>
                <p>
                  Notre équipe examine votre profil sous 48h → Vous recevez une confirmation par SMS/email → Nous vous présentons des acheteurs
                  compatibles → Vous négociez directement avec eux
                </p>
              </div>

              <button
                type="submit"
                disabled={producerSubmitting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a3c2e] text-white font-semibold px-5 py-3 hover:bg-[#163326] disabled:opacity-60"
              >
                {producerSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Soumettre mon profil producteur →
              </button>
            </form>
          ) : (
            <SuccessCard
              title="Profil soumis avec succès !"
              subtitle="Voici ce qui se passe maintenant:"
              steps={[
                'Dans les 48 heures — Notre équipe examine votre profil et vous contacte pour vérification',
                'Vérification — Un appel rapide pour confirmer vos informations et capacités de production',
                'Activation — Votre profil devient visible aux acheteurs diaspora qualifiés',
                'Mise en relation — Vous recevez des introductions directes avec des acheteurs compatibles',
              ]}
              footer={
                <a href="/contact" className="text-sm font-semibold text-green-800 hover:underline">
                  Questions? Contactez-nous via la page Contact
                </a>
              }
              accountDeletion={{
                to: '/delete-account?type=diaspora_producer',
                label: isFr ? 'Demander la suppression de mon profil diaspora producteur' : 'Request diaspora producer profile deletion',
              }}
            />
          )}
        </div>
      )}

      {tab === 'buyer' && (
        <div className="space-y-6">
          <HowItWorks
            steps={[
              { title: 'Décrivez vos besoins', desc: 'Produits, volumes, fréquence' },
              { title: 'Matching', desc: 'Notre algorithme identifie les producteurs compatibles' },
              { title: 'Introduction', desc: 'Nous facilitons la mise en contact sous 72h' },
              { title: 'Approvisionnement', desc: 'Négociez et approvisionnez directement' },
            ]}
          />

          {!buyerSubmitted ? (
            <form onSubmit={submitBuyer} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
              {buyerError ? <p className="text-sm text-red-700 mb-4">{buyerError}</p> : null}

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <Field label="Nom complet *">
                    <input
                      value={buyForm.fullName}
                      onChange={(e) => setBuyForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Nom de l'entreprise *">
                    <input
                      value={buyForm.businessName}
                      onChange={(e) => setBuyForm((p) => ({ ...p, businessName: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Type d'entreprise">
                    <select
                      value={buyForm.businessType}
                      onChange={(e) => setBuyForm((p) => ({ ...p, businessType: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Ville / État (USA) ou Pays si hors USA">
                    <input
                      value={buyForm.cityState}
                      onChange={(e) => setBuyForm((p) => ({ ...p, cityState: e.target.value }))}
                      placeholder="Ex. New York, NY ou Paris, France"
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Pays / Région">
                    <LocationSelector
                      value={{ country: buyForm.country, region: buyForm.region }}
                      onChange={({ country, region }) => setBuyForm((p) => ({ ...p, country, region }))}
                      required={false}
                      showDetectedBanner={true}
                    />
                  </Field>

                  <Field label="Email *">
                    <input
                      type="email"
                      value={buyForm.email}
                      onChange={(e) => setBuyForm((p) => ({ ...p, email: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Téléphone">
                    <input
                      value={buyForm.phone}
                      onChange={(e) => setBuyForm((p) => ({ ...p, phone: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="WhatsApp">
                    <input
                      value={buyForm.whatsapp}
                      onChange={(e) => setBuyForm((p) => ({ ...p, whatsapp: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-2">Produits recherchés *</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRODUCT_OPTIONS.map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-2 text-sm border rounded-lg px-2 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={buyForm.productsSought.includes(p)}
                            onChange={() => toggleArray(setBuyForm, 'productsSought', p)}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Field label="Volume mensuel nécessaire (kg)">
                    <input
                      type="number"
                      min="0"
                      value={buyForm.monthlyVolumeNeededKg}
                      onChange={(e) => setBuyForm((p) => ({ ...p, monthlyVolumeNeededKg: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </Field>

                  <Field label="Certification requise">
                    <select
                      value={buyForm.certificationRequired}
                      onChange={(e) => setBuyForm((p) => ({ ...p, certificationRequired: e.target.value }))}
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      {BUYER_CERTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <label className="flex items-start gap-3 text-sm text-gray-800 border rounded-lg px-3 py-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buyForm.importExperience}
                      onChange={(e) => setBuyForm((p) => ({ ...p, importExperience: e.target.checked }))}
                      className="mt-1"
                    />
                    <span className="font-semibold">J'ai déjà importé des produits africains</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#e9d7a7] bg-[#fff7df] p-4 text-sm text-gray-800">
                <p className="font-semibold mb-1">🤝 Après votre inscription:</p>
                <p>
                  Vous recevez une confirmation par email sous 24h → Notre équipe identifie les producteurs compatibles → Vous êtes mis en relation
                  avec 2-3 producteurs vérifiés → Vous négociez directement les termes et la logistique
                </p>
              </div>

              <button
                type="submit"
                disabled={buyerSubmitting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#c7a44b] text-gray-900 font-semibold px-5 py-3 hover:bg-[#b99743] disabled:opacity-60"
              >
                {buyerSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Trouver mes producteurs africains →
              </button>
            </form>
          ) : (
            <SuccessCard
              title="Demande reçue !"
              subtitle="Prochaines étapes:"
              steps={[
                'Confirmation — Vous recevez un email de confirmation dans les 24 heures',
                'Recherche — Notre équipe identifie les producteurs africains compatibles avec vos besoins',
                'Introduction — Vous êtes mis en relation avec 2 à 3 producteurs vérifiés sous 72 heures',
                'Négociation — Vous discutez directement des prix, volumes et conditions de livraison',
              ]}
              footer={
                <button
                  type="button"
                  onClick={() => setTab('matching')}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black"
                >
                  Vous pouvez aussi parcourir les producteurs disponibles dès maintenant
                </button>
              }
              accountDeletion={{
                to: '/delete-account?type=diaspora_buyer',
                label: isFr ? 'Demander la suppression de mon profil diaspora acheteur' : 'Request diaspora buyer profile deletion',
              }}
            />
          )}
        </div>
      )}

      {tab === 'matching' && (
        <div className="space-y-6">
          {loadingActive ? (
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 rounded-full w-14" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-10 bg-gray-200 rounded-lg w-full mt-4" />
                </div>
              ))}
            </div>
          ) : activeErr ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {activeErr}
            </div>
          ) : activeProducers.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-800">
              <p className="font-bold mb-1">Profils en cours de vérification</p>
              <p className="text-sm text-gray-600">
                Revenez dans 48h ou inscrivez-vous pour être notifié dès qu&apos;un producteur est disponible.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {activeProducers.map((p) => (
                <article key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-extrabold text-gray-900">{p.fullName}</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-800 border border-green-100">
                      {p.country}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{p.cooperativeName || '—'}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(p.products || []).map((pr) => (
                      <span key={pr} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                        {pr}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-700 space-y-1 mb-4">
                    <p className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-700" aria-hidden />
                      {p.monthlyVolumeKg ? `${p.monthlyVolumeKg} kg/mois` : 'Volume à préciser'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Certification : <span className="font-semibold text-gray-700">{p.certification || '—'}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setContactProducer(p)}
                    className="mt-auto w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#1a3c2e] text-white font-semibold hover:bg-[#163326]"
                  >
                    Contacter ce producteur
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {contactProducer ? (
        <ContactProducerModal producer={contactProducer} onClose={() => setContactProducer(null)} />
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function HowItWorks({ steps }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((s, idx) => (
          <div key={s.title} className="flex md:block gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-green-700 text-white font-extrabold flex items-center justify-center">
              {idx + 1}
            </div>
            <div>
              <p className="font-extrabold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessCard({ title, subtitle, steps, footer, accountDeletion }) {
  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6 md:p-8">
      <div className="flex items-start gap-4">
        <CheckCircle2 className="w-10 h-10 text-green-700" aria-hidden />
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold text-gray-900">{title}</h3>
          <p className="text-gray-700 font-semibold mt-1">{subtitle}</p>
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm text-gray-700">
            <span className="shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-800 border border-green-100 font-extrabold flex items-center justify-center">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {footer ? <div className="mt-6">{footer}</div> : null}
      {accountDeletion?.to ? (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link
            to={accountDeletion.to}
            className="inline-flex items-center gap-2 text-xs text-red-500 hover:text-red-700 hover:underline transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {accountDeletion.label ||
              (/^fr\b/i.test(String(navigator.language || '').toLowerCase())
                ? 'Supprimer mon compte'
                : 'Delete my account')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ContactProducerModal({ producer, onClose }) {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!contactName.trim() || !contactPhone.trim()) {
      setErr('Nom et téléphone requis.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/diaspora/contact/${producer._id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim(),
          message: message.trim() || undefined,
          producerId: producer._id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de l\'envoi');
      setSent(true);
    } catch (e2) {
      setErr(e2?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-extrabold text-gray-900">Contacter {producer.fullName}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!sent ? (
          <form onSubmit={submit} className="p-5 space-y-4">
            {err ? <p className="text-sm text-red-700">{err}</p> : null}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Votre nom *</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" aria-hidden />
                Téléphone *
              </label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" aria-hidden />
                Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Décrivez votre besoin (produits, volumes, fréquence, pays de livraison...)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a3c2e] text-white font-semibold px-5 py-3 hover:bg-[#163326] disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
              Envoyer
            </button>
          </form>
        ) : (
          <div className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-700" aria-hidden />
              <div>
                <p className="text-lg font-extrabold text-gray-900">Message envoyé</p>
                <p className="text-sm text-gray-600">Notre équipe revient vers vous rapidement pour faciliter la mise en relation.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
