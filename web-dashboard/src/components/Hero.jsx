import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        background: `
          radial-gradient(ellipse 160% 90% at 50% -15%,
            rgba(34,110,65,0.75) 0%,
            rgba(18,55,35,0.5) 35%,
            transparent 62%),
          radial-gradient(ellipse 70% 55% at 92% 25%,
            rgba(181,133,10,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 55% 45% at 8% 65%,
            rgba(29,158,117,0.18) 0%, transparent 52%),
          radial-gradient(ellipse 90% 60% at 50% 110%,
            rgba(10,40,22,0.6) 0%, transparent 50%)
        `,
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 700,
          height: 700,
          top: -250,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(76,175,80,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: 50,
          right: -100,
          background: 'radial-gradient(circle, rgba(181,133,10,0.14) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center py-20">
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
          style={{
            background: 'rgba(76,175,80,0.14)',
            border: '1px solid rgba(76,175,80,0.28)',
            color: '#4ade80',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {isFr
            ? "Plateforme agricole · Afrique de l'Ouest"
            : 'Agricultural Platform · West Africa'}
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.08]">
          <span className="text-white block">
            {isFr ? "L'agriculture africaine," : 'African agriculture,'}
          </span>
          <span
            style={{
              background: 'linear-gradient(135deg, #4ade80 20%, #B5850A 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {isFr ? 'réinventée.' : 'reinvented.'}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-4 font-light leading-relaxed">
          {isFr
            ? 'Agriculteurs, coopératives, investisseurs et gouvernements — connectés sur une seule plateforme souveraine.'
            : 'Farmers, cooperatives, investors and governments — connected on one sovereign platform.'}
        </p>

        <p className="text-base font-semibold mb-12" style={{ color: '#B5850A' }}>
          {isFr
            ? 'Produire ensemble. Vendre plus loin. Gagner plus.'
            : 'Produce together. Sell further. Earn more.'}
        </p>

        {/* Single clear CTA group */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14 flex-wrap">
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: '#4CAF50',
              color: '#060f0a',
              boxShadow: '0 0 28px rgba(76,175,80,0.3)',
            }}
          >
            🌾 {isFr ? 'Rejoindre gratuitement' : 'Join Free'}
            <ArrowRight size={17} />
          </Link>
          <Link
            to="/afri-yield"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(181,133,10,0.14)',
              border: '1px solid rgba(181,133,10,0.38)',
              color: '#f59e0b',
            }}
          >
            💰 AfriYield Exchange
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {isFr ? 'Explorer la plateforme' : 'Explore Platform'}
          </Link>
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { icon: '🌾', v: isFr ? 'Gratuit' : 'Free', l: isFr ? 'pour agriculteurs' : 'for farmers' },
            { icon: '🤝', v: '6', l: isFr ? "types d'acteurs" : 'actor types' },
            { icon: '🌍', v: 'Sahel', l: isFr ? "Afrique de l'Ouest" : 'West Africa' },
            { icon: '💰', v: 'AfriYield', l: isFr ? 'investisseurs' : 'investors' },
          ].map(({ icon, v, l }) => (
            <div key={l} className="glass-card py-4 px-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-white font-bold text-sm">{v}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
