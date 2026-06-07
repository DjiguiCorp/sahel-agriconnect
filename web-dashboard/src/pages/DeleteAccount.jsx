import { Link } from 'react-router-dom';
import { Mail, Trash2, Shield, Smartphone } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

const MAILTO =
  'mailto:support@woneapp.com?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20Sahel%20AgriConnect%20account.%0A%0ARegistered%20email%3A%20';

const DELETED_ITEMS = [
  { en: 'Profile information', fr: 'Informations de profil' },
  { en: 'Production records', fr: 'Données de production' },
  { en: 'Cooperative membership data', fr: "Données d'adhésion coopérative" },
];

const RETAINED_ITEMS = [
  {
    en: 'Financial transaction records (required by law, retained 7 years)',
    fr: 'Registres de transactions financières (obligation légale, conservation 7 ans)',
  },
];

export default function DeleteAccount() {
  return (
    <div
      className="relative min-h-screen overflow-hidden py-10 px-4"
      style={{
        background:
          'linear-gradient(165deg, #060f0a 0%, #0d1f17 28%, #1a3c2e 52%, #0a1610 78%, #060f0a 100%)',
      }}
    >
      <div
        className="glow-orb-green pointer-events-none absolute -left-32 top-16 h-72 w-72 opacity-70"
        aria-hidden
      />
      <div
        className="glow-orb-gold pointer-events-none absolute -right-20 top-1/4 h-80 w-80 opacity-60"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          to="/"
          className="mb-6 inline-flex text-sm text-white/60 transition hover:text-white"
        >
          ← Sahel AgriConnect
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/30">
            <Trash2 className="h-8 w-8 text-red-400" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Delete Your Account
          </h1>
          <p className="mt-1 text-lg font-medium text-[#d4af37]">
            Supprimer votre compte
          </p>
        </div>

        <GlassCard variant="strong" hover={false} className="mb-5 p-6 md:p-8">
          <div className="space-y-5 text-sm leading-relaxed text-white/90">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                English
              </p>
              <p>
                To request deletion of your account and data, send an email to:{' '}
                <a
                  href="mailto:support@woneapp.com"
                  className="font-semibold text-[#d4af37] underline-offset-2 hover:underline"
                >
                  support@woneapp.com
                </a>
                . Include your registered email address. Your account and all associated
                data will be deleted within 30 days of your request.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                Français
              </p>
              <p>
                Pour demander la suppression de votre compte et de vos données, envoyez un
                e-mail à :{' '}
                <a
                  href="mailto:support@woneapp.com"
                  className="font-semibold text-[#d4af37] underline-offset-2 hover:underline"
                >
                  support@woneapp.com
                </a>
                . Indiquez votre adresse e-mail enregistrée. Votre compte et toutes les
                données associées seront supprimés dans les 30 jours suivant votre demande.
              </p>
            </div>
          </div>

          <a
            href={MAILTO}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b5850a] to-[#d4af37] px-6 py-4 text-center text-base font-bold text-[#1a3c2e] shadow-lg shadow-amber-900/30 transition hover:brightness-110"
          >
            <Mail className="h-5 w-5" aria-hidden />
            Request account deletion by email
          </a>
        </GlassCard>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <GlassCard variant="default" hover={false} className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-400">
              <Trash2 className="h-4 w-4" aria-hidden />
              Data that will be deleted
            </h2>
            <ul className="space-y-2 text-xs text-white/80">
              {DELETED_ITEMS.map((item) => (
                <li key={item.en} className="flex flex-col gap-0.5 border-b border-white/5 pb-2 last:border-0">
                  <span>{item.en}</span>
                  <span className="text-white/50">{item.fr}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard variant="default" hover={false} className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-300">
              <Shield className="h-4 w-4" aria-hidden />
              Data we retain
            </h2>
            <ul className="space-y-2 text-xs text-white/80">
              {RETAINED_ITEMS.map((item) => (
                <li key={item.en} className="flex flex-col gap-0.5">
                  <span>{item.en}</span>
                  <span className="text-white/50">{item.fr}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <GlassCard variant="gold" hover={false} className="p-5">
          <div className="flex gap-3">
            <Smartphone className="h-5 w-5 shrink-0 text-[#d4af37]" aria-hidden />
            <p className="text-xs leading-relaxed text-white/80">
              <strong className="text-white">Android &amp; iOS app:</strong> Farmers signed in
              on the mobile app can delete immediately from{' '}
              <span className="text-[#d4af37]">Account → Delete my account and data</span>{' '}
              (no email required). /{' '}
              <span className="text-white/60">
                Application mobile : Portail agriculteur → Compte → Supprimer mon compte et mes
                données.
              </span>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
