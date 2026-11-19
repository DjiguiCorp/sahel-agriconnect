import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function InvestorVerifyEmail() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, ok: false, err: '' });

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState({ loading: false, ok: false, err: isFr ? 'Lien invalide' : 'Invalid link' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `${API}/api/investors/verify-email?token=${encodeURIComponent(token)}`
        );
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok || !d.success) {
          setState({
            loading: false,
            ok: false,
            err: d.error || (isFr ? 'Lien expiré ou invalide' : 'Expired or invalid link'),
          });
          return;
        }
        setState({ loading: false, ok: true, err: '' });
        setTimeout(() => {
          navigate('/afri-yield/portal?verified=true', { replace: true });
        }, 1200);
      } catch (e) {
        if (!cancelled) {
          setState({ loading: false, ok: false, err: e.message || 'Error' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, isFr]);

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(180deg, #0d1f17 0%, #0b1f12 100%)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl border p-8 text-center"
        style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' }}
      >
        {state.loading ? (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-[#B5850A] mx-auto mb-4" />
            <p className="text-white font-semibold">
              {isFr ? 'Vérification de votre email…' : 'Verifying your email…'}
            </p>
          </>
        ) : state.ok ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-white font-bold text-xl mb-2">
              {isFr ? 'Email vérifié' : 'Email verified'}
            </h1>
            <p className="text-white/55 text-sm mb-4">
              {isFr ? 'Redirection vers le portail…' : 'Redirecting to the portal…'}
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-white font-bold text-xl mb-2">
              {isFr ? 'Échec de la vérification' : 'Verification failed'}
            </h1>
            <p className="text-red-300 text-sm mb-6">{state.err}</p>
            <Link
              to="/afri-yield/portal"
              className="inline-flex px-5 py-3 rounded-xl font-bold text-sm text-black"
              style={{ background: '#B5850A' }}
            >
              {isFr ? 'Aller au portail' : 'Go to portal'}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
