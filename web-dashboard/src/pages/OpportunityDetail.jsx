import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Loader2, X } from 'lucide-react';

const certStyles = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  blue: 'bg-blue-50 text-blue-900 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
};

function commodityLabel(o) {
  if (o.commodity === 'Both') return 'Shea + Sesame';
  return o.commodity === 'Shea Butter' ? 'Shea Butter' : 'Sesame';
}

function trackLabel(o) {
  if (o.track === 'Both') return 'Track A + B';
  return o.track || '';
}

function certToneAndLabel(o) {
  const certToneMap = {
    Local: 'gray',
    Regional: 'blue',
    'International (USDA)': 'amber',
  };
  const tone = certToneMap[o.certificationStatus] || 'gray';
  const certLabel =
    o.certificationStatus === 'International (USDA)'
      ? 'International (USDA)'
      : o.certificationStatus === 'Regional'
        ? 'Regional Certified'
        : o.certificationStatus === 'Local'
          ? 'Local Certified'
          : o.certificationStatus || 'Certified';
  return { tone, certLabel };
}

function parseBuyers(existingBuyers) {
  if (!existingBuyers || typeof existingBuyers !== 'string') return [];
  return existingBuyers
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-brand-cream px-4 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#1a3c2e]" aria-hidden />
        <p className="text-sm font-medium text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="section-container py-16 text-center bg-brand-cream min-h-[40vh]">
        <p className="text-gray-700">{error || t('opportunityDetail.notFound')}</p>
        <Link to="/afri-yield/opportunities" className="mt-4 inline-block text-[#B5850A] font-semibold underline">
          {t('opportunityDetail.backToList')}
        </Link>
      </div>
    );
  }

  const { tone, certLabel } = certToneAndLabel(opportunity);
  const buyers = parseBuyers(opportunity.existingBuyers);
  const amt = Number(opportunity.amountSought);
  const amountLine = Number.isFinite(amt)
    ? `$${amt.toLocaleString()} USD`
    : String(opportunity.amountSought ?? '');

  return (
    <div className="bg-brand-cream pb-20">
      <section className="bg-[#1a3c2e] py-10">
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
            <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${certStyles[tone] || certStyles.gray}`}>
              {certLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="section-container mt-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="text-lg font-extrabold text-brand-forest">{t('opportunityDetail.overview')}</h2>
            <p className="mt-3 text-gray-700 whitespace-pre-wrap">{opportunity.description}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('opportunityDetail.amountSought')}
                </dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">{amountLine}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('opportunityDetail.memberFarmers')}
                </dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">{opportunity.memberFarmers ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="text-lg font-extrabold text-brand-forest">{t('opportunityDetail.contact')}</h2>
            <ul className="mt-3 space-y-2 text-gray-700">
              {opportunity.contactName ? (
                <li>
                  <span className="font-semibold text-brand-forest">{t('opportunityDetail.name')}: </span>
                  {opportunity.contactName}
                </li>
              ) : null}
              {opportunity.contactEmail ? (
                <li>
                  <span className="font-semibold text-brand-forest">{t('contact.email')}: </span>
                  <a className="text-[#B5850A] underline" href={`mailto:${opportunity.contactEmail}`}>
                    {opportunity.contactEmail}
                  </a>
                </li>
              ) : null}
              {opportunity.contactPhone ? (
                <li>
                  <span className="font-semibold text-brand-forest">{t('opportunityDetail.phone')}: </span>
                  <a className="text-[#B5850A] underline" href={`tel:${opportunity.contactPhone}`}>
                    {opportunity.contactPhone}
                  </a>
                </li>
              ) : null}
              {!opportunity.contactName && !opportunity.contactEmail && !opportunity.contactPhone ? (
                <li className="text-gray-500">{t('opportunityDetail.contactPending')}</li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="text-lg font-extrabold text-brand-forest">{t('opportunityDetail.buyers')}</h2>
            {buyers.length > 0 ? (
              <ul className="mt-3 list-disc list-inside space-y-1 text-gray-700">
                {buyers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-gray-600">{t('opportunityDetail.noBuyersListed')}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={openModal}
              className="rounded-lg bg-[#B5850A] px-6 py-3 text-center text-sm font-bold text-white hover:bg-[#9a7109] transition"
            >
              {t('opportunityDetail.scheduleMeeting')}
            </button>
            <Link
              to="/afri-yield/register"
              className="rounded-lg border-2 border-[#1a3c2e] px-6 py-3 text-center text-sm font-bold text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
            >
              {t('opportunityDetail.expressInterest')}
            </Link>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opp-meeting-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
              onClick={() => setModalOpen(false)}
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="opp-meeting-title" className="text-xl font-bold text-brand-forest pr-8">
              {t('opportunityDetail.scheduleMeeting')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{opportunity.centerName}</p>

            <form onSubmit={submitMeeting} className="mt-6 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('opportunityDetail.investorName')} *</span>
                <input
                  required
                  value={form.investorName}
                  onChange={(e) => setForm((p) => ({ ...p, investorName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('contact.email')} *</span>
                <input
                  type="email"
                  required
                  value={form.investorEmail}
                  onChange={(e) => setForm((p) => ({ ...p, investorEmail: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('opportunityDetail.preferredDate')}</span>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('contact.message')}</span>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                />
              </label>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              {banner ? <p className="text-sm text-green-700 font-medium">{banner}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#B5850A] py-3 font-bold text-white hover:bg-[#9a7109] disabled:opacity-60 inline-flex items-center justify-center gap-2"
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
