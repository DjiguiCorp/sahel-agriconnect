import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL?.replace(/\/$/, '') || '';

export default function Hero() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitWaitlist = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${API}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* silent */
    } finally {
      setDone(true);
      setLoading(false);
    }
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 140% 80% at 50% -20%,
            rgba(26,92,53,0.7) 0%,
            rgba(10,42,25,0.5) 35%,
            transparent 65%),
          radial-gradient(ellipse 60% 50% at 85% 30%,
            rgba(181,133,10,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 15% 60%,
            rgba(29,158,117,0.1) 0%, transparent 50%),
          linear-gradient(180deg, #0a1f10 0%, #060f0a 100%)
        `,
        minHeight: '85vh',
      }}
    >
      <div
        className="glow-orb-green"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0.6,
        }}
      />
      <div className="glow-orb-gold" style={{ width: 400, height: 400, top: 100, right: -100 }} />
      <div
        className="glow-orb-green"
        style={{ width: 300, height: 300, bottom: 0, left: -50, opacity: 0.4 }}
      />

      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
          style={{
            background: 'rgba(76,175,80,0.12)',
            border: '1px solid rgba(76,175,80,0.25)',
            color: '#4ade80',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
          {isFr ? "Plateforme en direct · Afrique de l'Ouest" : 'Live Platform · West Africa'}
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
          <span className="text-white">{isFr ? "L'agriculture africaine," : 'African agriculture,'}</span>
          <br />
          <span className="text-gradient">{isFr ? 'réinventée.' : 'reinvented.'}</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-4 font-light leading-relaxed">
          {isFr
            ? 'Sahel AgriConnect connecte agriculteurs, coopératives, investisseurs et gouvernements sur une plateforme unifiée.'
            : 'Sahel AgriConnect connects farmers, cooperatives, investors and governments on one unified platform.'}
        </p>

        <p className="text-base md:text-lg font-semibold mb-12" style={{ color: '#B5850A' }}>
          {isFr ? 'Produire ensemble. Vendre plus loin. Gagner plus.' : 'Produce together. Sell further. Earn more.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 flex-wrap">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-105"
            style={{
              background: '#4CAF50',
              color: '#060f0a',
              boxShadow: '0 0 30px rgba(76,175,80,0.25)',
            }}
          >
            {isFr ? 'Explorer la plateforme' : 'Explore Platform'}
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/afri-yield"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(181,133,10,0.12)',
              border: '1px solid rgba(181,133,10,0.35)',
              color: '#B5850A',
            }}
          >
            💰 {isFr ? 'AfriYield Exchange' : 'AfriYield Exchange'}
          </Link>
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            🌾 {isFr ? "S'inscrire gratuitement" : 'Join Free'}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
          {[
            { icon: '🌾', value: isFr ? 'Gratuit' : 'Free', label: isFr ? 'pour les agriculteurs' : 'for farmers' },
            { icon: '🤝', value: '6', label: isFr ? "types d'acteurs" : 'actor types' },
            { icon: '🌍', value: isFr ? 'Sahel' : 'Sahel', label: isFr ? "Afrique de l'Ouest" : 'West Africa' },
            { icon: '💰', value: 'AfriYield', label: isFr ? 'pour investisseurs' : 'for investors' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-white font-bold text-base">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div id="waitlist-form" className="max-w-md mx-auto">
          {done ? (
            <div className="glass-card p-4 text-center">
              <p className="text-green-400 text-sm font-semibold">
                ✅ {isFr ? 'Vous serez notifié au lancement !' : "You'll be notified at launch!"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-white/50 text-sm text-center mb-3">
                📱{' '}
                {isFr
                  ? "Soyez notifié au lancement de l'application mobile"
                  : 'Get notified when the mobile app launches'}
              </p>
              <form onSubmit={submitWaitlist} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-white/30"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-xl font-semibold text-sm text-black whitespace-nowrap disabled:opacity-60"
                  style={{ background: '#4CAF50' }}
                >
                  {loading ? '...' : isFr ? 'Rejoindre' : 'Notify me'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
