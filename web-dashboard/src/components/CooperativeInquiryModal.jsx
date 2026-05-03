import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function CooperativeInquiryModal({ cooperative, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Le nom et le téléphone sont obligatoires.');
      return;
    }
    if (!isSupabaseConfigured() || !supabase) {
      setError(
        'Service indisponible : configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local.'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.from('cooperative_inquiries').insert({
        cooperative_id: cooperative.id,
        cooperative_name: cooperative.name,
        applicant_name: name.trim(),
        phone: phone.trim(),
        message: message.trim() || null,
      });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Impossible d’envoyer la demande. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  if (!cooperative) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="inquiry-title" className="text-lg font-semibold text-brand-forest">
            Demander à rejoindre
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-4">
              Votre demande a été enregistrée pour <strong>{cooperative.name}</strong>. Vous serez recontacté(e).
            </p>
            <button type="button" onClick={onClose} className="btn-primary">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Coopérative : <strong>{cooperative.name}</strong> ({cooperative.region}, {cooperative.country})
            </p>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="inq-name" className="block text-sm font-medium text-gray-700 mb-1">
                Votre nom *
              </label>
              <input
                id="inq-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="inq-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                id="inq-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
                placeholder="+223 …"
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="inq-msg" className="block text-sm font-medium text-gray-700 mb-1">
                Message (optionnel)
              </label>
              <textarea
                id="inq-msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary inline-flex justify-center items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
