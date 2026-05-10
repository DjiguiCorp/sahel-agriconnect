import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const apiRoot = API_BASE_URL.replace(/\/$/, '');

export default function CooperativeInquiryModal({ cooperative, onClose }) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const coopName =
    cooperative.cooperativeName || cooperative.nomCooperative || cooperative.nom || cooperative.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError(isFr ? 'Le nom et le téléphone sont obligatoires.' : 'Name and phone are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiRoot}/api/cooperatives/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cooperativeId: cooperative._id || cooperative.id,
          cooperativeName: coopName,
          applicantName: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          message: form.message.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setDone(true);
    } catch {
      setError(
        isFr
          ? "Impossible d'envoyer la demande. Réessayez plus tard."
          : 'Unable to send request. Please try again later.'
      );
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div
          className="px-6 py-5 border-b border-gray-100 flex items-start justify-between"
          style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
        >
          <div>
            <p className="text-[#B5850A] text-xs font-bold uppercase tracking-widest mb-1">
              {isFr ? "Demande d'adhésion" : 'Membership Request'}
            </p>
            <h2 className="text-white font-bold text-xl leading-snug">{coopName}</h2>
            <p className="text-white/60 text-sm mt-0.5">
              {cooperative.country || cooperative.pays} ·{' '}
              {cooperative.regionCity || cooperative.region || ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/60 hover:text-white transition mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1a3c2e] mb-2">
                {isFr ? 'Demande envoyée!' : 'Request sent!'}
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                {isFr
                  ? `Le responsable de ${coopName} vous contactera dans les 48 heures.`
                  : `The ${coopName} leader will contact you within 48 hours.`}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: '#1a3c2e' }}
              >
                {isFr ? 'Fermer' : 'Close'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-500 text-sm">
                {isFr
                  ? 'Remplissez ce formulaire. Le responsable de la coopérative vous contactera directement.'
                  : 'Fill this form. The cooperative leader will contact you directly.'}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Votre nom complet' : 'Your full name'} *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isFr ? 'Ex: Amadou Coulibaly' : 'Ex: Amadou Coulibaly'}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Téléphone (WhatsApp de préférence)' : 'Phone (WhatsApp preferred)'} *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+223 76 12 34 56"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Email (optionnel)' : 'Email (optional)'}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Message (optionnel)' : 'Message (optional)'}
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={
                    isFr
                      ? 'Parlez-nous de votre exploitation, vos cultures, vos besoins...'
                      : 'Tell us about your farm, crops, needs...'
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 hover:opacity-90 transition"
                style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? isFr
                    ? 'Envoi...'
                    : 'Sending...'
                  : isFr
                    ? 'Envoyer ma demande'
                    : 'Send my request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
