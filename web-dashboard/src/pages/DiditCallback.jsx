import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL.replace(/\/$/, '');
const MAX_ATTEMPTS = 10;
const POLL_MS = 3000;

/**
 * Didit redirect target: /verify/callback
 * Polls KYC status until approved / declined or max attempts.
 */
export default function DiditCallback() {
  const { i18n } = useTranslation();
  const isFr = String(i18n.language || '').toLowerCase().startsWith('fr');
  const navigate = useNavigate();
  const [phase, setPhase] = useState('polling'); // polling | approved | declined | processing
  const attempts = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      attempts.current += 1;
      try {
        const token = sessionStorage.getItem('afriyield_token');
        if (!token) {
          if (!cancelled) setPhase('processing');
          return;
        }
        const res = await fetch(`${API}/api/investors/kyc-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (data?.diditStatus === 'approved') {
          setPhase('approved');
          return;
        }
        if (data?.diditStatus === 'declined') {
          setPhase('declined');
          return;
        }
        if (attempts.current >= MAX_ATTEMPTS) {
          setPhase('processing');
          return;
        }
        timer.current = setTimeout(poll, POLL_MS);
      } catch {
        if (cancelled) return;
        if (attempts.current >= MAX_ATTEMPTS) {
          setPhase('processing');
        } else {
          timer.current = setTimeout(poll, POLL_MS);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'approved') return undefined;
    const t = setTimeout(() => {
      navigate('/afri-yield/portal', { replace: true });
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, navigate]);

  const box = {
    background: '#0d1f17',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={box}>
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: '#132a1e',
          border: '1px solid rgba(181,133,10,0.35)',
        }}
      >
        {phase === 'polling' && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#B5850A] border-t-transparent" />
            <p className="text-lg font-bold text-[#F5F0E8]">
              {isFr ? 'Vérification en cours…' : 'Verification in progress…'}
            </p>
            <p className="mt-2 text-sm text-white/50">
              {isFr
                ? 'Nous confirmons le résultat Didit. Veuillez patienter.'
                : 'Confirming your Didit result. Please wait.'}
            </p>
          </>
        )}

        {phase === 'approved' && (
          <>
            <p className="text-4xl mb-3">✅</p>
            <p className="text-lg font-bold text-green-400">
              {isFr ? 'Identité vérifiée avec succès' : 'Identity verified successfully'}
            </p>
            <p className="mt-2 text-sm text-white/55">
              {isFr
                ? 'Redirection vers votre portail investisseur…'
                : 'Redirecting to your investor portal…'}
            </p>
          </>
        )}

        {phase === 'declined' && (
          <>
            <p className="text-4xl mb-3">❌</p>
            <p className="text-lg font-bold text-red-400">
              {isFr ? 'Vérification refusée' : 'Verification declined'}
            </p>
            <p className="mt-3 text-sm text-white/70">
              Contactez{' '}
              <a
                href="mailto:support@sahelagriconnect.com"
                className="text-[#B5850A] underline"
              >
                support@sahelagriconnect.com
              </a>
            </p>
          </>
        )}

        {phase === 'processing' && (
          <>
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-lg font-bold text-amber-300">
              {isFr
                ? 'Votre vérification est en cours de traitement'
                : 'Verification is processing — check back shortly'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/portal', { replace: true })}
              className="mt-6 rounded-xl px-5 py-2.5 text-sm font-bold text-[#0d1f17]"
              style={{ background: '#B5850A' }}
            >
              {isFr ? 'Retour au portail' : 'Back to portal'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
