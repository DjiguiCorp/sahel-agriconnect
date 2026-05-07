import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { Globe, Loader2, Mail, Phone, Package, X, Building2, User } from 'lucide-react';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';

const PRODUCT_OPTIONS = ['Karité', 'Sésame', 'Cajou', 'Mangue', 'Arachide', 'Coton', 'Mil', 'Sorgho', 'Niébé', 'Riz'];
const CERTS = ['Aucune', 'Bio local', 'Conventionnel', 'Export / FDA (objectif)'];

export default function DiasporaPartnership() {
  const [tab, setTab] = useState('producteur');
  const [producers, setProducers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [contactProducer, setContactProducer] = useState(null);

  const [prodForm, setProdForm] = useState({
    full_name: '',
    cooperative_name: '',
    country: 'Mali',
    products: [],
    monthly_volume_kg: '',
    certification: 'Aucune',
    email: '',
    phone: '',
  });
  const [buyForm, setBuyForm] = useState({
    full_name: '',
    business_name: '',
    us_city_state: '',
    products_sought: [],
    monthly_volume_needed_kg: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured() || !supabase) {
        setLoadingList(false);
        return;
      }
      const { data, error } = await supabase.from('diaspora_producers').select('*').order('created_at', { ascending: false });
      if (!cancelled && !error && data) setProducers(data);
      setLoadingList(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleInForm = (setter, key, item) => {
    setter((prev) => ({
      ...prev,
      [key]: prev[key].includes(item) ? prev[key].filter((x) => x !== item) : [...prev[key], item],
    }));
  };

  const submitProducer = async (e) => {
    e.preventDefault();
    setFormMsg('');
    if (!prodForm.full_name.trim() || !prodForm.phone.trim()) {
      setFormMsg('Nom et téléphone sont obligatoires.');
      return;
    }
    if (!isSupabaseConfigured() || !supabase) {
      setFormMsg('Supabase non configuré.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('diaspora_producers').insert({
        full_name: prodForm.full_name.trim(),
        cooperative_name: prodForm.cooperative_name.trim() || '—',
        country: prodForm.country,
        products: prodForm.products.length ? prodForm.products : ['Non précisé'],
        monthly_volume_kg: prodForm.monthly_volume_kg ? Number(prodForm.monthly_volume_kg) : null,
        certification: prodForm.certification,
        email: prodForm.email.trim() || null,
        phone: prodForm.phone.trim(),
      });
      if (error) throw error;
      setFormMsg('Profil producteur enregistré. Merci !');
      const { data } = await supabase.from('diaspora_producers').select('*').order('created_at', { ascending: false });
      if (data) setProducers(data);
    } catch (err) {
      setFormMsg(err.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBuyer = async (e) => {
    e.preventDefault();
    setFormMsg('');
    if (!buyForm.full_name.trim() || !buyForm.phone.trim() || !buyForm.business_name.trim()) {
      setFormMsg('Nom, entreprise et téléphone sont obligatoires.');
      return;
    }
    if (!isSupabaseConfigured() || !supabase) {
      setFormMsg('Supabase non configuré.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('diaspora_buyers').insert({
        full_name: buyForm.full_name.trim(),
        business_name: buyForm.business_name.trim(),
        us_city_state: buyForm.us_city_state.trim() || '—',
        products_sought: buyForm.products_sought.length ? buyForm.products_sought : ['Non précisé'],
        monthly_volume_needed_kg: buyForm.monthly_volume_needed_kg ? Number(buyForm.monthly_volume_needed_kg) : null,
        email: buyForm.email.trim() || null,
        phone: buyForm.phone.trim(),
      });
      if (error) throw error;
      setFormMsg('Profil acheteur enregistré. Nous vous recontacterons.');
    } catch (err) {
      setFormMsg(err.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-brand-forest mb-2 flex items-center justify-center gap-2 flex-wrap">
          <Globe className="w-8 h-8 text-brand-sage" aria-hidden />
          Partenariat diaspora
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Producteurs d&apos;Afrique de l&apos;Ouest et au-delà et acheteurs aux États-Unis : inscrivez-vous et
          explorez les profils disponibles.
        </p>
      </div>

      <div className="flex justify-center border-b mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={() => {
            setTab('producteur');
            setFormMsg('');
          }}
          className={`py-3 px-5 border-b-2 font-medium ${tab === 'producteur' ? 'border-brand-sage text-brand-forest' : 'border-transparent text-gray-500'}`}
        >
          Je suis producteur
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('acheteur');
            setFormMsg('');
          }}
          className={`py-3 px-5 border-b-2 font-medium ${tab === 'acheteur' ? 'border-brand-sage text-brand-forest' : 'border-transparent text-gray-500'}`}
        >
          Je suis acheteur diaspora
        </button>
        <button
          type="button"
          onClick={() => setTab('matching')}
          className={`py-3 px-5 border-b-2 font-medium ${tab === 'matching' ? 'border-brand-sage text-brand-forest' : 'border-transparent text-gray-500'}`}
        >
          Producteurs disponibles ({producers.length})
        </button>
        </div>
      </div>

      {formMsg && (
        <div className="p-4 rounded-lg bg-brand-cream/80 border border-brand-sage/40 text-brand-forest text-sm">
          {formMsg}
        </div>
      )}

      {tab === 'producteur' && (
        <form onSubmit={submitProducer} className="card max-w-2xl space-y-4">
          <h3 className="text-lg font-semibold text-brand-forest flex items-center gap-2">
            <User className="w-5 h-5" aria-hidden />
            Profil producteur
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input
                required
                value={prodForm.full_name}
                onChange={(e) => setProdForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coopérative *</label>
              <input
                required
                value={prodForm.cooperative_name}
                onChange={(e) => setProdForm((p) => ({ ...p, cooperative_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
            <select
              value={prodForm.country}
              onChange={(e) => setProdForm((p) => ({ ...p, country: e.target.value }))}
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
            <p className="text-sm font-medium text-gray-700 mb-2">Produits disponibles *</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_OPTIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.products.includes(p)}
                    onChange={() => toggleInForm(setProdForm, 'products', p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume mensuel (kg)</label>
              <input
                type="number"
                min="0"
                value={prodForm.monthly_volume_kg}
                onChange={(e) => setProdForm((p) => ({ ...p, monthly_volume_kg: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certification</label>
              <select
                value={prodForm.certification}
                onChange={(e) => setProdForm((p) => ({ ...p, certification: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              >
                {CERTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={prodForm.email}
                onChange={(e) => setProdForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
              <input
                required
                value={prodForm.phone}
                onChange={(e) => setProdForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
            Enregistrer mon profil producteur
          </button>
        </form>
      )}

      {tab === 'acheteur' && (
        <form onSubmit={submitBuyer} className="card max-w-2xl space-y-4">
          <h3 className="text-lg font-semibold text-brand-forest flex items-center gap-2">
            <Building2 className="w-5 h-5" aria-hidden />
            Profil acheteur (USA)
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                required
                value={buyForm.full_name}
                onChange={(e) => setBuyForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
              <input
                required
                value={buyForm.business_name}
                onChange={(e) => setBuyForm((p) => ({ ...p, business_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville / État (USA) *</label>
            <input
              required
              value={buyForm.us_city_state}
              onChange={(e) => setBuyForm((p) => ({ ...p, us_city_state: e.target.value }))}
              placeholder="Ex. New York, NY"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Produits recherchés *</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_OPTIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buyForm.products_sought.includes(p)}
                    onChange={() => toggleInForm(setBuyForm, 'products_sought', p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume mensuel souhaité (kg)</label>
              <input
                type="number"
                min="0"
                value={buyForm.monthly_volume_needed_kg}
                onChange={(e) => setBuyForm((p) => ({ ...p, monthly_volume_needed_kg: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={buyForm.email}
                onChange={(e) => setBuyForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
              <input
                required
                value={buyForm.phone}
                onChange={(e) => setBuyForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
            Enregistrer mon profil acheteur
          </button>
        </form>
      )}

      {tab === 'matching' && (
        <div className="space-y-6">
          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-brand-sage" aria-hidden />
            </div>
          ) : producers.length === 0 ? (
            <p className="text-gray-600">Aucun producteur enregistré pour le moment. Revenez après avoir ajouté des profils.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {producers.map((p) => (
                <article key={p.id} className="card border border-gray-100 flex flex-col">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg font-bold text-brand-forest">{p.full_name}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-brand-iconBg text-brand-forest">
                      {p.country}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{p.cooperative_name}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(p.products || []).map((pr) => (
                      <span key={pr} className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                        {pr}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                    <Package className="w-4 h-4 text-brand-sage" aria-hidden />
                    {p.monthly_volume_kg ? `${p.monthly_volume_kg} kg/mois` : 'Volume à préciser'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Certification : {p.certification || '—'}</p>
                  <button type="button" onClick={() => setContactProducer(p)} className="mt-auto btn-primary w-full">
                    Contacter ce producteur
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {contactProducer && (
        <ContactProducerModal
          producer={contactProducer}
          onClose={() => setContactProducer(null)}
          onSent={() => captureEvent(AnalyticsEvents.DIASPORA_INQUIRY_SENT, { producer_id: contactProducer.id })}
        />
      )}
    </div>
  );
}

function ContactProducerModal({ producer, onClose, onSent }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!name.trim() || !phone.trim()) {
      setErr('Nom et téléphone requis.');
      return;
    }
    if (!isSupabaseConfigured() || !supabase) {
      setErr('Service indisponible.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('diaspora_contact_inquiries').insert({
        producer_id: producer.id,
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        contact_email: email.trim() || null,
        message: message.trim() || null,
      });
      if (error) throw error;
      onSent();
      onClose();
    } catch (e) {
      setErr(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-brand-forest">Contacter {producer.full_name}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {err && <p className="text-sm text-red-700">{err}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Votre nom *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Phone className="w-4 h-4" aria-hidden />
              Téléphone *
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4" aria-hidden />
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary inline-flex justify-center items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
