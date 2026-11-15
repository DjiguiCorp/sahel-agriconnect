import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

export default function MagicLinkVerify() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    let cancelled = false;

    const finishWithToken = (token, role, dest, user) => {
      const storageKey = role === 'admin' ? 'adminToken' : `auth_token_${role || 'farmer'}`;
      localStorage.setItem(storageKey, token);
      localStorage.setItem('auth_role', role || 'farmer');

      if (role === 'farmer' || !role) {
        const email = user?.email || searchParams.get('e') || '';
        const name = user?.nom || user?.fullName || user?.name || '';
        if (email) localStorage.setItem('sac_user_email', email);
        if (name) localStorage.setItem('sac_user_name', name);
        window.dispatchEvent(new Event('sac_user_updated'));
      }
      if (role === 'cooperative' && user?.email) {
        localStorage.setItem('sac_coop_email', user.email);
        if (user.cooperativeName) localStorage.setItem('sac_coop_name', user.cooperativeName);
      }

      const dashboardRoutes = {
        farmer: '/my-dashboard',
        investor: '/afri-yield/portal',
        cooperative: '/cooperative-portal',
        government: '/government-portal',
        ngo: '/ngo-portal',
        processor: '/processor-portal',
      };
      const target = dest
        ? decodeURIComponent(dest)
        : dashboardRoutes[role] || '/';

      if (!cancelled) {
        setStatus('success');
        setTimeout(() => navigate(target, { replace: true }), 900);
      }
    };

    const run = async () => {
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        return;
      }

      // Path A: backend already confirmed — token in hash
      const fragment = window.location.hash.slice(1);
      const hashParams = new URLSearchParams(fragment);
      const hashToken = hashParams.get('token');
      const hashRole = hashParams.get('role');
      const hashDest = hashParams.get('dest');
      const verifiedOnly = hashParams.get('verified') === '1';

      if (hashToken) {
        finishWithToken(hashToken, hashRole, hashDest, null);
        return;
      }

      if (verifiedOnly && hashDest) {
        if (!cancelled) {
          setStatus('success');
          setTimeout(() => navigate(decodeURIComponent(hashDest), { replace: true }), 900);
        }
        return;
      }

      // Path B: email linked to frontend with ?c=&e=&p= — confirm here (code not used until success)
      const code = searchParams.get('c');
      const email = searchParams.get('e');
      const purpose = searchParams.get('p');
      const roleParam = searchParams.get('r') || searchParams.get('role') || 'farmer';

      if (!code || !email || !purpose) {
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/verify/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            email,
            purpose,
            role: roleParam,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          if (!cancelled) setStatus('error');
          return;
        }

        if (data.isNewUser && !data.token) {
          const dest = `/inscription?email=${encodeURIComponent(data.email || email)}`;
          if (!cancelled) {
            setStatus('success');
            setTimeout(() => navigate(dest, { replace: true }), 900);
          }
          return;
        }

        if (!data.token) {
          if (!cancelled) setStatus('error');
          return;
        }

        finishWithToken(data.token, data.role || roleParam, null, data.user);
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d1f17', padding: '20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h2 style={{ color: 'white', fontWeight: 700, marginBottom: 8 }}>
              {isFr ? 'Vérification en cours…' : 'Verifying your link…'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              {isFr ? 'Un instant, nous vous connectons.' : 'Just a moment, signing you in.'}
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#1D9E75', fontWeight: 700, marginBottom: 8 }}>
              {isFr ? 'Connecté !' : 'Signed in!'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              {isFr ? 'Redirection vers votre tableau de bord…' : 'Redirecting to your dashboard…'}
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: '#B5850A', fontWeight: 700, marginBottom: 8 }}>
              {isFr ? 'Lien expiré ou invalide' : 'Link expired or invalid'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
              {isFr
                ? 'Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien.'
                : 'This link has expired or was already used. Request a new one.'}
            </p>
            <a href="/" style={{
              display: 'inline-block', background: '#B5850A', color: 'white',
              padding: '12px 28px', borderRadius: 10, fontWeight: 700,
              textDecoration: 'none', fontSize: 14,
            }}>
              {isFr ? '← Retour à l\'accueil' : '← Back to home'}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
