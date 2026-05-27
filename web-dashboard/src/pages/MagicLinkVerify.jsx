import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MagicLinkVerify() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setStatus('error');
      return;
    }

    // Token arrives in the URL fragment (e.g. #token=xxx&role=farmer&dest=/farmer)
    const fragment = window.location.hash.slice(1);
    const params = new URLSearchParams(fragment);
    const token = params.get('token');
    const role = params.get('role');
    const dest = params.get('dest');

    if (!token) {
      setStatus('error');
      return;
    }

    // Store the JWT for web session (same key pattern the web admin uses)
    // Role-specific storage so the correct dashboard loads
    const storageKey = role === 'admin' ? 'adminToken' : `auth_token_${role}`;
    localStorage.setItem(storageKey, token);
    localStorage.setItem('auth_role', role || 'farmer');

    setStatus('success');

    // Redirect to the appropriate dashboard
    const dashboardRoutes = {
      farmer: '/my-dashboard',
      investor: '/afri-yield/portal',
      cooperative: '/cooperative-portal',
      government: '/government-portal',
      ngo: '/ngo-portal',
      processor: '/transformation-registration',
    };

    if (role === 'investor' && email) {
      localStorage.setItem('afriyield_investor_email', email);
      localStorage.removeItem('sac_user_email');
      localStorage.removeItem('sac_user_name');
      localStorage.removeItem('sac_user_phone');
    }
    if (role === 'farmer' && email) {
      localStorage.setItem('sac_user_email', email);
      localStorage.removeItem('afriyield_investor_email');
      localStorage.removeItem('afriyield_investor_name');
    }
    const target = dest ? decodeURIComponent(dest) : (dashboardRoutes[role] || '/');

    setTimeout(() => navigate(target, { replace: true }), 1200);
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
