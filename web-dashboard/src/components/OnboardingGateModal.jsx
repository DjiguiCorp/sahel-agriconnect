import { Check, Lock, X } from 'lucide-react';
import { onboardingStepLabel } from '../lib/investorOnboarding';

const STEPS = [
  { n: 1, fr: 'Email', en: 'Email', key: 'email_verification' },
  { n: 2, fr: 'Identité', en: 'Identity', key: 'kyc' },
  { n: 3, fr: 'Paiement', en: 'Payment', key: 'payment' },
  { n: 4, fr: 'Accès complet', en: 'Full access', key: 'complete' },
];

export function hasFullInvestAccess(onboarding) {
  return onboarding?.step === 'complete' && Boolean(onboarding?.tradingApproved);
}

export function gateCtaLabel(step, isFr) {
  switch (step) {
    case 'email_verification':
      return isFr ? 'Vérifier mon email' : 'Verify my email';
    case 'kyc':
      return isFr ? 'Commencer la vérification' : 'Start verification';
    case 'payment':
      return isFr ? 'S’abonner — 99$/an' : 'Subscribe — $99/year';
    case 'complete':
      return isFr ? 'Voir mon portail' : 'Go to portal';
    default:
      return isFr ? 'Continuer' : 'Continue';
  }
}

/**
 * Modal explaining which onboarding step blocks investing.
 */
export default function OnboardingGateModal({
  open,
  onClose,
  onboarding,
  isFr,
  onContinue,
  actionLabel,
}) {
  if (!open || !onboarding) return null;
  const step = onboarding.step || 'email_verification';
  const current = onboarding.currentStep || 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        style={{ background: '#132a1e', borderColor: 'rgba(181,133,10,0.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#B5850A]/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#B5850A]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {isFr ? 'Étape requise' : 'Step required'}
              </p>
              {actionLabel ? (
                <p className="text-white/45 text-xs mt-0.5">{actionLabel}</p>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <p className="text-sm text-white/80 mb-4 leading-relaxed">
          {onboardingStepLabel(step, isFr)}
          {step === 'payment'
            ? isFr
              ? ' — Abonnement requis pour investir.'
              : ' — Subscription required to invest.'
            : ''}
        </p>

        <div className="flex items-center justify-between gap-1 mb-5 px-1">
          {STEPS.map((s) => {
            const completed =
              (s.n === 1 && onboarding.emailVerified) ||
              (s.n === 2 && onboarding.diditStatus === 'approved') ||
              (s.n === 3 && onboarding.subscriptionActive) ||
              (s.n === 4 && hasFullInvestAccess(onboarding));
            const active = current === s.n || (step === 'complete' && !onboarding.tradingApproved && s.n === 4);
            return (
              <div key={s.n} className="flex-1 flex flex-col items-center min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    completed
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'bg-[#B5850A] text-[#0d1f17]'
                        : 'bg-white/10 text-white/40'
                  }`}
                >
                  {completed ? <Check className="w-3.5 h-3.5" /> : s.n}
                </div>
                <p
                  className={`text-[10px] text-center truncate w-full ${
                    active || completed ? 'text-white/90 font-semibold' : 'text-white/35'
                  }`}
                >
                  {isFr ? s.fr : s.en}
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl py-3 text-sm font-bold text-[#0d1f17]"
          style={{ background: '#B5850A' }}
        >
          {gateCtaLabel(step, isFr)} →
        </button>
      </div>
    </div>
  );
}
