import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { useInvestorKYCStatus } from '../hooks/useInvestorKYCStatus';
import { Loader2, X } from 'lucide-react';

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.1)',
};

const INPUT_CLS =
  'w-full rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-amber-500/60';
const LABEL_CLS = 'text-sm font-medium text-white/70';

const certBadgeStyle = {
  gray: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' },
  blue: { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' },
  emerald: { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
  amber: { background: 'rgba(245,158,11,0.15)', color: '#B5850A', border: '1px solid rgba(245,158,11,0.3)' },
};

function commodityLabel(o) {
  if (o.commodity === 'Both') return 'Shea + Sesame';
  if (o.commodity && typeof o.commodity === 'string') return o.commodity;
  return '—';
}

function trackLabel(o) {
  if (o.track === 'Both') return 'Track A + B';
  if (o.track === 'All') return 'All tracks';
  return o.track || '';
}

function certToneAndLabel(o) {
  const cert = o.certificationStatus || 'Local';
  const certToneMap = {
    Local: 'gray',
    Regional: 'blue',
    'Regional (ECOWAS)': 'blue',
    'International (USDA)': 'amber',
    'International (EU/USDA)': 'amber',
    Pending: 'gray',
  };
  const tone = certToneMap[cert] || 'gray';
  const certLabel =
    cert === 'Regional'
      ? 'Regional Certified'
      : cert === 'Regional (ECOWAS)'
        ? 'Regional (ECOWAS)'
        : cert === 'International (USDA)' || cert === 'International (EU/USDA)'
          ? cert
          : cert === 'Local'
            ? 'Local Certified'
            : cert === 'Pending'
              ? 'Pending'
              : cert || 'Certified';
  return { tone, certLabel };
}

function parseBuyers(existingBuyers) {
  if (!existingBuyers || typeof existingBuyers !== 'string') return [];
  return existingBuyers
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function projectedReturnLabel(opportunity) {
  const min = opportunity.expectedROIMin;
  const max = opportunity.expectedROIMax;
  if (min != null && max != null) return `~${min}–${max}% proj.`;
  const pct = opportunity.expectedROIPercent;
  if (pct != null && pct !== '') return `~${pct}% proj.`;
  return '~8% proj.';
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const kycState = useInvestorKYCStatus();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opportunity, setOpportunity] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    investorName: '',
    investorEmail: '',
    preferredDate: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id));
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(data.error || data.message || 'Not found');
        }
        const opp = data?.opportunity ?? data;
        if (!cancelled) {
          setOpportunity(opp);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const openModal = () => {
    setBanner(null);
    setFormError(null);
    setForm({ investorName: '', investorEmail: '', preferredDate: '', message: '' });
    setModalOpen(true);
  };

  const submitMeeting = async (e) => {
    e.preventDefault();
    const oppId = opportunity?._id || id;
    if (!oppId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.MEETING_REQUEST(oppId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorName: form.investorName,
          investorEmail: form.investorEmail,
          preferredDate: form.preferredDate,
          message: form.message,
          centerName: opportunity.centerName,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || 'Request failed');
      }
      setBanner(t('opportunityDetail.meetingSent'));
      setForm({ investorName: '', investorEmail: '', preferredDate: '', message: '' });
    } catch (err) {
      setFormError(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvestClick = () => {
    const investPath = `/afri-yield/invest/${opportunity?._id || id}`;
    if (!kycState.isRegistered) {
      localStorage.setItem('afriyield_invest_return', investPath);
      navigate('/afri-yield/register');
      return;
    }
    if (kycState.needsKYC) {
      localStorage.setItem('afriyield_invest_return', investPath);
      navigate('/afri-yield/register?step=kyc');
      return;
    }
    if (kycState.kycUnderReview && kycState.category !== 'african') {
      alert(
        isFr
          ? 'Votre vérification KYC est en cours. Vous serez notifié par email sous 24-48h.'
          : 'Your KYC verification is under review. You will be notified by email within 24-48h.'
      );
      return;
    }
    navigate(investPath);
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-20"
        style={{ background: '#080d1a', minHeight: '100vh' }}
      >
        <Loader2 className="h-10 w-10 animate-spin text-teal-400" aria-hidden />
        <p className="text-sm font-medium text-white/50">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div
        className="section-container py-16 text-center min-h-[40vh]"
        style={{ background: '#080d1a', minHeight: '100vh' }}
      >
        <p className="text-white/70">{error || t('opportunityDetail.notFound')}</p>
        <Link to="/afri-yield/opportunities" className="mt-4 inline-block text-[#B5850A] font-semibold underline">
          {t('opportunityDetail.backToList')}
        </Link>
      </div>
    );
  }

  const { tone, certLabel } = certToneAndLabel(opportunity);
  const buyers = parseBuyers(opportunity.existingBuyers);
  const amt = Number(opportunity.amountSought ?? opportunity.amountTarget);
  const amountLine = Number.isFinite(amt) ? `$${amt.toLocaleString()} USD` : String(opportunity.amountSought ?? '—');
  const certStyle = certBadgeStyle[tone] || certBadgeStyle.gray;
  const investBtnActive = kycState.canInvest || !kycState.isRegistered;
  const fundingTarget = opportunity.amountTarget || opportunity.amountSought || 0;
  const fundingPct =
    fundingTarget > 0
      ? Math.min(100, Math.round(((opportunity.amountFunded || 0) / fundingTarget) * 100))
      : 0;

  return (
    <div style={{ background: '#080d1a', minHeight: '100vh' }} className="pb-20">
      <section
        style={{
          background: 'linear-gradient(135deg, #0d2040 0%, #0a1628 100%)',
          borderBottom: '1px solid rgba(181,133,10,0.2)',
        }}
        className="py-12"
      >
        <div className="section-container">
          <Link
            to="/afri-yield/opportunities"
            className="inline-flex text-sm font-semibold text-[#B5850A] hover:underline"
          >
            ← {t('opportunityDetail.backToList')}
          </Link>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-white">{opportunity.centerName}</h1>
          <p className="mt-2 text-lg text-white/85">{opportunity.location}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold text-[#B5850A]">
              {commodityLabel(opportunity)}
            </span>
            <span className="rounded-full bg-[#B5850A]/25 px-3 py-0.5 text-xs font-bold text-white">
              {trackLabel(opportunity)}
            </span>
            <span className="rounded-full border px-3 py-0.5 text-xs font-bold" style={certStyle}>
              {certLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 mb-2">
            {opportunity.verified && (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#4ade8020', color: '#4ade80' }}
              >
                ✓ {isFr ? 'Vérifié AfriYield' : 'AfriYield Verified'}
              </span>
            )}
            {opportunity.insuranceCoverage && (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#3b82f620', color: '#3b82f6' }}
              >
                🛡 {isFr ? 'Assuré' : 'Insured'}
              </span>
            )}
            {Number(opportunity.afriyieldScore) > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#B5850A20', color: '#B5850A' }}
              >
                ⭐ {isFr ? 'Score AfriYield' : 'AfriYield Score'}: {opportunity.afriyieldScore}/100
              </span>
            )}
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              🔒 {isFr ? 'Fonds en escrow agréé' : 'Funds in licensed escrow'}
            </span>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              ⚖️ {isFr ? 'Conforme OHADA' : 'OHADA Compliant'}
            </span>
          </div>

          {opportunity.milestones && opportunity.milestones.length > 0 && (
            <div className="rounded-2xl border p-5 mb-2" style={CARD_STYLE}>
              <h3 className="font-bold text-white mb-4">{isFr ? '🔒 Jalons escrow' : '🔒 Escrow Milestones'}</h3>
              <div className="space-y-3">
                {opportunity.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background:
                          m.status === 'released' ? '#4ade80' : m.status === 'verified' ? '#B5850A' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{m.label}</p>
                    </div>
                    <span className="text-xs text-white/40">{m.percentOfTotal != null ? `${m.percentOfTotal}%` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section-container mt-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: isFr ? 'Montant recherché' : 'Target Amount',
                value: `$${(opportunity.amountTarget ?? opportunity.amountSought ?? 0).toLocaleString()} USD`,
                color: '#B5850A',
              },
              {
                label: isFr ? 'Déjà financé' : 'Already Funded',
                value: `$${(opportunity.amountFunded || 0).toLocaleString()} USD`,
                color: '#1D9E75',
              },
              {
                label: isFr ? 'Rendement projeté' : 'Projected Return',
                value: projectedReturnLabel(opportunity),
                color: '#60a5fa',
              },
              {
                label: isFr ? 'Investissement min.' : 'Min. Investment',
                value: `$${(opportunity.minimumInvestmentUSD || 500).toLocaleString()}`,
                color: '#a78bfa',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {label}
                </p>
                <p className="text-xl font-bold" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {fundingTarget > 0 && (
            <div className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {isFr ? 'Progression du financement' : 'Funding Progress'}
                </span>
                <span style={{ color: '#1D9E75', fontWeight: 'bold' }}>
                  {fundingPct}%
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${fundingPct}%`,
                    background: 'linear-gradient(90deg, #1D9E75, #B5850A)',
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                ${(opportunity.amountFunded || 0).toLocaleString()}
                {isFr ? ' financés sur ' : ' funded of '}$
                {fundingTarget.toLocaleString()}
              </p>
            </div>
          )}

          <div className="rounded-2xl border p-6" style={CARD_STYLE}>
            <h2 className="text-lg font-extrabold text-white">{t('opportunityDetail.overview')}</h2>
            <p className="mt-3 text-white/60 whitespace-pre-wrap">{opportunity.description}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  {t('opportunityDetail.amountSought')}
                </dt>
                <dd className="mt-1 text-lg font-bold text-amber-400">{amountLine}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  {t('opportunityDetail.memberFarmers')}
                </dt>
                <dd className="mt-1 text-lg font-bold text-white">{opportunity.memberFarmers ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border p-6" style={CARD_STYLE}>
            <h2 className="text-lg font-extrabold text-white">{t('opportunityDetail.contact')}</h2>
            <ul className="mt-3 space-y-2 text-white/60">
              {opportunity.contactName ? (
                <li>
                  <span className="font-semibold text-white">{t('opportunityDetail.name')}: </span>
                  {opportunity.contactName}
                </li>
              ) : null}
              {opportunity.contactEmail ? (
                <li>
                  <span className="font-semibold text-white">{t('contact.email')}: </span>
                  <a className="text-[#B5850A] underline" href={`mailto:${opportunity.contactEmail}`}>
                    {opportunity.contactEmail}
                  </a>
                </li>
              ) : null}
              {opportunity.contactPhone ? (
                <li>
                  <span className="font-semibold text-white">{t('contact.phone')}: </span>
                  <a className="text-[#B5850A] underline" href={`tel:${opportunity.contactPhone}`}>
                    {opportunity.contactPhone}
                  </a>
                </li>
              ) : null}
              {!opportunity.contactName && !opportunity.contactEmail && !opportunity.contactPhone ? (
                <li className="text-white/50">{t('opportunityDetail.contactPending')}</li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-2xl border p-6" style={CARD_STYLE}>
            <h2 className="text-lg font-extrabold text-white">{t('opportunityDetail.buyers')}</h2>
            {buyers.length > 0 ? (
              <ul className="mt-3 list-disc list-inside space-y-1 text-white/60">
                {buyers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-white/50">{t('opportunityDetail.noBuyersListed')}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-[#B5850A] px-6 py-3 text-center text-sm font-bold text-black hover:opacity-90 transition"
            >
              {t('afriYield.scheduleMeeting')}
            </button>
            <button
              type="button"
              onClick={handleInvestClick}
              className="rounded-xl px-8 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: investBtnActive ? '#B5850A' : 'rgba(181,133,10,0.3)',
                color: investBtnActive ? 'black' : 'rgba(255,255,255,0.5)',
              }}
            >
              {!kycState.isRegistered
                ? `💰 ${isFr ? "S'inscrire pour investir" : 'Register to Invest'}`
                : kycState.needsKYC
                  ? `🪪 ${isFr ? 'Compléter le KYC' : 'Complete KYC'}`
                  : kycState.kycUnderReview && kycState.category !== 'african'
                    ? `⏳ ${isFr ? 'KYC en cours...' : 'KYC Under Review...'}`
                    : `💰 ${isFr ? 'Investir maintenant' : 'Invest Now'}`}
            </button>
          </div>

          {kycState.isRegistered && !kycState.canInvest && (kycState.needsKYC || kycState.kycUnderReview) && (
            <div
              className="rounded-xl border p-3 text-xs"
              style={{
                background: kycState.kycUnderReview ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)',
                borderColor: kycState.kycUnderReview ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)',
                color: kycState.kycUnderReview ? '#60a5fa' : '#B5850A',
              }}
            >
              {kycState.needsKYC
                ? isFr
                  ? '⚠️ Complétez votre vérification KYC pour accéder aux investissements.'
                  : '⚠️ Complete your KYC verification to access investments.'
                : kycState.kycUnderReview
                  ? isFr
                    ? `⏳ KYC en cours de révision. Délai: ${kycState.category === 'diaspora' ? '24 heures' : '48-72 heures'}.`
                    : `⏳ KYC under review. Timeline: ${kycState.category === 'diaspora' ? '24 hours' : '48-72 hours'}.`
                  : ''}
            </div>
          )}
        </div>
      </section>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opp-meeting-title"
        >
          <div
            className="max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative rounded-2xl border"
            style={{
              background: '#0e1d3a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              onClick={() => setModalOpen(false)}
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="opp-meeting-title" className="text-xl font-bold text-white pr-8">
              {t('afriYield.scheduleMeeting')}
            </h2>
            <p className="text-sm text-white/60 mt-1">{opportunity.centerName}</p>

            <form onSubmit={submitMeeting} className="mt-6 space-y-4">
              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('opportunityDetail.investorName')} *</span>
                <input
                  required
                  value={form.investorName}
                  onChange={(e) => setForm((p) => ({ ...p, investorName: e.target.value }))}
                  className={INPUT_CLS}
                />
              </label>
              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('contact.email')} *</span>
                <input
                  type="email"
                  required
                  value={form.investorEmail}
                  onChange={(e) => setForm((p) => ({ ...p, investorEmail: e.target.value }))}
                  className={INPUT_CLS}
                />
              </label>
              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('opportunityDetail.preferredDate')}</span>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                  className={INPUT_CLS}
                />
              </label>
              <label className="block space-y-1">
                <span className={LABEL_CLS}>{t('contact.message')}</span>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className={`${INPUT_CLS} resize-none`}
                />
              </label>
              {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
              {banner ? <p className="text-sm text-green-400 font-medium">{banner}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#B5850A] py-3 font-bold text-black hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {t('common.submit')}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
