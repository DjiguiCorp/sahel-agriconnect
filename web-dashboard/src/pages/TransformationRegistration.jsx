import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProcessorRegistration from '../components/ProcessorRegistration';
import AppReturnBanner from '../components/AppReturnBanner';

export default function TransformationRegistration() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromApp = searchParams.get('from') === 'app';
  const [success, setSuccess] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#0b1f12' }}>
      <section
        style={{
          background: `
            radial-gradient(ellipse 120% 70% at 50% -10%,
              rgba(80,52,0,0.55) 0%,
              rgba(40,28,0,0.35) 40%,
              transparent 65%),
            radial-gradient(ellipse 70% 50% at 100% 30%,
              rgba(29,158,117,0.12) 0%, transparent 50%),
            linear-gradient(180deg, #1a1208 0%, #0b1f12 100%)
          `,
          borderBottom: '1px solid rgba(181,133,10,0.25)',
        }}
        className="py-14"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#F59E0B',
              borderColor: 'rgba(245,158,11,0.3)',
            }}
          >
            🏭 {isFr ? 'Centre de transformation' : 'Transformation Center'}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? 'Enregistrez votre centre de transformation' : 'Register Your Transformation Center'}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {isFr
              ? "Rejoignez le réseau de centres certifiés Sahel AgriConnect. Accédez aux coopératives, aux investisseurs et aux marchés d'exportation."
              : 'Join the Sahel AgriConnect certified center network. Access cooperatives, investors, and export markets.'}
          </p>
        </div>
      </section>

      <section
        className="max-w-4xl mx-auto px-4 py-8"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 0% 80%,
              rgba(20,55,40,0.35) 0%, transparent 50%)
          `,
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            ['🤝', isFr ? 'Coopératives certifiées' : 'Certified coops', isFr ? 'Accès direct' : 'Direct access'],
            ['💰', isFr ? 'Investisseurs AfriYield' : 'AfriYield investors', isFr ? 'Visibilité listing' : 'Listing visibility'],
            ['🌍', isFr ? 'Marchés export' : 'Export markets', isFr ? 'Réseau mondial' : 'Global network'],
            ['⭐', isFr ? 'Certification' : 'Certification', isFr ? 'Label qualité' : 'Quality label'],
          ].map(([icon, title, sub]) => (
            <div
              key={title}
              className="rounded-2xl p-4 text-center border"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-white/50 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(245,158,11,0.06)' }}
          >
            <h2 className="text-white font-bold text-lg">
              {isFr ? "📋 Formulaire d'enregistrement" : '📋 Registration Form'}
            </h2>
            <p className="text-white/50 text-sm">
              {isFr
                ? 'Remplissez le formulaire — notre équipe vous contactera sous 24h.'
                : 'Fill the form — our team will contact you within 24h.'}
            </p>
          </div>

          <div className="p-6 registration-dark-zone">
            {success ? (
              <div className="text-center py-8">
                <AppReturnBanner role="processor" />
                <div className="text-5xl mb-4">🏭</div>
                <h3 className="text-white font-bold text-xl mb-2">
                  {isFr ? 'Enregistrement reçu !' : 'Registration Received!'}
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
                  {isFr
                    ? 'Notre équipe examinera votre dossier et vous contactera dans les 24 heures.'
                    : 'Our team will review your application and contact you within 24 hours.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-xl font-bold text-black"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  {isFr ? 'Voir le tableau de bord' : 'View Dashboard'}
                </button>
              </div>
            ) : (
              <ProcessorRegistration onProcessorAdded={() => setSuccess(true)} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
