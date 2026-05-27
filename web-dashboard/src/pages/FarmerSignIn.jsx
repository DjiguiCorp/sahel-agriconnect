import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function FarmerSignIn() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hero = useMemo(
    () => ({
      title: isFr ? 'Connexion agriculteur' : 'Farmer sign in',
      subtitle: isFr
        ? 'Recevez un code par email (lien magique ou saisie du code).'
        : 'Get a code by email (magic link or enter the code).',
      badge: isFr ? '🌾 Portail agriculteur' : '🌾 Farmer portal',
    }),
    [isFr],
  );

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
          email: email.trim().toLowerCase(),
          role: 'farmer',
          lang: isFr ? 'fr' : 'en',
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setVerificationId(d.verificationId || '');
      setStep('code');
    } catch (e2) {
      setError(e2.message || 'Failed');
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
          email: email.trim().toLowerCase(),
          code,
          role: 'farmer',
          verificationId,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      if (!d.token) throw new Error(isFr ? 'Compte non activé.' : 'Account not active yet.');

      localStorage.setItem('auth_token_farmer', d.token);
      localStorage.setItem('auth_role', 'farmer');
      if (d.user?.email) localStorage.setItem('sac_user_email', d.user.email);
      if (d.user?.name) localStorage.setItem('sac_user_name', d.user.name);
      window.dispatchEvent(new Event('sac_user_updated'));
      window.dispatchEvent(new Event('web_session_updated'));
      navigate('/my-dashboard', { replace: true });
    } catch (e2) {
      setError(e2.message || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(76,175,80,0.25) 0%, transparent 55%), linear-gradient(180deg, #0a1628 0%, #0b1f12 100%)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden ring-2 ring-[#4CAF50]/25">
            <img src="/sahel-logo.png" alt="Sahel AgriConnect" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sahel AgriConnect</h1>
          <p className="text-white/50 text-sm mt-1">{hero.badge}</p>
          <p className="text-white/40 text-xs mt-2">{hero.subtitle}</p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl border border-white/15" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(18px)' }}>
          <h2 className="font-bold text-white text-lg mb-5 text-center">{hero.title}</h2>

          {step === 'email' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  {isFr ? 'Email' : 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-white/15 rounded-xl px-4 py-3 text-sm bg-black/30 text-white placeholder-white/30 focus:outline-none focus:border-[#4CAF50]/60"
                  placeholder={isFr ? 'votre@email.com' : 'you@email.com'}
                />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                style={{ background: '#4CAF50' }}
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
                {isFr ? 'Nouveau ? ' : 'New here? '}
                <Link to="/inscription" className="text-[#4CAF50] hover:underline">
                  {isFr ? "S'inscrire" : 'Register'}
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
                  className="w-full border border-white/15 rounded-xl px-4 py-3 text-sm bg-black/30 text-white placeholder-white/30 focus:outline-none focus:border-[#4CAF50]/60 tracking-widest text-center font-mono"
                />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                style={{ background: '#4CAF50' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isFr ? 'Connexion...' : 'Signing in...'}
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
                className="w-full text-xs text-white/45 hover:text-white/70"
              >
                {isFr ? '← Changer d’email' : '← Change email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

