import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const API = (API_BASE_URL || '').replace(/\/$/, '');
const OM_PHONE = '+223 78 45 07 26';

/**
 * Multi-rail payment selector (Stripe | Orange Money/Wave | Cash).
 */
export default function PaymentMethodSelector({
  isFr = true,
  subscriptionType,
  amount,
  amountLabel,
  authToken = '',
  email = '',
  entityName = '',
  onStripeSelect,
  onActivated,
}) {
  const [step, setStep] = useState('select'); // select | instructions | waiting | confirmed
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const [amountXOF, setAmountXOF] = useState(Math.round(Number(amount || 0) * 600));
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const startPoll = useCallback(() => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : '';
        const r = await fetch(`${API}/api/mobile-money/my-status${qs}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const d = await r.json().catch(() => ({}));
        if (d?.payment?.status === 'confirmed') {
          stopPoll();
          setStep('confirmed');
          onActivated?.(d.payment);
        } else if (d?.payment?.status === 'rejected') {
          stopPoll();
          setError(
            isFr
              ? `Paiement rejeté: ${d.payment.rejectionReason || 'contactez le support'}`
              : `Payment rejected: ${d.payment.rejectionReason || 'contact support'}`
          );
          setStep('instructions');
        }
      } catch {
        /* keep polling */
      }
    }, 30000);
  }, [authToken, email, isFr, onActivated, stopPoll]);

  const initiate = async (paymentMethod) => {
    setError('');
    setLoading(true);
    setMethod(paymentMethod);
    try {
      const r = await fetch(`${API}/api/mobile-money/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          paymentMethod,
          subscriptionType,
          amount: Number(amount) || undefined,
          email: email || undefined,
          entityName: entityName || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) {
        throw new Error(d.error || (isFr ? 'Initiation échouée' : 'Initiation failed'));
      }
      setRefCode(d.referenceCode);
      setAmountXOF(d.amountXOF ?? Math.round(Number(amount) * 600));
      setStep('instructions');
    } catch (e) {
      setError(e.message || 'Error');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const markPaid = () => {
    setStep('waiting');
    startPoll();
  };

  if (step === 'confirmed') {
    return (
      <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-6 text-center">
        <p className="text-4xl mb-3">✅</p>
        <h3 className="text-lg font-bold text-green-300 mb-2">
          {isFr ? 'Paiement confirmé' : 'Payment confirmed'}
        </h3>
        <p className="text-sm text-white/70 mb-4">
          {isFr
            ? 'Votre portail est maintenant actif. Redirection…'
            : 'Your portal is now active. Redirecting…'}
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-green-400 mx-auto" />
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        <p className="font-semibold text-amber-200">
          {isFr
            ? 'En attente de confirmation par notre équipe…'
            : 'Waiting for confirmation from our team…'}
        </p>
        <p className="text-sm text-white/60">
          {isFr
            ? 'Vous recevrez un email dès que votre portail est activé. Réf: '
            : 'You will receive an email when your portal is activated. Ref: '}
          <span className="font-mono text-amber-300">{refCode}</span>
        </p>
        <button
          type="button"
          onClick={() => setStep('instructions')}
          className="text-xs text-white/50 hover:text-white underline"
        >
          {isFr ? 'Voir les instructions' : 'View instructions'}
        </button>
      </div>
    );
  }

  if (step === 'instructions') {
    const isCash = method === 'cash';
    return (
      <div className="rounded-2xl border border-amber-500/35 bg-black/30 p-5 space-y-4">
        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 text-sm text-white/80">
          {isCash ? (
            <p>
              {isFr
                ? 'Contactez-nous pour organiser le paiement en espèces.'
                : 'Contact us to arrange cash payment.'}
              <br />
              <span className="font-semibold text-amber-300">{OM_PHONE}</span>
              {' · '}
              info@djiguicorporation.org
            </p>
          ) : (
            <p>
              📱 {isFr ? 'Envoyez' : 'Send'}{' '}
              <strong className="text-amber-300">{Number(amountXOF).toLocaleString()} XOF</strong>{' '}
              {isFr ? 'via Orange Money ou Wave au:' : 'via Orange Money or Wave to:'}
              <br />
              <strong className="text-lg text-white tracking-wide">{OM_PHONE}</strong>
              <br />
              <span className="text-white/50">(Djigui Corporation)</span>
            </p>
          )}

          <div>
            <p className="text-white/60 mb-1">
              📝 {isFr ? 'Référence à mentionner:' : 'Reference to include:'}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-black/40 border border-amber-500/30 px-3 py-2 font-mono text-amber-300 text-sm">
                {refCode}
              </code>
              <button
                type="button"
                onClick={copyRef}
                className="shrink-0 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-amber-200"
                aria-label="Copy"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-white/55 text-xs">
            ⏱{' '}
            {isFr
              ? 'Votre portail sera activé dans les 2 heures après confirmation.'
              : 'Your portal will be activated within 2 hours after confirmation.'}
          </p>
        </div>

        <button
          type="button"
          onClick={markPaid}
          className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400"
        >
          {isFr ? "J'ai effectué le paiement" : 'I have completed the payment'}
        </button>
        <button
          type="button"
          onClick={() => {
            stopPoll();
            setStep('select');
            setError('');
          }}
          className="w-full text-xs text-white/50 hover:text-white"
        >
          {isFr ? '← Changer de méthode' : '← Change method'}
        </button>
      </div>
    );
  }

  const cards = [
    {
      key: 'stripe',
      icon: '💳',
      label: isFr ? 'Carte bancaire' : 'Bank card',
      sub: isFr
        ? 'Visa, Mastercard — paiement instantané'
        : 'Visa, Mastercard — instant payment',
      onClick: () => onStripeSelect?.(),
    },
    {
      key: 'orange_money',
      icon: '🟠',
      label: 'Orange Money / Wave',
      sub: isFr
        ? 'Disponible au Mali, Sénégal, Burkina Faso, Côte d’Ivoire'
        : 'Available in Mali, Senegal, Burkina Faso, Côte d’Ivoire',
      onClick: () => initiate('orange_money'),
    },
    {
      key: 'cash',
      icon: '💵',
      label: isFr ? 'Paiement en espèces' : 'Cash payment',
      sub: isFr
        ? 'Remise en main propre ou transfert via agent'
        : 'In-person handover or agent transfer',
      onClick: () => initiate('cash'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-white">
          {isFr ? 'Choisissez votre méthode de paiement' : 'Choose your payment method'}
        </h3>
        <p className="text-sm text-white/55 mt-1">{amountLabel || `$${amount}`}</p>
      </div>

      {error ? <p className="text-red-400 text-sm text-center">{error}</p> : null}

      <div className="space-y-3">
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            disabled={loading}
            onClick={c.onClick}
            className="w-full text-left rounded-2xl border border-white/15 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 p-4 transition disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{c.icon}</span>
              <div>
                <p className="font-bold text-white text-sm">{c.label}</p>
                <p className="text-xs text-white/55 mt-0.5">{c.sub}</p>
              </div>
              {loading && method === c.key ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 ml-auto" />
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
