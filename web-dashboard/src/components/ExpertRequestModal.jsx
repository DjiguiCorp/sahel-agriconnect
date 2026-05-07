import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Lock } from 'lucide-react';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { API_ENDPOINTS } from '../config/api';

const defaultPrefill = {};

export default function ExpertRequestModal({ isOpen, onClose, prefillData = defaultPrefill }) {
  const [farmerName, setFarmerName] = useState('');
  const [farmerEmail, setFarmerEmail] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [country, setCountry] = useState('Mali');
  const [region, setRegion] = useState('');
  const [cropType, setCropType] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [diseaseDetected, setDiseaseDetected] = useState('');
  const [cooperativeMember, setCooperativeMember] = useState(false);
  const [cooperativeName, setCooperativeName] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('email');
  const [urgency, setUrgency] = useState('within_week');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const p = prefillData || {};
    setFarmerName('');
    setFarmerEmail('');
    setFarmerPhone('');
    setCountry('Mali');
    setRegion('');
    setCropType(p.cropType ?? '');
    setProblemDescription(p.problemDescription ?? '');
    setDiseaseDetected(p.diseaseDetected ?? '');
    setCooperativeMember(false);
    setCooperativeName('');
    setPreferredContactMethod('email');
    setUrgency(
      ['immediate', 'within_week', 'seasonal'].includes(p.urgency) ? p.urgency : 'within_week'
    );
    setError('');
    setSuccess(null);
    setSubmitting(false);
  }, [isOpen, prefillData]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch(API_ENDPOINTS.EXPERTS.REQUEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName,
          farmerEmail,
          farmerPhone,
          country,
          region,
          cropType,
          problemDescription,
          diseaseDetected,
          cooperativeMember,
          cooperativeName: cooperativeMember ? cooperativeName : undefined,
          preferredContactMethod,
          urgency,
          source: prefillData?.source || 'direct',
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      const wasMemberSubmit = cooperativeMember;
      setSuccess({
        submittedAsMember: wasMemberSubmit,
        cooperativeNote: j.cooperativeNote || null,
      });
    } catch (err) {
      setError(err.message || 'Envoi impossible');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackdropClick(ev) {
    if (ev.target === ev.currentTarget) onClose();
  }

  return (
    <div
      role="presentation"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-0 sm:p-4"
    >
      <div className="flex h-full w-full max-h-full flex-col border-t-4 border-amber-500/90 shadow-2xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-brand-forest/20 lg:max-w-xl bg-gradient-to-b from-stone-50 to-white">
        <header className="relative flex-shrink-0 border-b border-brand-forest/15 bg-brand-forest px-4 py-4 text-white sm:rounded-t-xl">
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="pr-10 text-xl font-bold">Consulter un Expert Agricole</h2>
          <p className="mt-1 text-sm text-white/90">
            Un spécialiste lié à votre coopérative vous contactera sous 48h
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cooperativeMember ? (
            <div className="mb-4 rounded-xl border border-emerald-600/40 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              ✓ En tant que membre coopératif, vous avez accès prioritaire aux experts
            </div>
          ) : (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/70 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">
                Les membres de coopératives ont accès prioritaire.{' '}
                <Link to="/cooperative-registration" className="font-semibold underline">
                  Rejoindre une coopérative →
                </Link>
              </span>
            </div>
          )}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-gray-800">
              <p className="text-lg font-bold text-brand-forest">✓ Demande envoyée avec succès</p>
              <p className="mt-2 text-sm">
                Un expert lié à votre coopérative vous contactera dans les 48 heures.
              </p>
              {!success.submittedAsMember && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-white px-4 py-3 text-left text-sm">
                  <p className="font-medium text-gray-900">💡 Rejoignez une coopérative pour un accès prioritaire aux experts</p>
                  {success.cooperativeNote && (
                    <p className="mt-2 text-xs text-gray-600">{success.cooperativeNote}</p>
                  )}
                  <Link
                    to="/cooperative-registration"
                    className="mt-3 inline-flex rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white"
                  >
                    Rejoindre une coopérative
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-xl bg-brand-forest py-3 text-sm font-semibold text-white"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Nom complet *</span>
                <input
                  required
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Email *</span>
                <input
                  type="email"
                  required
                  value={farmerEmail}
                  onChange={(e) => setFarmerEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Téléphone / WhatsApp</span>
                <input
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Pays</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Région / Ville</span>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Type de culture</span>
                <input
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-forest">Description du problème *</span>
                <textarea
                  required
                  rows={4}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              {diseaseDetected ? (
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-brand-forest">Diagnostic IA détecté</span>
                  <input
                    readOnly
                    value={diseaseDetected}
                    className="w-full cursor-not-allowed rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-stone-700"
                  />
                </label>
              ) : null}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                <input
                  type="checkbox"
                  checked={cooperativeMember}
                  onChange={(e) => setCooperativeMember(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-forest focus:ring-amber-500"
                />
                <span className="text-sm text-stone-800">Je suis membre d&apos;une coopérative</span>
              </label>
              {cooperativeMember && (
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-brand-forest">Nom de la coopérative</span>
                  <input
                    value={cooperativeName}
                    onChange={(e) => setCooperativeName(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </label>
              )}

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-brand-forest">
                  Moyen de contact préféré
                </legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pref-contact"
                    checked={preferredContactMethod === 'email'}
                    onChange={() => setPreferredContactMethod('email')}
                  />
                  <span className="text-sm">Email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pref-contact"
                    checked={preferredContactMethod === 'phone'}
                    onChange={() => setPreferredContactMethod('phone')}
                  />
                  <span className="text-sm">Téléphone</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pref-contact"
                    checked={preferredContactMethod === 'whatsapp'}
                    onChange={() => setPreferredContactMethod('whatsapp')}
                  />
                  <span className="text-sm">WhatsApp</span>
                </label>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-brand-forest">Urgence</legend>
                <label className="flex items-center gap-2">
                  <input type="radio" name="urgency" checked={urgency === 'immediate'} onChange={() => setUrgency('immediate')} />
                  <span className="text-sm">Immédiat</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="urgency" checked={urgency === 'within_week'} onChange={() => setUrgency('within_week')} />
                  <span className="text-sm">Cette semaine</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="urgency" checked={urgency === 'seasonal'} onChange={() => setUrgency('seasonal')} />
                  <span className="text-sm">Cette saison</span>
                </label>
              </fieldset>

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-brand-forest to-brand-forest/90 py-3.5 text-sm font-bold text-white shadow-md ring-1 ring-amber-500/30 hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
