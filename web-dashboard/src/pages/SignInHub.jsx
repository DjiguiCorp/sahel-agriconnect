import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { PORTAL_META, ROLES } from '../lib/portalConfig';
import { ROLE_THEMES } from '../lib/portalThemes';
import { useWebSession } from '../hooks/useWebSession';
import { useInvestorKYCStatus } from '../hooks/useInvestorKYCStatus';

const ROLE_ORDER = [
  ROLES.farmer,
  ROLES.cooperative,
  ROLES.investor,
  ROLES.processor,
  ROLES.government,
  ROLES.ngo,
];

export default function SignInHub() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get('role');
  const navigate = useNavigate();
  const { sessions, hasAnySession } = useWebSession();
  const kyc = useInvestorKYCStatus();

  const cards = useMemo(
    () =>
      ROLE_ORDER.map((role) => {
        const meta = PORTAL_META[role];
        const theme = ROLE_THEMES[role];
        const session = sessions[role];
        const isAfri = meta.brand === 'afriyield';
        const investorPending =
          role === ROLES.investor && session?.active && kyc.kycUnderReview;
        return { role, meta, theme, session, isAfri, investorPending };
      }),
    [sessions, kyc.kycUnderReview],
  );

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% -15%, rgba(29,158,117,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 100% 40%, rgba(181,133,10,0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 45% at 0% 80%, rgba(59,130,246,0.15) 0%, transparent 50%),
          linear-gradient(180deg, #0a1628 0%, #0d1f17 50%, #0b1f12 100%)
        `,
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{ borderColor: 'rgba(181,133,10,0.4)', color: '#B5850A' }}
          >
            {isFr ? '🔐 Connexion & portails' : '🔐 Sign in & portals'}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {isFr ? 'Accédez à votre espace' : 'Access your workspace'}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-sm md:text-base">
            {isFr
              ? 'Chaque profil a sa couleur et son portail dédié — pas de confusion entre agriculteur, investisseur AfriYield, gouvernement ou ONG.'
              : 'Each profile has its own color and dedicated portal — no confusion between farmer, AfriYield investor, government, or NGO.'}
          </p>
        </div>

        {hasAnySession && (
          <div
            className="rounded-2xl p-5 mb-8 text-center border"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(29,158,117,0.35)',
            }}
          >
            <p className="text-white font-semibold mb-2">
              {isFr ? 'Session active' : 'Active session'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {cards
                .filter((c) => c.session?.active)
                .map(({ role, meta, theme, session, investorPending }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => navigate(meta.portalPath)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm"
                    style={{
                      background: investorPending ? '#60a5fa' : theme.button,
                      color: theme.buttonText,
                    }}
                  >
                    {session?.name
                      ? `${meta.icon} ${session.name.split(' ')[0]}`
                      : `${meta.icon} ${isFr ? meta.labelFr : meta.labelEn}`}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(({ role, meta, theme, session, investorPending }) => {
            const highlighted = preselect === role;
            return (
              <div
                key={role}
                className="rounded-2xl p-6 flex flex-col transition-transform hover:scale-[1.02] border shadow-lg"
                style={{
                  background: theme.gradient,
                  borderColor: highlighted ? theme.accent : theme.border,
                  boxShadow: `0 12px 40px ${theme.glow}`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl drop-shadow">{meta.icon}</span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                    style={{ background: theme.badgeBg, color: theme.accent }}
                  >
                    {theme.badge}
                  </span>
                </div>
                <h2 className="text-white font-bold text-lg mb-1">{isFr ? meta.labelFr : meta.labelEn}</h2>
                <p className="text-white/55 text-xs mb-4 flex-1">{isFr ? meta.descFr : meta.descEn}</p>

                {session?.active ? (
                  <>
                    {investorPending && (
                      <p className="text-blue-200 text-xs mb-3">
                        {isFr ? '⏳ KYC en cours — suivez dans AfriYield.' : '⏳ KYC pending — track in AfriYield.'}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(meta.portalPath)}
                      className="w-full py-3 rounded-xl font-bold text-sm mb-2"
                      style={{ background: theme.button, color: theme.buttonText }}
                    >
                      {isFr ? '→ Ouvrir mon portail' : '→ Open my portal'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={meta.signInPath || meta.portalPath}
                      className="w-full block text-center py-3 rounded-xl font-bold text-sm mb-2"
                      style={{ background: theme.button, color: theme.buttonText }}
                    >
                      {isFr ? 'Se connecter' : 'Sign in'}
                    </Link>
                    <Link
                      to={meta.registerPath}
                      className="w-full block text-center py-2.5 rounded-xl text-sm border transition hover:bg-white/10"
                      style={{ borderColor: theme.border, color: 'rgba(255,255,255,0.85)' }}
                    >
                      {isFr ? "Pas encore inscrit ? S'inscrire" : 'Not registered? Join'}
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-white/35 text-xs mt-10">
          {isFr ? 'Administrateur ? ' : 'Administrator? '}
          <Link to="/admin/login" className="text-[#B5850A] hover:underline">
            {isFr ? 'Accès admin central' : 'Central admin access'}
          </Link>
        </p>
      </div>
    </div>
  );
}
