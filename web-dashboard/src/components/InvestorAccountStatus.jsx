import { Check, Clock, AlertCircle, CreditCard, FileCheck, Sprout, X } from 'lucide-react';

const STEPS = [
  { key: 'registered', icon: FileCheck },
  { key: 'kyc', icon: FileCheck },
  { key: 'payment', icon: CreditCard },
  { key: 'processing', icon: Clock },
  { key: 'active', icon: Sprout },
];

function stepState(key, { status, paymentVerified, hasInvestments, diditStatus }) {
  const approved = status === 'approved' || diditStatus === 'approved';
  const kycPending =
    diditStatus === 'pending' ||
    ['pending_review', 'pending_kyc', 'african_pending_review', 'additional_docs'].includes(status);
  const kycRejected =
    diditStatus === 'declined' ||
    diditStatus === 'expired' ||
    status === 'rejected';

  switch (key) {
    case 'registered':
      return status && status !== 'not_started' ? 'done' : 'active';
    case 'kyc':
      if (diditStatus === 'declined' || diditStatus === 'expired' || kycRejected) return 'error';
      if (diditStatus === 'approved' || approved) return 'done';
      if (diditStatus === 'pending') return 'pending';
      if (kycPending) return 'active';
      return status === 'not_started' || !diditStatus ? 'upcoming' : 'active';
    case 'payment':
      if (paymentVerified) return 'done';
      if (approved || status === 'african_pending_review' || diditStatus === 'approved') return 'active';
      return 'upcoming';
    case 'processing':
      if (hasInvestments) return 'done';
      if (paymentVerified && (approved || status === 'african_pending_review' || diditStatus === 'approved')) {
        return 'active';
      }
      return 'upcoming';
    case 'active':
      if (hasInvestments) return 'done';
      return 'upcoming';
    default:
      return 'upcoming';
  }
}

export default function InvestorAccountStatus({ kyc, hasInvestments, isFr, diditStatus = null }) {
  if (!kyc) return null;

  const { status, paymentVerified, rejectionReason, additionalDocsRequested } = kyc;

  const labels = {
    registered: isFr ? 'Profil enregistré' : 'Profile registered',
    kyc: isFr ? 'Vérification KYC' : 'KYC verification',
    payment: isFr ? 'Paiement reçu' : 'Payment received',
    processing: isFr ? 'Traitement en cours' : 'Processing investment',
    active: isFr ? 'Investissement actif' : 'Investment active',
  };

  const kycDetail = () => {
    if (diditStatus === 'pending') {
      return isFr
        ? 'Votre vérification Didit est en cours d\'examen.'
        : 'Your Didit verification is under review.';
    }
    if (diditStatus === 'declined') {
      return isFr
        ? 'Vérification refusée — veuillez réessayer.'
        : 'Verification declined — please try again.';
    }
    if (diditStatus === 'expired') {
      return isFr
        ? 'Session expirée — veuillez recommencer.'
        : 'Session expired — please restart.';
    }
    if (diditStatus === 'approved') {
      return isFr ? 'Identité vérifiée via Didit.' : 'Identity verified via Didit.';
    }
    if (status === 'rejected') {
      return rejectionReason || (isFr ? 'Documents refusés — contactez le support.' : 'Documents rejected — contact support.');
    }
    if (status === 'additional_docs') {
      return additionalDocsRequested || (isFr ? 'Documents supplémentaires requis.' : 'Additional documents required.');
    }
    if (['pending_review', 'pending_kyc', 'african_pending_review'].includes(status)) {
      return isFr
        ? 'Votre pièce d\'identité est en cours d\'examen (24–72 h).'
        : 'Your ID is under review (24–72 hours).';
    }
    if (status === 'approved') {
      return isFr ? 'Identité vérifiée.' : 'Identity verified.';
    }
    if (status === 'not_started' || !diditStatus) {
      return isFr ? 'Commencez la vérification d\'identité Didit.' : 'Start Didit identity verification.';
    }
    return null;
  };

  const paymentDetail = paymentVerified
    ? isFr ? 'Paiement confirmé — merci.' : 'Payment confirmed — thank you.'
    : isFr ? 'En attente de confirmation du paiement.' : 'Awaiting payment confirmation.';

  return (
    <div
      className="mx-4 md:mx-6 rounded-2xl p-5 space-y-4"
      style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}
    >
      <div>
        <p className="text-[#B5850A] text-xs font-bold uppercase tracking-widest">
          {isFr ? 'État de votre compte' : 'Your account status'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgba(245,240,232,0.65)' }}>
          {isFr
            ? 'Votre investissement apparaît ici une fois le paiement reçu et le KYC approuvé.'
            : 'Your investment appears here once payment is received and KYC is approved.'}
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map(({ key, icon: Icon }) => {
          const state = stepState(key, { status, paymentVerified, hasInvestments, diditStatus });
          const isDone = state === 'done';
          const isActive = state === 'active';
          const isPending = state === 'pending';
          const isError = state === 'error';
          return (
            <div key={key} className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-[#22c55e]/20'
                    : isError
                      ? 'bg-red-500/20'
                      : isPending
                        ? 'bg-amber-500/20'
                        : isActive
                          ? 'bg-[#B5850A]/20'
                          : 'bg-white/5'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 text-[#22c55e]" />
                ) : isError ? (
                  <X className="w-4 h-4 text-red-400" />
                ) : isPending ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : isActive ? (
                  <Icon className="w-4 h-4 text-[#B5850A] animate-pulse" />
                ) : (
                  <Icon className="w-4 h-4 text-white/25" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    isDone
                      ? 'text-[#22c55e]'
                      : isError
                        ? 'text-red-400'
                        : isPending
                          ? 'text-amber-300'
                          : isActive
                            ? 'text-[#F5F0E8]'
                            : 'text-white/35'
                  }`}
                >
                  {labels[key]}
                </p>
                {key === 'kyc' && (isActive || isPending || isError) && kycDetail() ? (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
                    {kycDetail()}
                  </p>
                ) : null}
                {key === 'payment' && (isActive || isDone) ? (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
                    {paymentDetail}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
