import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Loader2, X } from 'lucide-react';

const getSampleOpportunities = (t) => [
  {
    id: 'sample-1',
    isFallback: true,
    name: 'Centre Karité Premium',
    location: t('afriYield.locations.sikasso'),
    commodities: ['shea'],
    tracks: ['A'],
    certLabel: t('afriYield.certified.regional'),
    certTone: 'blue',
    certTier: 'regional',
    amount: t('afriYield.seeking', {
      amount: (25000).toLocaleString(),
      purpose: t('afriYield.equipment.coldStorage'),
    }),
    description: t('afriYield.sampleDesc.coldStorage'),
  },
  {
    id: 'sample-2',
    isFallback: true,
    name: 'Coopérative Sésame Excellence',
    location: t('afriYield.locations.kayes'),
    commodities: ['sesame'],
    tracks: ['A'],
    certLabel: t('afriYield.certified.local'),
    certTone: 'gray',
    certTier: 'local',
    amount: t('afriYield.seeking', {
      amount: (15000).toLocaleString(),
      purpose: t('afriYield.equipment.drying'),
    }),
    description: t('afriYield.sampleDesc.memberFarmers', { count: 47 }),
  },
  {
    id: 'sample-3',
    isFallback: true,
    name: 'AfriProcess Hub',
    location: t('afriYield.locations.dakar'),
    commodities: ['shea', 'sesame'],
    tracks: ['B'],
    certLabel: t('afriYield.certified.usda'),
    certTone: 'emerald',
    certTier: 'usda',
    amount: t('afriYield.seeking', {
      amount: (50000).toLocaleString(),
      purpose: t('afriYield.equipment.branding'),
    }),
    description: t('afriYield.sampleDesc.exportPipeline'),
  },
  {
    id: 'sample-4',
    isFallback: true,
    name: 'Golden Shea Cooperative',
    location: t('afriYield.locations.korhogo'),
    commodities: ['shea'],
    tracks: ['A'],
    certLabel: t('afriYield.certified.local'),
    certTone: 'gray',
    certTier: 'local',
    amount: t('afriYield.seeking', {
      amount: (20000).toLocaleString(),
      purpose: t('afriYield.equipment.processing'),
    }),
    description: t('afriYield.sampleDesc.memberFarmers', { count: 28 }),
  },
  {
    id: 'sample-5',
    isFallback: true,
    name: 'Sesame Valley Processors',
    location: t('afriYield.locations.tamale'),
    commodities: ['sesame'],
    tracks: ['B'],
    certLabel: t('afriYield.certified.regional'),
    certTone: 'blue',
    certTier: 'regional',
    amount: t('afriYield.seeking', {
      amount: (35000).toLocaleString(),
      purpose: t('afriYield.equipment.marketDev'),
    }),
    description: t('afriYield.sampleDesc.buyerJapan'),
  },
  {
    id: 'sample-6',
    isFallback: true,
    name: 'West Africa Shea Alliance',
    location: t('afriYield.locations.thies'),
    commodities: ['shea'],
    tracks: ['A', 'B'],
    certLabel: t('afriYield.certified.usda'),
    certTone: 'amber',
    certTier: 'international',
    amount: t('afriYield.seeking', {
      amount: (75000).toLocaleString(),
      purpose: t('afriYield.equipment.supplyChain'),
    }),
    description: t('afriYield.sampleDesc.memberFarmers', { count: 120 }),
  },
];

const certStyles = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  blue: 'bg-blue-50 text-blue-900 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
};

function normalizeApiOpportunity(o) {
  const commodities = [];
  if (o.commodity === 'Shea Butter' || o.commodity === 'Both') commodities.push('shea');
  if (o.commodity === 'Sesame' || o.commodity === 'Both') commodities.push('sesame');
  const tracks = [];
  if (o.track === 'Track A' || o.track === 'Both') tracks.push('A');
  if (o.track === 'Track B' || o.track === 'Both') tracks.push('B');
  let certTier = 'local';
  if (o.certificationStatus === 'Regional') certTier = 'regional';
  if (o.certificationStatus === 'International (USDA)') certTier = 'international';
  const certToneMap = {
    Local: 'gray',
    Regional: 'blue',
    'International (USDA)': 'amber',
  };
  const certTone = certToneMap[o.certificationStatus] || 'gray';
  const certLabel =
    o.certificationStatus === 'International (USDA)'
      ? 'International (USDA)'
      : o.certificationStatus === 'Regional'
        ? 'Regional Certified'
        : o.certificationStatus === 'Local'
          ? 'Local Certified'
          : 'Certified';
  const amt = Number(o.amountSought);
  const amountLine = `Seeking $${Number.isFinite(amt) ? amt.toLocaleString() : o.amountSought} USD`;
  return {
    id: o._id,
    _id: o._id,
    isFallback: false,
    name: o.centerName,
    location: o.location,
    commodities,
    tracks,
    certLabel,
    certTone,
    certTier,
    amount: amountLine,
    description: o.description || '',
  };
}

function matchesFilter(filterId, opp) {
  if (filterId === 'all') return true;
  if (filterId === 'shea') return opp.commodities.includes('shea');
  if (filterId === 'sesame') return opp.commodities.includes('sesame');
  if (filterId === 'trackA') return opp.tracks.includes('A');
  if (filterId === 'trackB') return opp.tracks.includes('B');
  if (filterId === 'certified') return opp.certTier !== 'local';
  return true;
}

function commodityBadge(opp, t) {
  if (opp.commodities.length > 1) return t('afriYield.commodityBoth');
  return opp.commodities.includes('shea') ? t('afriYield.sheaButter') : t('afriYield.sesame');
}

function trackBadge(opp, t) {
  if (opp.tracks.includes('A') && opp.tracks.includes('B')) return t('afriYield.trackBoth');
  return opp.tracks.includes('A') ? t('afriYield.trackAOnly') : t('afriYield.trackBOnly');
}

export default function InvestmentOpportunities() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const filters = useMemo(
    () => [
      { id: 'all', label: t('afriYield.filterAll') },
      { id: 'shea', label: t('afriYield.sheaButter') },
      { id: 'sesame', label: t('afriYield.sesame') },
      { id: 'trackA', label: t('afriYield.filterTrackA') },
      { id: 'trackB', label: t('afriYield.filterTrackB') },
      { id: 'certified', label: t('afriYield.filterCertified') },
    ],
    [t]
  );
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [apiRows, setApiRows] = useState([]);
  const [useApi, setUseApi] = useState(false);
  const [meetingOpp, setMeetingOpp] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    investorName: '',
    investorEmail: '',
    preferredDate: '',
    message: '',
  });
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingBanner, setMeetingBanner] = useState(null);
  const [meetingError, setMeetingError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.BASE);
        const data = await r.json();
        const list = data?.opportunities ?? (Array.isArray(data) ? data : []);
        if (!cancelled && r.ok && Array.isArray(list) && list.length > 0) {
          setApiRows(list.map(normalizeApiOpportunity));
          setUseApi(true);
        } else if (!cancelled) {
          setUseApi(false);
        }
      } catch {
        if (!cancelled) setUseApi(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sampleOpportunities = useMemo(() => getSampleOpportunities(t), [t]);
  const sourceList = useApi && apiRows.length > 0 ? apiRows : sampleOpportunities;

  const visible = useMemo(
    () => sourceList.filter((o) => matchesFilter(activeFilter, o)),
    [activeFilter, sourceList]
  );

  const openMeeting = (opp) => {
    setMeetingBanner(null);
    setMeetingError(null);
    setMeetingForm({ investorName: '', investorEmail: '', preferredDate: '', message: '' });
    setMeetingOpp(opp);
  };

  const submitMeeting = async (e) => {
    e.preventDefault();
    if (!meetingOpp || meetingOpp.isFallback || !meetingOpp._id) return;
    setMeetingSubmitting(true);
    setMeetingError(null);
    try {
      const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.MEETING_REQUEST(meetingOpp._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorName: meetingForm.investorName,
          investorEmail: meetingForm.investorEmail,
          preferredDate: meetingForm.preferredDate,
          message: meetingForm.message,
          centerName: meetingOpp.name,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || 'Request failed');
      }
      setMeetingBanner(t('afriYield.meetingSuccess'));
      setMeetingForm({ investorName: '', investorEmail: '', preferredDate: '', message: '' });
    } catch (err) {
      setMeetingError(err.message || t('afriYield.meetingErrorGeneric'));
    } finally {
      setMeetingSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-cream min-h-[60vh]">
      <section className="bg-[#1a3c2e] py-14">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">{t('afriYield.opportunities')}</h1>
          <p className="mt-3 text-lg text-white/85 max-w-2xl mx-auto">{t('afriYield.browseOpportunities')}</p>
        </div>
      </section>

      <section className="section-container pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-[#1a3c2e]" aria-hidden />
            <p className="text-sm font-medium text-gray-600">{t('common.loading')}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                    activeFilter === f.id
                      ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]'
                      : 'bg-white text-brand-forest border-gray-200 hover:border-[#B5850A]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {visible.map((opp) => {
                const canOpenDetail = !opp.isFallback && Boolean(opp._id);
                return (
                <article
                  key={opp.id}
                  className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-md flex flex-col ${
                    canOpenDetail ? 'cursor-pointer transition hover:border-[#B5850A]/40 hover:shadow-lg' : ''
                  }`}
                  onClick={canOpenDetail ? () => navigate(`/afri-yield/opportunities/${opp._id}`) : undefined}
                  onKeyDown={
                    canOpenDetail
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/afri-yield/opportunities/${opp._id}`);
                          }
                        }
                      : undefined
                  }
                  role={canOpenDetail ? 'link' : undefined}
                  tabIndex={canOpenDetail ? 0 : undefined}
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="rounded-full bg-[#1a3c2e]/10 px-3 py-0.5 text-xs font-bold text-[#1a3c2e]">
                      {commodityBadge(opp, t)}
                    </span>
                    <span className="rounded-full bg-[#B5850A]/15 px-3 py-0.5 text-xs font-bold text-[#9a7109]">
                      {trackBadge(opp, t)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-bold ${certStyles[opp.certTone]}`}
                    >
                      {opp.certLabel}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-brand-forest">{opp.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{opp.location}</p>
                  <p className="mt-4 font-semibold text-gray-900">{opp.amount}</p>
                  <p className="mt-2 text-gray-600 text-sm flex-1">{opp.description}</p>
                  <div
                    className="mt-6 flex flex-col sm:flex-row gap-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openMeeting(opp)}
                      className="flex-1 rounded-lg bg-[#B5850A] px-4 py-3 text-sm font-bold text-white hover:bg-[#9a7109] transition"
                    >
                      {t('afriYield.scheduleMeeting')}
                    </button>
                    <Link
                      to={`/afri-yield/invest/${opp._id || opp.id || 'sample'}`}
                      className="flex-1 rounded-lg border-2 border-[#1a3c2e] px-4 py-3 text-sm font-bold text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition text-center"
                    >
                      {t('afriYield.investNow') || 'Invest Now'}
                    </Link>
                  </div>
                </article>
              );
              })}
            </div>

            {visible.length === 0 ? (
              <p className="text-center text-gray-600 py-12">{t('afriYield.noMatchFilter')}</p>
            ) : null}
          </>
        )}
      </section>

      {meetingOpp ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
              onClick={() => setMeetingOpp(null)}
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="meeting-modal-title" className="text-xl font-bold text-brand-forest pr-8">
              {t('afriYield.meetingModalTitle')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{meetingOpp.name}</p>

            {meetingOpp.isFallback ? (
              <p className="mt-4 text-sm text-gray-700">{t('afriYield.meetingFallbackHint')}</p>
            ) : (
              <form onSubmit={submitMeeting} className="mt-6 space-y-4">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">{t('afriYield.investorName')} *</span>
                  <input
                    required
                    value={meetingForm.investorName}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, investorName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">{t('contact.email')} *</span>
                  <input
                    type="email"
                    required
                    value={meetingForm.investorEmail}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, investorEmail: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">{t('afriYield.preferredDate')}</span>
                  <input
                    type="date"
                    value={meetingForm.preferredDate}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, preferredDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">{t('contact.message')}</span>
                  <textarea
                    rows={3}
                    value={meetingForm.message}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, message: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </label>
                {meetingError ? (
                  <p className="text-sm text-red-600">{meetingError}</p>
                ) : null}
                {meetingBanner ? (
                  <p className="text-sm text-green-700 font-medium">{meetingBanner}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={meetingSubmitting}
                  className="w-full rounded-lg bg-[#B5850A] py-3 font-bold text-white hover:bg-[#9a7109] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {meetingSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {t('common.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
