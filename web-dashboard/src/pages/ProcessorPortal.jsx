import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = 'processor_token';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ProcessorPortal() {
  const { i18n } = useTranslation();
  const isFr = String(i18n.language || '').toLowerCase().startsWith('fr');

  const [step, setStep] = useState('email'); // email | code | portal
  const [email, setEmail] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [portal, setPortal] = useState(null);

  const me = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const r = await fetch(`${API_ENDPOINTS.PROCESSORS.BASE}/my-portal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed');
        setPortal(d);
        setStep('portal');
      } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setPortal(null);
        setStep('email');
        setError(isFr ? 'Session expirée. Reconnectez-vous.' : 'Session expired. Please sign in again.');
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_ENDPOINTS.VERIFY.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email,
          role: 'processor',
          lang: isFr ? 'fr' : 'en',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setVerificationId(d.verificationId);
      setStep('code');
    } catch (e2) {
      setError(e2.message);
    }
    setLoading(false);
  };

  const confirmCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_ENDPOINTS.VERIFY.CONFIRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email,
          code,
          role: 'processor',
          verificationId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      if (!d.token) throw new Error(isFr ? 'Compte non activé.' : 'Account not active yet.');
      localStorage.setItem(TOKEN_KEY, d.token);
      setToken(d.token);
    } catch (e2) {
      setError(e2.message);
    }
    setLoading(false);
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPortal(null);
    setStep('email');
  };

  if (step === 'portal' && portal) {
    const p = portal?.processor || {};
    return (
      <div className="min-h-screen" style={{ background: '#0b1f12' }}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10" style={{ background: 'rgba(181,133,10,0.12)' }}>
          <div className="flex items-center gap-3">
            <img src="/sahel-logo.png" alt="SA" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <p className="text-white font-bold text-sm">Sahel AgriConnect</p>
              <p className="text-white/60 text-xs">🏭 {isFr ? 'Centre de transformation' : 'Transformation Center'}</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className="text-white/60 hover:text-white text-xs">
            {isFr ? 'Déconnexion' : 'Sign out'}
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <h1 className="text-white font-extrabold text-2xl mb-2">{p.name || me?.name || 'Processor'}</h1>
            <p className="text-white/60 text-sm">
              {p.location || [me?.country, me?.email].filter(Boolean).join(' · ') || '—'}
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              {[
                { label: isFr ? 'Lots actifs' : 'Active lots', value: p.activeLots ?? '—' },
                { label: isFr ? 'Batches certifiés' : 'Certified batches', value: p.certifiedBatches ?? '—' },
                { label: isFr ? 'Capacité' : 'Capacity', value: p.capacity ?? '—' },
              ].map((c) => (
                <div key={c.label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <p className="text-[#B5850A] font-bold text-xl font-mono">{c.value}</p>
                  <p className="text-white/50 text-xs mt-1">{c.label}</p>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-6">
              {isFr
                ? "Portail v1 — l'espace complet (traçabilité, lots, certification) arrive. Pour l’instant, vous pouvez vous connecter sans mot de passe par code."
                : 'Portal v1 — full workspace is coming (traceability, lots, certification). For now, you can sign in passwordless with a code.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(181,133,10,0.25) 0%, transparent 55%), linear-gradient(180deg, #0a1628 0%, #0b1f12 100%)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden ring-2 ring-[#B5850A]/25">
            <img src="/sahel-logo.png" alt="Sahel AgriConnect" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sahel AgriConnect</h1>
          <p className="text-white/50 text-sm mt-1">🏭 {isFr ? 'Centre de transformation' : 'Transformation Center'}</p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl border border-white/15" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(18px)' }}>
          <h2 className="font-bold text-white text-lg mb-5 text-center">
            {isFr ? 'Connexion par code' : 'Sign in with code'}
          </h2>

          {step === 'email' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  {isFr ? 'Email officiel' : 'Official email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-white/15 rounded-xl px-4 py-3 text-sm bg-black/30 text-white placeholder-white/30 focus:outline-none focus:border-[#B5850A]/60"
                />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                style={{ background: '#B5850A' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isFr ? 'Envoi...' : 'Sending...'}
                  </span>
                ) : isFr ? (
                  'Recevoir mon code'
                ) : (
                  'Send me a code'
                )}
              </button>
              <p className="text-white/35 text-xs text-center">
                {isFr ? 'Pas encore activé ? ' : 'Not activated yet? '}
                <Link to="/transformation-registration" className="text-[#B5850A] hover:underline">
                  {isFr ? 'S’inscrire' : 'Register'}
                </Link>
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={confirmCode} className="space-y-4">
              <p className="text-white/50 text-xs text-center">
                {isFr ? 'Code envoyé à ' : 'Code sent to '} <span className="text-white/80 font-semibold">{email}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">{isFr ? 'Code (6 chiffres)' : 'Code (6 digits)'}</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border border-white/15 rounded-xl px-4 py-3 text-sm bg-black/30 text-white placeholder-white/30 focus:outline-none focus:border-[#B5850A]/60 tracking-widest text-center font-mono"
                />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                style={{ background: '#B5850A' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isFr ? 'Vérification...' : 'Verifying...'}
                  </span>
                ) : isFr ? (
                  'Se connecter'
                ) : (
                  'Sign in'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="w-full py-2.5 rounded-xl text-sm border border-white/15 text-white/60 hover:bg-white/5 transition"
              >
                {isFr ? 'Changer email' : 'Change email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

