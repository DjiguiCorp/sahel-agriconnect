import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

export default function JoinCooperative() {
  const { code } = useParams();
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [state, setState] = useState('view'); // 'view' | 'accepting' | 'accepted' | 'declined'
  const [form, setForm] = useState({ farmerName: '', farmerPhone: '', farmerEmail: '' });

  useEffect(() => {
    fetch(`${API}/api/coop-invitations/accept/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvitation(d.invitation);
        else setError(d.error || 'Invalid invitation');
      })
      .catch(() => setError('Connection error'))
      .finally(() => setLoading(false));
  }, [code]);

  const accept = async () => {
    setState('accepting');
    try {
      const r = await fetch(`${API}/api/coop-invitations/accept/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) setState('accepted');
      else setError(d.error || 'Error accepting');
    } catch {
      setError('Connection error');
      setState('view');
    }
  };

  const decline = async () => {
    await fetch(`${API}/api/coop-invitations/decline/${code}`, { method: 'POST' });
    setState('declined');
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3c2e]" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-xl font-bold text-[#1a3c2e] mb-2">{isFr ? 'Invitation invalide' : 'Invalid invitation'}</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/" className="px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#1a3c2e' }}>
            {isFr ? "Retour à l'accueil" : 'Back to home'}
          </Link>
        </div>
      </div>
    );

  if (state === 'accepted')
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a3c2e] mb-2">{isFr ? 'Bienvenue !' : 'Welcome!'}</h2>
          <p className="text-gray-600 mb-6">
            {isFr
              ? `Vous avez rejoint ${invitation?.cooperativeName}. Le responsable vous contactera bientôt.`
              : `You have joined ${invitation?.cooperativeName}. The leader will contact you soon.`}
          </p>
          <Link to="/dashboard" className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#1a3c2e' }}>
            {isFr ? 'Voir le dashboard' : 'View dashboard'}
          </Link>
        </div>
      </div>
    );

  if (state === 'declined')
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">👋</p>
          <h2 className="text-xl font-bold text-[#1a3c2e] mb-2">{isFr ? 'Invitation refusée' : 'Invitation declined'}</h2>
          <p className="text-gray-500 text-sm mb-6">
            {isFr ? 'Vous pouvez toujours rejoindre une coopérative plus tard.' : 'You can always join a cooperative later.'}
          </p>
          <Link to="/cooperatives" className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#1a3c2e' }}>
            {isFr ? 'Voir les coopératives' : 'Browse cooperatives'}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="rounded-3xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}>
        <div className="p-8 text-center">
          <p className="text-[#B5850A] text-xs font-bold uppercase tracking-widest mb-3">
            {isFr ? 'Invitation coopérative' : 'Cooperative Invitation'}
          </p>
          <h1 className="text-2xl font-bold text-white mb-2">{invitation?.cooperativeName}</h1>
          <p className="text-white/60 text-sm">
            🌍 {invitation?.cooperativeCountry} · {isFr ? 'Responsable:' : 'Leader:'} {invitation?.cooperativeLeader}
          </p>
          {invitation?.message && (
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <p className="text-white/80 text-sm italic">\"{invitation.message}\"</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-[#1a3c2e] text-lg mb-4">
          {isFr ? 'Confirmez votre identité pour rejoindre' : 'Confirm your identity to join'}
        </h2>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Votre nom complet' : 'Your full name'} *</label>
            <input
              value={form.farmerName}
              onChange={(e) => setForm((f) => ({ ...f, farmerName: e.target.value }))}
              required
              placeholder={invitation?.inviteeName || ''}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Téléphone (WhatsApp)' : 'Phone (WhatsApp)'} *</label>
            <input
              value={form.farmerPhone}
              onChange={(e) => setForm((f) => ({ ...f, farmerPhone: e.target.value }))}
              required
              placeholder="+223 76 12 34 56"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Email (optionnel)' : 'Email (optional)'}</label>
            <input
              type="email"
              value={form.farmerEmail}
              onChange={(e) => setForm((f) => ({ ...f, farmerEmail: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg mb-3">{error}</p>}

        <p className="text-xs text-gray-400 mb-4">
          {isFr
            ? `En acceptant, vous rejoignez officiellement ${invitation?.cooperativeName} sur Sahel AgriConnect. Vous serez contacté par le responsable pour les prochaines étapes.`
            : `By accepting, you officially join ${invitation?.cooperativeName} on Sahel AgriConnect. The leader will contact you for next steps.`}
        </p>

        <div className="flex gap-3">
          <button
            onClick={accept}
            disabled={!form.farmerName || !form.farmerPhone || state === 'accepting'}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
            style={{ background: '#1a3c2e' }}
          >
            {state === 'accepting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isFr ? 'Rejoindre la coopérative' : 'Join the cooperative'}
          </button>
          <button
            onClick={decline}
            className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
          >
            {isFr ? 'Refuser' : 'Decline'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          {isFr
            ? `Invitation expire le: ${invitation?.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : '—'}`
            : `Expires: ${invitation?.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : '—'}`}
        </p>
      </div>
    </div>
  );
}

