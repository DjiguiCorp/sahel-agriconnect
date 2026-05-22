import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useInvestorKYCStatus } from '../hooks/useInvestorKYCStatus';
import { Loader2 } from 'lucide-react';
import StripeInvestmentCheckout from '../components/StripeInvestmentCheckout';

const API = API_BASE_URL.replace(/\/$/, '');

function fmtMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString()}`;
}

function monthYear(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function computeBiAnnualPayouts(amount, roiPercent) {
  const principal = Number(amount);
  const roi = Number(roiPercent);
  if (!Number.isFinite(principal) || !Number.isFinite(roi) || principal <= 0) return null;
  const perHalf = (principal * (roi / 100)) / 2;
  return {
    june: perHalf,
    december: perHalf,
    annual: perHalf * 2,
  };
}

export default function InvestmentConfirmation() {
  const { opportunityId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const kycState = useInvestorKYCStatus();

  const [loading, setLoading] = useState(true);
  const [opportunity, setOpportunity] = useState(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const investorName = localStorage.getItem('afriyield_investor_name') || '';
  const investorEmail = localStorage.getItem('afriyield_investor_email') || '';
  const initialAmount =
    params.get('amount') ||
    localStorage.getItem(`afriyield_invest_amount_${opportunityId}`) ||
    localStorage.getItem('afriyield_invest_amount') ||
    '';

  const [form, setForm] = useState({
    name: investorName,
    email: investorEmail,
    amount: initialAmount,
    message: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.BY_ID(opportunityId));
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || j?.message || 'Not found');
        const opp = j?.opportunity ?? j;
        if (!cancelled) setOpportunity(opp);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opportunityId]);

  const steps = useMemo(() => {
    return [
      {
        number: '01',
        title: i18n.language === 'fr' ? 'Confirmez votre engagement' : 'Confirm your commitment',
        body:
          i18n.language === 'fr'
            ? "Remplissez le formulaire ci-dessous pour confirmer que vous souhaitez investir. Cela ne transfère pas encore d'argent."
            : 'Fill in the form below to confirm you want to invest. This does not transfer money yet.',
      },
      {
        number: '02',
        title: i18n.language === 'fr' ? 'Notre équipe vous contacte' : 'Our team contacts you',
        body:
          i18n.language === 'fr'
            ? "Vous recevrez un email avec les instructions de transfert et un contrat d'investissement signé sous 24 heures."
            : 'You will receive an email with wire transfer instructions and a signed investment agreement within 24 hours.',
      },
      {
        number: '03',
        title: i18n.language === 'fr' ? 'Envoyez vos fonds' : 'Send your funds',
        body:
          i18n.language === 'fr'
            ? "Transférez les fonds sur le compte AfriYield Exchange. Les coordonnées bancaires complètes vous seront envoyées par email après confirmation."
            : 'Transfer funds to the AfriYield Exchange account. Full wire details will be sent to your email after confirmation.',
      },
      {
        number: '04',
        title: i18n.language === 'fr' ? 'Votre investissement est actif' : 'Your investment goes live',
        body:
          i18n.language === 'fr'
            ? "Une fois les fonds reçus, votre investissement apparaît dans votre portail sous 24 heures. Votre premier versement est prévu selon le calendrier convenu."
            : 'Once funds are received, your investment appears in your portal within 24 hours. Your first payout follows the agreed schedule.',
      },
    ];
  }, [i18n.language]);

  const oppName = opportunity?.centerName || opportunity?.name || 'Opportunity';
  const commodity = opportunity?.commodity || '—';
  const track = opportunity?.track || '—';
  const expectedROIPercent = Number(opportunity?.expectedROIPercent ?? 0) || 0;
  const roiDisplay =
    expectedROIPercent > 0
      ? `~${expectedROIPercent}% proj. (not guaranteed)`
      : '—';
  const payouts = computeBiAnnualPayouts(form.amount, expectedROIPercent);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.amount) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/investors/investment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          amount: form.amount,
          opportunityId,
          message: form.message,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Failed');
      localStorage.setItem(`afriyield_invest_amount_${opportunityId}`, String(form.amount || ''));
      setSent(true);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ background: '#0d1f17' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: '#B5850A' }} />
          <p className="mt-3 text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: '#0d1f17', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-8 space-y-6">
        <Link to="/afri-yield/opportunities" className="text-sm font-semibold text-[#B5850A] hover:underline">
          ← {i18n.language === 'fr' ? 'Retour aux opportunités' : 'Back to opportunities'}
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: '#F5F0E8' }}>
          {i18n.language === 'fr' ? 'Confirmer mon investissement' : 'Confirm my investment'}
        </h1>
        <p className="text-sm md:text-base" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {isFr
            ? "Tout est expliqué simplement — aucun jargon. Vous confirmez d'abord, puis nous vous envoyons les instructions."
            : 'Everything is explained simply — no jargon. You confirm first, then we send instructions.'}
        </p>

        {!kycState.loading && !kycState.canInvest && (
          <div className="max-w-2xl mx-auto">
            <div
              className="rounded-2xl border p-6 text-center"
              style={{
                background: kycState.needsKYC ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                borderColor: kycState.needsKYC ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)',
              }}
            >
              <div className="text-4xl mb-3">
                {!kycState.isRegistered ? '💰' : kycState.needsKYC ? '🪪' : '⏳'}
              </div>
              <h2 className="text-white font-bold text-xl mb-2">
                {!kycState.isRegistered
                  ? isFr
                    ? 'Inscription requise'
                    : 'Registration Required'
                  : kycState.needsKYC
                    ? isFr
                      ? 'Vérification KYC requise'
                      : 'KYC Verification Required'
                    : isFr
                      ? 'Vérification en cours'
                      : 'Verification in Progress'}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {!kycState.isRegistered
                  ? isFr
                    ? 'Inscrivez-vous comme investisseur AfriYield pour continuer.'
                    : 'Register as an AfriYield investor to continue.'
                  : kycState.needsKYC
                    ? isFr
                      ? "Une vérification d'identité (KYC) est requise avant d'investir. Cela protège tous les investisseurs."
                      : 'Identity verification (KYC) is required before investing. This protects all investors.'
                    : isFr
                      ? `Votre KYC est en cours de révision. Délai estimé: ${kycState.category === 'diaspora' ? '24 heures' : '48-72 heures'}. Vous recevrez un email de confirmation.`
                      : `Your KYC is under review. Estimated time: ${kycState.category === 'diaspora' ? '24 hours' : '48-72 hours'}. You will receive a confirmation email.`}
              </p>
              {!kycState.kycUnderReview && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('afriyield_invest_return', window.location.pathname);
                    navigate(`/afri-yield/register${kycState.needsKYC ? '?step=kyc' : ''}`);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-black text-sm"
                  style={{ backgroundColor: '#B5850A' }}
                >
                  {!kycState.isRegistered
                    ? isFr
                      ? "S'inscrire maintenant →"
                      : 'Register Now →'
                    : isFr
                      ? 'Compléter le KYC →'
                      : 'Complete KYC →'}
                </button>
              )}
              {kycState.kycUnderReview && (
                <div className="flex flex-col gap-2 items-center">
                  <div
                    className="animate-spin w-8 h-8 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: '#60a5fa' }}
                  />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isFr ? 'En attente de validation...' : 'Awaiting validation...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(kycState.canInvest || kycState.loading) && (
          <>
        {error ? (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        ) : null}

        {/* Section 1 — Opportunity Summary */}
        <div className="rounded-2xl p-5" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(245,240,232,0.45)' }}>
            {i18n.language === 'fr' ? 'Résumé' : 'Summary'}
          </p>
          <h2 className="mt-2 text-xl font-bold" style={{ color: '#F5F0E8' }}>
            {oppName}
          </h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              [i18n.language === 'fr' ? 'Produit' : 'Commodity', commodity],
              [i18n.language === 'fr' ? 'Piste' : 'Track', track],
              [i18n.language === 'fr' ? 'Montant' : 'Amount', form.amount ? fmtMoney(form.amount) : '—'],
              [isFr ? 'Retour attendu' : 'Expected return', roiDisplay],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs" style={{ color: 'rgba(245,240,232,0.45)' }}>
                  {label}
                </p>
                <p className="mt-1 font-bold tabular-nums text-[#B5850A]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'rgba(245,240,232,0.65)' }}>
              {i18n.language === 'fr' ? 'Calendrier de versement (exemple)' : 'Payout schedule (example)'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p style={{ color: 'rgba(245,240,232,0.45)' }}>June 2026</p>
                <p className="tabular-nums font-bold" style={{ color: '#F5F0E8' }}>
                  {payouts ? fmtMoney(payouts.june) : '—'}
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(245,240,232,0.45)' }}>December 2026</p>
                <p className="tabular-nums font-bold" style={{ color: '#F5F0E8' }}>
                  {payouts ? fmtMoney(payouts.december) : '—'}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'rgba(245,240,232,0.45)' }}>
              {i18n.language === 'fr'
                ? `Total annuel (approx.) : ${payouts ? fmtMoney(payouts.annual) : '—'}`
                : `Annual total (approx.): ${payouts ? fmtMoney(payouts.annual) : '—'}`}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-white/60 mb-3">
            {i18n.language === 'fr' ? 'Méthode de paiement:' : 'Payment method:'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'stripe',
                label:
                  i18n.language === 'fr' ? '💳 Carte bancaire' : '💳 Card payment',
                sub: 'Visa, MC, Amex, Apple/Google Pay',
                badge: i18n.language === 'fr' ? 'Recommandé' : 'Recommended',
              },
              {
                id: 'wire',
                label:
                  i18n.language === 'fr' ? '🏦 Virement bancaire' : '🏦 Wire transfer',
                sub: 'WISE, Zelle, SWIFT',
                badge: null,
              },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === m.id
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-sm">{m.label}</span>
                  {m.badge && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs">{m.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2 — How to send your investment */}
        <div className="rounded-2xl p-5" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.15)' }}>
          <h3 className="text-white font-bold text-lg mb-4">
            {i18n.language === 'fr' ? "Comment envoyer votre investissement" : 'How to send your investment'}
          </h3>
          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.number} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold tabular-nums"
                    style={{ background: 'rgba(181,133,10,0.18)', color: '#B5850A', border: '1px solid rgba(181,133,10,0.3)' }}
                  >
                    {s.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{s.title}</p>
                    <p className="text-white/55 text-sm mt-1 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 — Legal notice */}
        <div className="rounded-xl p-4" style={{ background: '#FFF3CD', border: '1px solid #B5850A' }}>
          <p className="text-[#1a3c2e] font-bold text-sm mb-2">
            {i18n.language === 'fr' ? '📋 Important à savoir' : '📋 Important to know'}
          </p>
          <ul className="space-y-1 text-[#1a3c2e]/70 text-xs">
            <li>
              •{' '}
              {i18n.language === 'fr'
                ? "Un contrat d'investissement formel vous sera envoyé avant tout transfert de fonds"
                : 'A formal investment agreement will be sent to you before any fund transfer'}
            </li>
            <li>
              •{' '}
              {i18n.language === 'fr'
                ? 'Les investissements Piste A sont adossés à des équipements physiques'
                : 'Track A investments are backed by physical equipment owned by the cooperative'}
            </li>
            <li>
              •{' '}
              {i18n.language === 'fr'
                ? 'Les versements ROI sont distribués deux fois par an (juin et décembre)'
                : 'ROI payouts are distributed twice annually (June and December)'}
            </li>
            <li>
              •{' '}
              {i18n.language === 'fr'
                ? "AfriYield Exchange prélève 5% de frais de facilitation sur le capital déployé"
                : 'AfriYield Exchange charges a 5% facilitation fee on capital deployed'}
            </li>
          </ul>
        </div>

        {/* Section 4 — Commitment form */}
        <div className="rounded-2xl p-6" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}>
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-white font-bold text-xl mb-2">
                {i18n.language === 'fr' ? 'Engagement reçu !' : 'Commitment received!'}
              </h3>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                {i18n.language === 'fr'
                  ? "Notre équipe vous enverra les instructions de paiement et votre contrat d'investissement dans les 24 heures."
                  : 'Our team will send you payment instructions and your investment agreement within 24 hours.'}
              </p>
              <Link
                to="/afri-yield/portal"
                className="inline-block mt-6 rounded-xl px-6 py-3 font-bold text-[#0d1f17]"
                style={{ background: '#B5850A' }}
              >
                {i18n.language === 'fr' ? 'Retour à mon portail' : 'Back to my portal'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">
                {i18n.language === 'fr' ? 'Votre engagement' : 'Your commitment'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-white/60 text-xs font-semibold">
                    {i18n.language === 'fr' ? 'Nom' : 'Name'}
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-xl px-3 py-3 text-sm bg-white/5 border border-white/10 outline-none focus:border-[#B5850A]"
                    style={{ color: '#F5F0E8' }}
                  />
                </label>
                <label className="block">
                  <span className="text-white/60 text-xs font-semibold">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-xl px-3 py-3 text-sm bg-white/5 border border-white/10 outline-none focus:border-[#B5850A]"
                    style={{ color: '#F5F0E8' }}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-white/60 text-xs font-semibold">
                  {i18n.language === 'fr' ? 'Montant à investir ($)' : 'Amount to invest ($)'}
                </span>
                <input
                  type="number"
                  min={paymentMethod === 'stripe' ? '500' : '1'}
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-xl px-3 py-3 text-sm bg-white/5 border border-white/10 outline-none focus:border-[#B5850A] tabular-nums"
                  style={{ color: '#F5F0E8' }}
                />
              </label>

              {paymentMethod === 'stripe' ? (
                <StripeInvestmentCheckout
                  opportunityId={opportunityId}
                  opportunityName={oppName}
                  amountUSD={form.amount}
                  investorEmail={form.email}
                  investorName={form.name}
                  expectedROI={expectedROIPercent}
                  isFr={isFr}
                  submitting={submitting}
                  pageLoading={loading}
                  onCancel={() => setPaymentMethod('wire')}
                />
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <label className="block">
                    <span className="text-white/60 text-xs font-semibold">
                      {i18n.language === 'fr'
                        ? 'Message ou questions (optionnel)'
                        : 'Message or questions (optional)'}
                    </span>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      className="mt-1 w-full rounded-xl px-3 py-3 text-sm bg-white/5 border border-white/10 outline-none focus:border-[#B5850A]"
                      style={{ color: '#F5F0E8' }}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl py-3 font-bold text-[#0d1f17] disabled:opacity-60"
                    style={{ background: '#B5850A' }}
                  >
                    {submitting
                      ? i18n.language === 'fr'
                        ? 'Envoi...'
                        : 'Sending...'
                      : i18n.language === 'fr'
                        ? 'Confirmer mon engagement'
                        : 'Confirm my commitment'}
                  </button>

                  <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.45)' }}>
                    {i18n.language === 'fr'
                      ? "Aucun paiement n'est envoyé à cette étape. Vous recevrez d'abord les instructions par email."
                      : 'No payment is sent at this step. You will first receive instructions by email.'}
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

