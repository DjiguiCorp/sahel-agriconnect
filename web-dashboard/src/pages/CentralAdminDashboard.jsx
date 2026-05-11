import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CooperativesTab from '../components/admin/CooperativesTab';
import CooperativesDiasporaManagement from '../components/admin/CooperativesDiasporaManagement';
import InputsManagement from '../components/admin/InputsManagement';
import PartnershipsManagement from '../components/admin/PartnershipsManagement';
import ReportsTab from '../components/admin/ReportsManagement';
import RealTimeFarmers from '../components/admin/RealTimeFarmers';
import {
  PlanningTab,
  CertificationTab,
  LogisticsTab,
  mergeCooperativeSources,
} from '../components/admin/CentralAdminTabs';
import CentersManagement from '../components/admin/CentersManagement';
import BenefitsTab from '../components/admin/BenefitsTab';
import TrainingsManagement from '../components/admin/TrainingsManagement';
import IrrigationTab from '../components/admin/IrrigationTab';
import OptimizationTab from '../components/admin/OptimizationTab';
import AfriYieldAdminTab from '../components/admin/AfriYieldAdminTab';
import CountryLicensesManagement from '../components/admin/CountryLicensesManagement';
import GovernanceTab from '../components/admin/GovernanceTab';
import FarmerNeedsTab from '../components/admin/FarmerNeedsTab';
import Modal from '../components/Modal';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import ExpertRequestsManagement from '../components/admin/ExpertRequestsManagement';
import { useGeolocation } from '../hooks/useGeolocation';
import {
  Sprout,
  Handshake,
  Building2,
  BookOpen,
  Scale,
  Gift,
  Droplets,
  Bot,
  Calendar,
  Star,
  Truck,
  BarChart3,
  Database,
  Coins,
  BadgeCheck,
  ShieldAlert,
  MapPin,
  UserPlus,
  ClipboardList,
  Trash2,
  Wheat,
} from 'lucide-react';

const BASE_TABS = [
  { id: 'overview', labelKey: 'adminDashboard.tabs.overview', shortKey: 'adminDashboard.tabsShort.overview', Icon: ShieldAlert },
  { id: 'notifications', labelKey: 'adminDashboard.tabs.notifications', shortKey: 'adminDashboard.tabsShort.notifications', Icon: BadgeCheck },
  { id: 'deletions', labelKey: 'adminDashboard.tabs.deletions', shortKey: 'adminDashboard.tabsShort.deletions', Icon: Trash2 },
  { id: 'farmers', labelKey: 'adminDashboard.tabs.farmers', shortKey: 'adminDashboard.tabsShort.farmers', Icon: Sprout },
  { id: 'farmerNeeds', labelKey: 'adminDashboard.tabs.farmerNeeds', shortKey: 'adminDashboard.tabsShort.farmerNeeds', Icon: Wheat },
  { id: 'cooperatives', labelKey: 'adminDashboard.tabs.cooperatives', shortKey: 'adminDashboard.tabsShort.cooperatives', Icon: Handshake },
  { id: 'centers', labelKey: 'adminDashboard.tabs.centers', shortKey: 'adminDashboard.tabsShort.centers', Icon: Building2 },
  { id: 'trainings', labelKey: 'adminDashboard.tabs.trainings', shortKey: 'adminDashboard.tabsShort.trainings', Icon: BookOpen },
  { id: 'governance', labelKey: 'adminDashboard.tabs.governance', shortKey: 'adminDashboard.tabsShort.governance', Icon: Scale },
  { id: 'perks', labelKey: 'adminDashboard.tabs.perks', shortKey: 'adminDashboard.tabsShort.perks', Icon: Gift },
  { id: 'irrigation', labelKey: 'adminDashboard.tabs.irrigation', shortKey: 'adminDashboard.tabsShort.irrigation', Icon: Droplets },
  { id: 'optimization', labelKey: 'adminDashboard.tabs.optimization', shortKey: 'adminDashboard.tabsShort.optimization', Icon: Bot },
  { id: 'expertRequests', labelKey: 'adminDashboard.tabs.expertRequests', shortKey: 'adminDashboard.tabsShort.expertRequests', Icon: ClipboardList },
  { id: 'seasonal', labelKey: 'adminDashboard.tabs.seasonal', shortKey: 'adminDashboard.tabsShort.seasonal', Icon: Calendar },
  { id: 'certification', labelKey: 'adminDashboard.tabs.certification', shortKey: 'adminDashboard.tabsShort.certification', Icon: Star },
  { id: 'logistics', labelKey: 'adminDashboard.tabs.logistics', shortKey: 'adminDashboard.tabsShort.logistics', Icon: Truck },
  { id: 'reports', labelKey: 'adminDashboard.tabs.reports', shortKey: 'adminDashboard.tabsShort.reports', Icon: BarChart3 },
  { id: 'afriyield', labelKey: 'adminDashboard.tabs.afriyield', shortKey: 'adminDashboard.tabsShort.afriyield', Icon: Coins, accent: 'gold' },
];

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function fmtMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString()}`;
}

function timeAgo(d, t) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const diff = Date.now() - dt.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('adminDashboard.minutesAgo', { n: 0 });
  if (mins < 60) return t('adminDashboard.minutesAgo', { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('adminDashboard.hoursAgo', { n: hrs });
  const days = Math.floor(hrs / 24);
  return t('adminDashboard.daysAgo', { n: days });
}

function parseMoneyRangePotential(s) {
  const raw = String(s || '').trim();
  if (!raw) return 0;
  const parts = raw
    .replace(/[,]/g, '')
    .replace(/\$/g, '')
    .toLowerCase()
    .match(/(\d+(\.\d+)?)(\s*[km])?/g);
  if (!parts || parts.length === 0) return 0;
  const nums = parts
    .map((p) => {
      const m = String(p).match(/(\d+(\.\d+)?)(\s*[km])?/);
      if (!m) return 0;
      const n = Number(m[1]);
      const suf = (m[3] || '').trim();
      if (suf === 'k') return n * 1000;
      if (suf === 'm') return n * 1000000;
      return n;
    })
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return 0;
  return Math.max(...nums);
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-brand-forest">{value}</p>
    </div>
  );
}

function UrgentCard({ title, count, color, actionLabel, onAction }) {
  const badgeCls =
    color === 'red'
      ? 'bg-red-50 text-red-800 border-red-200'
      : color === 'amber'
        ? 'bg-amber-50 text-amber-900 border-amber-200'
        : color === 'gold'
          ? 'bg-[#fff7df] text-[#7a5b10] border-[#e9d7a7]'
          : 'bg-gray-50 text-gray-800 border-gray-200';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm w-[260px]">
      <div className="flex items-start justify-between gap-3">
        <p className="font-extrabold text-brand-forest">{title}</p>
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${badgeCls}`}>{count}</span>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 w-full rounded-xl bg-brand-forest text-white font-extrabold py-2.5 hover:bg-[#143326]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function OverviewControlTower({ onGoTab }) {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [cooperativesOverview, setCooperativesOverview] = useState([]);

  const [pendingFarmers, setPendingFarmers] = useState(0);
  const [pendingOpps, setPendingOpps] = useState(0);
  const [newExpert, setNewExpert] = useState(0);
  const [newQuotes, setNewQuotes] = useState(0);
  const [pendingCoops, setPendingCoops] = useState(0);

  const [metrics, setMetrics] = useState({
    activeLicenses: 0,
    mrr: 0,
    investors: 0,
    investorPotential: 0,
    activeCoops: 0,
    coopAnnual: 0,
    certifiedProducers: 0,
    certificationRevenue: 0,
  });

  const [pipeline, setPipeline] = useState({
    New: 0,
    'Call Scheduled': 0,
    'Call Completed': 0,
    'Opportunity Sent': 0,
    'Investment Active': 0,
    'Paid Out': 0,
  });

  const [feed, setFeed] = useState([]);
  const [quoteModal, setQuoteModal] = useState({ open: false, items: [] });

  const [investorModal, setInvestorModal] = useState({ open: false });
  const [investorForm, setInvestorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryOfResidence: '',
    investmentTrack: 'Both Tracks',
    commodityInterest: ['Both'],
    investmentRange: '',
    message: '',
  });
  const [investorSaving, setInvestorSaving] = useState(false);
  const [investorBanner, setInvestorBanner] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const headers = authHeaders();

      const [
        farmersPendingRes,
        oppAllRes,
        expertNewRes,
        quoteNewRes,
        coopPendingRes,
        licensesRes,
        investorsRes,
        pipelineRes,
        farmersAllRes,
        coopActiveRes,
        farmerRecentRes,
        investorRecentRes,
        coopRecentRes,
        expertRecentRes,
        quoteRecentRes,
      ] = await Promise.all([
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?statut=En%20attente&limit=1`, { headers }),
        fetch(API_ENDPOINTS.OPPORTUNITIES.ALL, { headers }),
        fetch(`${API_ENDPOINTS.EXPERTS.REQUESTS}?status=new`, { headers }),
        fetch(`${API_BASE_URL}/api/marketplace/quote-requests?status=new`, { headers }),
        fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations?status=pending`, { headers }),
        fetch(`${API_BASE_URL}/api/licenses`, { headers }),
        fetch(`${API_BASE_URL}/api/investors`, { headers }),
        fetch(`${API_BASE_URL}/api/investors/status-summary`, { headers }),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=500`, { headers }),
        fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations?status=active`, { headers }),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=2`, { headers }),
        fetch(`${API_BASE_URL}/api/investors`, { headers }),
        fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers }),
        fetch(`${API_ENDPOINTS.EXPERTS.REQUESTS}`, { headers }),
        fetch(`${API_BASE_URL}/api/marketplace/quote-requests`, { headers }),
      ]);

      const farmersPendingJson = await farmersPendingRes.json().catch(() => ({}));
      const oppAllJson = await oppAllRes.json().catch(() => ({}));
      const expertNewJson = await expertNewRes.json().catch(() => ({}));
      const quoteNewJson = await quoteNewRes.json().catch(() => ({}));
      const coopPendingJson = await coopPendingRes.json().catch(() => ({}));
      const licensesJson = await licensesRes.json().catch(() => ({}));
      const investorsJson = await investorsRes.json().catch(() => ({}));
      const pipelineJson = await pipelineRes.json().catch(() => ({}));
      const farmersAllJson = await farmersAllRes.json().catch(() => ({}));
      const coopActiveJson = await coopActiveRes.json().catch(() => ({}));

      const farmerRecentJson = await farmerRecentRes.json().catch(() => ({}));
      const investorRecentJson = await investorRecentRes.json().catch(() => ({}));
      const coopRecentJson = await coopRecentRes.json().catch(() => ({}));
      const expertRecentJson = await expertRecentRes.json().catch(() => ({}));
      const quoteRecentJson = await quoteRecentRes.json().catch(() => ({}));

      if (!oppAllRes.ok) throw new Error(oppAllJson.error || 'Failed to load overview');

      setPendingFarmers(Number(farmersPendingJson?.pagination?.total || (farmersPendingJson?.farmers?.length ?? 0)));
      const opps = Array.isArray(oppAllJson?.opportunities) ? oppAllJson.opportunities : [];
      setPendingOpps(opps.filter((o) => o.status === 'pending').length);
      setNewExpert(Array.isArray(expertNewJson?.requests) ? expertNewJson.requests.length : 0);
      setNewQuotes(Array.isArray(quoteNewJson?.quoteRequests) ? quoteNewJson.quoteRequests.length : 0);
      setPendingCoops(Array.isArray(coopPendingJson?.registrations) ? coopPendingJson.registrations.length : 0);

      const licenses = Array.isArray(licensesJson?.licenses) ? licensesJson.licenses : [];
      const activeLicenses = licenses.filter((l) => l.status === 'active');
      const mrr = activeLicenses.reduce((sum, l) => sum + (Number(l.monthlyFee) || 0), 0);

      const investors = Array.isArray(investorsJson?.investors) ? investorsJson.investors : [];
      const investorPotential = investors.reduce((sum, inv) => sum + parseMoneyRangePotential(inv.investmentRange), 0);

      const farmersAll = Array.isArray(farmersAllJson?.farmers) ? farmersAllJson.farmers : [];
      const certifiedProducers = farmersAll.filter((f) => String(f.qualityLevel || '').toLowerCase() === 'international').length;

      const activeCoops = Array.isArray(coopActiveJson?.registrations) ? coopActiveJson.registrations.length : 0;

      setMetrics({
        activeLicenses: activeLicenses.length,
        mrr,
        investors: investors.length,
        investorPotential,
        activeCoops,
        coopAnnual: activeCoops * 199,
        certifiedProducers,
        certificationRevenue: certifiedProducers * 299,
      });

      if (pipelineRes.ok && pipelineJson?.success && pipelineJson?.counts) {
        setPipeline((p) => ({ ...p, ...pipelineJson.counts }));
      }

      const farmerRecent = Array.isArray(farmerRecentJson?.farmers) ? farmerRecentJson.farmers.slice(0, 2) : [];
      const investorRecent = Array.isArray(investorRecentJson?.investors) ? investorRecentJson.investors.slice(0, 2) : [];
      const coopRecent = Array.isArray(coopRecentJson?.registrations) ? coopRecentJson.registrations.slice(0, 2) : [];
      const expertRecent = Array.isArray(expertRecentJson?.requests) ? expertRecentJson.requests.slice(0, 2) : [];
      const quoteRecent = Array.isArray(quoteRecentJson?.quoteRequests) ? quoteRecentJson.quoteRequests.slice(0, 2) : [];

      const events = [
        ...farmerRecent.map((f) => ({
          createdAt: f.createdAt,
          text: `🟢 Nouveau agriculteur — ${f.nom || '—'}, ${f.region || '—'}, ${f.country || '—'}`,
        })),
        ...investorRecent.map((i) => ({
          createdAt: i.createdAt,
          text: `🟡 Nouvel investisseur — ${i.fullName || '—'} — ${i.countryOfResidence || '—'}`,
        })),
        ...coopRecent.map((c) => ({
          createdAt: c.createdAt,
          text: `🟦 Nouvelle coopérative — ${c.cooperativeName || '—'} — ${c.country || '—'}`,
        })),
        ...expertRecent.map((r) => ({
          createdAt: r.createdAt,
          text: `🔴 Demande expert — ${r.farmerName || '—'} — ${r.urgency || '—'}`,
        })),
        ...quoteRecent.map((q) => ({
          createdAt: q.createdAt,
          text: `🟠 Demande de devis — ${q.companyName || q.buyerName || '—'} — ${q.productWanted || '—'}`,
        })),
      ]
        .filter((e) => e.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((e) => ({ ...e, ago: timeAgo(e.createdAt, t) }));

      setFeed(events);
      setQuoteModal((p) => ({ ...p, items: Array.isArray(quoteRecentJson?.quoteRequests) ? quoteRecentJson.quoteRequests : [] }));
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const h = authHeaders();
    Promise.all([
      fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers: h }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers: h }).then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        setCooperativesOverview(
          mergeCooperativeSources(a.cooperatives || [], b.registrations || [])
        );
      })
      .catch(() => {
        if (!cancelled) setCooperativesOverview([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createInvestor = async (e) => {
    e.preventDefault();
    setInvestorSaving(true);
    setInvestorBanner('');
    try {
      const r = await fetch(`${API_BASE_URL}/api/investors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investorForm),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Create failed');
      setInvestorBanner('Investisseur ajouté.');
      await load();
    } catch (e2) {
      setInvestorBanner(e2.message || 'Error');
    } finally {
      setInvestorSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">{t('common.loading')}</div>;
  if (err) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{err}</div>;

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          <UrgentCard
            title={t('adminDashboard.pendingProfiles')}
            count={pendingFarmers}
            color={pendingFarmers > 0 ? 'red' : 'gray'}
            actionLabel={t('adminDashboard.activateNow')}
            onAction={() => onGoTab('farmers')}
          />
          <UrgentCard
            title={t('adminDashboard.pendingOpportunities')}
            count={pendingOpps}
            color={pendingOpps > 0 ? 'amber' : 'gray'}
            actionLabel={t('adminDashboard.review')}
            onAction={() => onGoTab('afriyield')}
          />
          <UrgentCard
            title={t('adminDashboard.unassignedExperts')}
            count={newExpert}
            color={newExpert > 0 ? 'red' : 'gray'}
            actionLabel={t('adminDashboard.assign')}
            onAction={() => onGoTab('expertRequests')}
          />
          <UrgentCard
            title={t('adminDashboard.quoteRequests')}
            count={newQuotes}
            color={newQuotes > 0 ? 'gold' : 'gray'}
            actionLabel={t('adminDashboard.view')}
            onAction={() => setQuoteModal((p) => ({ ...p, open: true }))}
          />
          <UrgentCard
            title={t('adminDashboard.pendingCooperatives')}
            count={pendingCoops}
            color={pendingCoops > 0 ? 'amber' : 'gray'}
            actionLabel={t('adminDashboard.activateNow')}
            onAction={() => onGoTab('cooperatives')}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={`${t('adminDashboard.activeCountryLicenses')} • ${t('adminDashboard.monthlyRecurring')}`}
          value={`${metrics.activeLicenses} • ${fmtMoney(metrics.mrr)}`}
        />
        <MetricCard
          title={`${t('adminDashboard.registeredInvestors')} • ${t('adminDashboard.investmentPotential')}`}
          value={`${metrics.investors} • ${fmtMoney(metrics.investorPotential)}`}
        />
        <MetricCard
          title={`${t('adminDashboard.activeCooperatives')} • ${t('adminDashboard.annualRevenue')}`}
          value={`${metrics.activeCoops} • ${fmtMoney(metrics.coopAnnual)}`}
        />
        <MetricCard
          title={`${t('adminDashboard.certifiedProducers')} • ${t('adminDashboard.certificationRevenue')}`}
          value={`${metrics.certifiedProducers} • ${fmtMoney(metrics.certificationRevenue)}`}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-brand-forest mb-4">{t('admin.pipeline.title')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-0">
          {[
            { label: t('admin.pipeline.new'), count: pipeline.New || 0, color: 'bg-gray-100 text-gray-700', emoji: '🆕' },
            { label: t('admin.pipeline.callScheduled'), count: pipeline['Call Scheduled'] || 0, color: 'bg-blue-50 text-blue-700', emoji: '📅' },
            { label: t('admin.pipeline.callDone'), count: pipeline['Call Completed'] || 0, color: 'bg-purple-50 text-purple-700', emoji: '✅' },
            { label: t('admin.pipeline.oppsSent'), count: pipeline['Opportunity Sent'] || 0, color: 'bg-yellow-50 text-yellow-700', emoji: '📨' },
            { label: t('admin.pipeline.investing'), count: pipeline['Investment Active'] || 0, color: 'bg-green-50 text-green-700', emoji: '💰' },
            { label: t('admin.pipeline.paidOut'), count: pipeline['Paid Out'] || 0, color: 'bg-amber-50 text-amber-700', emoji: '🏆' },
          ].map(({ label, count, color, emoji }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
              <div className="text-xl mb-1">{emoji}</div>
              <div className="font-bold text-lg">{count}</div>
              <div className="text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-brand-forest mb-4">{t('adminDashboard.recentActivity')}</h3>
        {feed.length === 0 ? (
          <p className="text-sm text-gray-600">{t('adminDashboard.noRecentActivity')}</p>
        ) : (
          <div className="space-y-3">
            {feed.map((e, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-sm text-gray-800">{e.text}</p>
                <span className="text-xs text-gray-500 shrink-0">{e.ago}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cooperative Member Management — real API data */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-forest text-lg">
              🤝 {isFr ? 'Gestion des Membres — Coopératives' : 'Cooperative Member Management'}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {isFr ? 'Performance et avantages par coopérative' : 'Performance and benefits by cooperative'}
            </p>
          </div>
          <Link to="/cooperatives" className="text-sm text-brand-forest font-semibold hover:underline">
            {isFr ? 'Voir tout →' : 'View all →'}
          </Link>
        </div>

        {cooperativesOverview.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-gray-500 text-sm">
              {isFr ? 'Aucune coopérative enregistrée.' : 'No cooperatives registered yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cooperativesOverview.slice(0, 5).map((coop) => {
              const memberCount = coop.memberCount || coop.nombreMembres || 0;
              const certLevel = coop.certificationStatus || 'None';
              const certScore =
                certLevel === 'International' ? 100 : certLevel === 'Regional' ? 66 : certLevel === 'Local' ? 33 : 0;
              return (
                <div key={coop._id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-brand-forest">
                        {coop.cooperativeName || coop.nomCooperative}
                      </p>
                      <p className="text-xs text-gray-500">
                        🌍 {coop.country || coop.pays} · {memberCount}{' '}
                        {isFr ? 'membres' : 'members'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          certLevel === 'International'
                            ? 'bg-amber-50 text-amber-700'
                            : certLevel === 'Regional'
                              ? 'bg-blue-50 text-blue-700'
                              : certLevel === 'Local'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {certLevel === 'None'
                          ? isFr
                            ? 'Non certifiée'
                            : 'Not certified'
                          : certLevel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-brand-forest transition-all"
                        style={{ width: `${certScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{isFr ? 'Parcours cert.' : 'Cert. path'}</span>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {coop.interests?.includes('Equipment Fund') && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-forest/10 text-brand-forest">
                        🔧 {isFr ? 'Équipement' : 'Equipment'}
                      </span>
                    )}
                    {coop.interests?.includes('Export Program') && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">🌍 Export</span>
                    )}
                    {coop.interests?.includes('Diaspora Investment') && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        💰 {isFr ? 'Diaspora' : 'Diaspora'}
                      </span>
                    )}
                    {(!coop.interests || coop.interests.length === 0) && (
                      <span className="text-xs text-gray-400">
                        {isFr ? 'Aucun avantage sélectionné' : 'No benefits selected'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-brand-forest mb-4">{t('adminDashboard.quickActions')}</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onGoTab('afriyield')}
            className="rounded-xl bg-[#B5850A] text-white font-extrabold px-4 py-3 hover:bg-[#9a7109]"
          >
            {t('adminDashboard.activateOpportunity')}
          </button>
          <button
            type="button"
            onClick={() => {
              setInvestorBanner('');
              setInvestorModal({ open: true });
            }}
            className="rounded-xl bg-brand-forest text-white font-extrabold px-4 py-3 hover:bg-[#143326]"
          >
            {t('adminDashboard.addInvestor')}
          </button>
          <Link
            to="/afri-yield/marketplace"
            className="rounded-xl border-2 border-brand-forest text-brand-forest font-extrabold px-4 py-3 text-center hover:bg-brand-forest hover:text-white transition"
          >
            {t('adminDashboard.viewMarketplace')}
          </Link>
        </div>
      </div>

      <Modal
        isOpen={quoteModal.open}
        onClose={() => setQuoteModal((p) => ({ ...p, open: false }))}
        title={t('adminDashboard.quoteRequestsTitle')}
      >
        <div className="space-y-3">
          {Array.isArray(quoteModal.items) && quoteModal.items.length ? (
            quoteModal.items.map((q) => (
              <div key={q._id} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="font-semibold text-gray-900">{q.companyName || q.buyerName || '—'}</p>
                <p className="text-sm text-gray-600">{q.email}</p>
                <p className="text-sm text-gray-700 mt-1">
                  {q.productWanted || '—'} • {q.quantityKg ? `${q.quantityKg} kg/mois` : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-2">{timeAgo(q.createdAt, t)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">{t('adminDashboard.noQuoteRequests')}</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={investorModal.open}
        onClose={() => setInvestorModal({ open: false })}
        title={t('adminDashboard.addInvestorTitle')}
      >
        <form onSubmit={createInvestor} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">{t('adminDashboard.investorForm.name')} *</span>
            <input
              required
              value={investorForm.fullName}
              onChange={(e) => setInvestorForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">{t('adminDashboard.investorForm.email')} *</span>
            <input
              type="email"
              required
              value={investorForm.email}
              onChange={(e) => setInvestorForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">{t('adminDashboard.investorForm.country')}</span>
            <input
              value={investorForm.countryOfResidence}
              onChange={(e) => setInvestorForm((p) => ({ ...p, countryOfResidence: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">{t('adminDashboard.investorForm.range')}</span>
            <input
              value={investorForm.investmentRange}
              onChange={(e) => setInvestorForm((p) => ({ ...p, investmentRange: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
              placeholder="$50k-$100k"
            />
          </label>
          {investorBanner ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">{investorBanner}</div>
          ) : null}
          <button
            type="submit"
            disabled={investorSaving}
            className="w-full rounded-lg bg-primary-green px-4 py-3 font-bold text-white hover:bg-primary-lightgreen disabled:opacity-60"
          >
            {investorSaving ? t('adminDashboard.investorForm.saving') : t('common.submit')}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function statusPill(status) {
  const map = {
    inquiry: 'bg-gray-100 text-gray-800 border-gray-200',
    pilot: 'bg-blue-50 text-blue-900 border-blue-200',
    active: 'bg-green-50 text-green-900 border-green-200',
    suspended: 'bg-red-50 text-red-900 border-red-200',
    expired: 'bg-amber-50 text-amber-900 border-amber-200',
  };
  return map[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function typePill(type) {
  const map = {
    pilot: 'bg-gray-100 text-gray-800 border-gray-200',
    standard: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    enterprise: 'bg-purple-50 text-purple-900 border-purple-200',
  };
  return map[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}

const CountryLicensesPanel = () => {
  const token = localStorage.getItem('adminToken') || '';
  return <CountryLicensesManagement token={token} />;
};

function NotificationsPanel() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState({});
  const [sendingAll, setSendingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API_BASE_URL}/api/notifications?status=all&limit=200`, { headers: authHeaders() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Failed');
      setItems(Array.isArray(j?.notifications) ? j.notifications : []);
    } catch (e) {
      setErr(e.message || 'Error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markSent = async (id) => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/notifications/item/${id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'sent' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Update failed');
      await load();
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  const dispatchSms = async (id) => {
    setSending((prev) => ({ ...prev, [id]: true }));
    try {
      const r = await fetch(`${API_BASE_URL}/api/notifications/item/${id}/dispatch`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Send failed');
      await load();
    } catch (e) {
      alert(e.message || 'Send failed');
    } finally {
      setSending((prev) => ({ ...prev, [id]: false }));
    }
  };

  const sendAll = async () => {
    if (!window.confirm('Envoyer tous les SMS en attente ?')) return;
    setSendingAll(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/notifications/process?limit=100`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const j = await r.json().catch(() => ({}));
      alert(`Envoyés: ${j.sent || 0} | Échoués: ${j.failed || 0} | Ignorés: ${j.skipped || 0}`);
      await load();
    } catch (e) {
      alert(e.message || 'Bulk send failed');
    } finally {
      setSendingAll(false);
    }
  };

  if (loading) return <div className="text-center py-10">{t('common.loading')}</div>;
  if (err) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{err}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-brand-forest">
          {t('adminDashboard.notifications.title')}
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={sendAll}
            disabled={sendingAll}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {sendingAll ? 'Envoi...' : `Envoyer tout (${items.length} SMS)`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{t('adminDashboard.notifications.name')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('adminDashboard.notifications.phone')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('adminDashboard.notifications.message')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('adminDashboard.notifications.source')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('adminDashboard.notifications.date')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('adminDashboard.notifications.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((n) => (
              <tr key={n._id} className="text-gray-800">
                <td className="px-4 py-3 font-medium">{n.recipientName || '—'}</td>
                <td className="px-4 py-3">{n.recipientPhone || '—'}</td>
                <td className="px-4 py-3 max-w-[420px] truncate" title={n.message}>
                  {n.message || '—'}
                </td>
                <td className="px-4 py-3">{n.source || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => dispatchSms(n._id)}
                      disabled={sending[n._id]}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sending[n._id] ? '...' : 'SMS'}
                    </button>
                    <a
                      href={`https://wa.me/${n.recipientPhone?.replace(/\\D/g, '')}?text=${encodeURIComponent(
                        n.message || ''
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      {t('adminDashboard.notifications.sendWhatsapp')}
                    </a>
                    <button
                      type="button"
                      onClick={() => markSent(n._id)}
                      className="rounded-lg bg-brand-forest px-3 py-1.5 text-xs font-bold text-white hover:bg-[#143326]"
                    >
                      {t('adminDashboard.notifications.markSent')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="p-6 text-center text-gray-500">{t('adminDashboard.notifications.empty')}</p>
        ) : null}
      </div>
    </div>
  );
}

function needsAdminDeletionAttention(status) {
  return status === 'pending' || status === 'notice_period' || status === 'final_payout_pending';
}

function countDeletionRequestsNeedingAttention(requests) {
  const list = Array.isArray(requests) ? requests : [];
  return list.filter((x) => needsAdminDeletionAttention(x.status)).length;
}

function DeletionRequestsPanel({ onRequestsLoaded }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API_BASE_URL}/api/deletion-requests`, { headers: authHeaders() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Failed');
      const list = Array.isArray(j?.requests) ? j.requests : [];
      setItems(list);
      onRequestsLoaded?.(list);
    } catch (e) {
      setErr(e.message || 'Error');
      setItems([]);
      onRequestsLoaded?.([]);
    } finally {
      setLoading(false);
    }
  }, [onRequestsLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (id, patch) => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/deletion-requests/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Update failed');
      await load();
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  const badgeForStatus = (status) => {
    if (status === 'pending') return 'bg-gray-100 text-gray-900 border-gray-200';
    if (status === 'notice_period') return 'bg-red-50 text-red-900 border-red-200 animate-pulse';
    if (status === 'final_payout_pending') return 'bg-orange-50 text-orange-900 border-orange-200';
    if (status === 'completed') return 'bg-green-50 text-green-900 border-green-200';
    if (status === 'cancelled') return 'bg-gray-100 text-gray-500 border-gray-200 line-through';
    return 'bg-gray-100 text-gray-900 border-gray-200';
  };

  const typeBadge = (userType) => {
    const base = 'text-[11px] font-extrabold px-2 py-1 rounded-full border ';
    const map = {
      investor: 'bg-[#fff7df] text-[#7a5b10] border-[#e9d7a7]',
      farmer: 'bg-green-50 text-green-900 border-green-200',
      cooperative: 'bg-blue-50 text-blue-900 border-blue-200',
      diaspora_producer: 'bg-purple-50 text-purple-900 border-purple-200',
      diaspora_buyer: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    };
    return base + (map[userType] || 'bg-gray-50 text-gray-900 border-gray-200');
  };

  const mailtoInvestorDeletion = (row) => {
    const noticeStart =
      row.noticePeriodStartDate ? new Date(row.noticePeriodStartDate).toLocaleDateString() : '—';
    const planned =
      row.scheduledDeletionDate ? new Date(row.scheduledDeletionDate).toLocaleDateString() : '—';
    const subject = encodeURIComponent('Your AfriYield Account Deletion — Action Required');
    const body = encodeURIComponent(
      `Hello ${row.userName || ''},\n\n` +
        `This email confirms your account deletion request on AfriYield Exchange.\n\n` +
        `6-month notice period start date: ${noticeStart}\n` +
        `Planned timeline for final payout coordination: ${planned}\n\n` +
        `Next steps:\n` +
        `- Our team will contact you within 48 hours to confirm details and payout timing.\n` +
        `- Your final ROI payout will be processed to your registered payment method before closure.\n\n` +
        `Thank you,\n` +
        `AfriYield / Sahel AgriConnect Team`
    );
    return `mailto:${row.userEmail}?subject=${subject}&body=${body}`;
  };

  const isFr = String(i18n.language || '').toLowerCase().startsWith('fr');

  if (loading) return <div className="text-center py-10">{t('common.loading')}</div>;
  if (err) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{err}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-brand-forest">{t('adminDashboard.tabs.deletions')}</h2>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{isFr ? 'Type' : 'User type'}</th>
              <th className="px-4 py-3 text-left font-semibold">{isFr ? 'Nom' : 'Name'}</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">{isFr ? 'Investissement actif' : 'Active investment'}</th>
              <th className="px-4 py-3 text-left font-semibold">{isFr ? 'Raison' : 'Reason'}</th>
              <th className="px-4 py-3 text-left font-semibold">{isFr ? 'Statut' : 'Status'}</th>
              <th className="px-4 py-3 text-left font-semibold">{isFr ? 'Suppression planifiée' : 'Scheduled deletion'}</th>
              <th className="px-4 py-3 text-right font-semibold">{isFr ? 'Actions' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r) => (
              <tr key={r._id} className="text-gray-800 align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={typeBadge(r.userType)}>{String(r.userType || '—').replaceAll('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 font-medium">{r.userName || '—'}</td>
                <td className="px-4 py-3">{r.userEmail || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-extrabold ${r.hasActiveInvestment ? 'text-red-700' : 'text-gray-700'}`}>
                    {r.hasActiveInvestment ? (isFr ? 'OUI' : 'YES') : isFr ? 'Non' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-[320px]">
                  <p className="line-clamp-3" title={r.reason || ''}>
                    {r.reason || '—'}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${badgeForStatus(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.scheduledDeletionDate ? new Date(r.scheduledDeletionDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end gap-2">
                    {r.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => update(r._id, { status: 'notice_period', confirmedByAdmin: true })}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-black"
                      >
                        Confirm
                      </button>
                    ) : null}

                    {['pending', 'notice_period'].includes(r.status) ? (
                      <button
                        type="button"
                        onClick={() =>
                          update(r._id, {
                            finalPayoutSent: true,
                            status: 'final_payout_pending',
                          })
                        }
                        className="rounded-lg bg-[#B5850A] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#9a7109]"
                      >
                        Payout Sent
                      </button>
                    ) : null}

                    {['pending', 'notice_period', 'final_payout_pending'].includes(r.status) ? (
                      <button
                        type="button"
                        onClick={() => update(r._id, { status: 'completed' })}
                        className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-green-800"
                      >
                        Mark Complete
                      </button>
                    ) : null}

                    {r.status !== 'cancelled' && r.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => update(r._id, { status: 'cancelled' })}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-gray-700 border border-gray-200 hover:bg-gray-50"
                      >
                        Cancel Request
                      </button>
                    ) : null}

                    {r.userType === 'investor' && r.hasActiveInvestment ? (
                      <a
                        href={mailtoInvestorDeletion(r)}
                        className="text-xs font-bold text-brand-forest hover:underline"
                      >
                        Email investor
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="p-6 text-center text-gray-500">{isFr ? 'Aucune demande.' : 'No requests.'}</p> : null}
      </div>
    </div>
  );
}

const CentralAdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const adminToken = localStorage.getItem('adminToken') || '';
  const [activeTab, setActiveTab] = useState('overview');
  const [expertRequestsNewCount, setExpertRequestsNewCount] = useState(0);
  const [deletionRequestsPendingCount, setDeletionRequestsPendingCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super-admin';
  const { country: detectedCountry } = useGeolocation();
  const [globalCountryFilter, setGlobalCountryFilter] = useState('');

  const handleDeletionRequestsLoaded = useCallback((requests) => {
    setDeletionRequestsPendingCount(countDeletionRequestsNeedingAttention(requests));
  }, []);

  useEffect(() => {
    async function badges() {
      if (!localStorage.getItem('adminToken')) return;
      try {
        const headers = authHeaders();

        const expertRes = await fetch(`${API_ENDPOINTS.EXPERTS.REQUESTS}?status=new`, { headers });
        const expertJson = await expertRes.json().catch(() => ({}));
        if (expertRes.ok) {
          setExpertRequestsNewCount(Array.isArray(expertJson.requests) ? expertJson.requests.length : 0);
        }

        const delRes = await fetch(`${API_BASE_URL}/api/deletion-requests`, { headers });
        const delJson = await delRes.json().catch(() => ({}));
        if (delRes.ok) {
          const list = Array.isArray(delJson.requests) ? delJson.requests : [];
          setDeletionRequestsPendingCount(countDeletionRequestsNeedingAttention(list));
        }
      } catch {
        setExpertRequestsNewCount(0);
        setDeletionRequestsPendingCount(0);
      }
    }
    badges();
  }, [activeTab]);

  const tabs = useMemo(() => {
    const out = BASE_TABS.map((tab) => ({
      ...tab,
      label: t(tab.labelKey),
      shortLabel: t(tab.shortKey),
    }));
    if (isSuperAdmin) {
      out.push({
        id: 'countryLicenses',
        label: t('adminDashboard.tabs.countryLicenses'),
        Icon: Database,
        shortLabel: t('adminDashboard.tabsShort.countryLicenses'),
      });
    }
    return out;
  }, [isSuperAdmin, t]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <img
                src="/sahel-logo.png"
                alt="Sahel AgriConnect"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-primary-green">Central Admin</h1>
                <p className="text-xs text-gray-500 hidden lg:block">Tableau de bord administratif</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-primary-green">Admin</h1>
              </div>
            </div>

            {/* Right: User Info and Logout */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* User Info - Hidden on very small screens, shown on larger mobile */}
              <div className="hidden sm:block text-right max-w-[120px] lg:max-w-none">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate hidden lg:block">{user?.email}</p>
              </div>
              
              {/* Logout Button - Mobile optimized */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">Déco</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 w-64 bg-white shadow-lg h-[calc(100vh-4rem)] overflow-y-auto z-40">
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? tab.accent === 'gold'
                    ? 'bg-[#B5850A] text-white shadow-md'
                    : 'bg-primary-green text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex min-w-0 items-center space-x-3">
                <tab.Icon
                  className={`h-5 w-5 shrink-0 ${
                    activeTab === tab.id ? 'text-white' : 'text-brand-forest'
                  }`}
                  aria-hidden
                />
                <span className="font-medium truncate">{tab.label}</span>
              </span>
              {tab.id === 'expertRequests' && expertRequestsNewCount > 0 ? (
                <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {expertRequestsNewCount}
                </span>
              ) : null}
              {tab.id === 'deletions' && deletionRequestsPendingCount > 0 ? (
                <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white animate-pulse">
                  {deletionRequestsPendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Navigation - Horizontal Scrollable Tabs */}
      <div className="md:hidden sticky top-14 z-30 bg-white border-b border-gray-200">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 p-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? tab.accent === 'gold'
                      ? 'bg-[#B5850A] text-white shadow-md'
                      : 'bg-primary-green text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.Icon
                  className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-brand-forest'}`}
                  aria-hidden
                />
                <span className="text-xs font-medium">{tab.shortLabel}</span>
                {tab.id === 'expertRequests' && expertRequestsNewCount > 0 ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-px text-[10px] font-bold leading-none text-white">
                    {expertRequestsNewCount}
                  </span>
                ) : null}
                {tab.id === 'deletions' && deletionRequestsPendingCount > 0 ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-px text-[10px] font-bold leading-none text-white animate-pulse">
                    {deletionRequestsPendingCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted for mobile */}
      <main className="md:ml-64 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-xl mb-4">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">
              {i18n.language === 'fr' ? 'Filtrer par pays:' : 'Filter by country:'}
            </span>
            <select
              value={globalCountryFilter}
              onChange={(e) => setGlobalCountryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            >
              <option value="">{i18n.language === 'fr' ? '🌍 Tous les pays' : '🌍 All countries'}</option>
              <optgroup label="Afrique de l'Ouest">
                {['Sénégal', 'Mali', "Côte d'Ivoire", 'Ghana', 'Nigeria', 'Burkina Faso', 'Niger', 'Guinée', 'Togo', 'Bénin', 'Gambie'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Afrique Centrale">
                {['Cameroun', 'Tchad', 'RD Congo'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Afrique de l'Est">
                {['Kenya', 'Éthiopie', 'Tanzanie', 'Ouganda', 'Rwanda'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Afrique Australe / Nord">
                {['Afrique du Sud', 'Zimbabwe', 'Zambie', 'Madagascar', 'Maroc', 'Algérie', 'Tunisie'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
            {globalCountryFilter ? (
              <button type="button" onClick={() => setGlobalCountryFilter('')} className="text-xs text-gray-400 hover:text-gray-600">
                {i18n.language === 'fr' ? 'Effacer' : 'Clear'} ×
              </button>
            ) : null}
            {detectedCountry && !globalCountryFilter ? (
              <button
                type="button"
                onClick={() => setGlobalCountryFilter(detectedCountry)}
                className="text-xs text-[#B5850A] hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                {i18n.language === 'fr' ? `Voir ${detectedCountry}` : `View ${detectedCountry}`}
              </button>
            ) : null}
          </div>
          {activeTab === 'overview' && <OverviewControlTower onGoTab={setActiveTab} />}
          {activeTab === 'notifications' && <NotificationsPanel />}
          {activeTab === 'deletions' && (
            <DeletionRequestsPanel onRequestsLoaded={handleDeletionRequestsLoaded} />
          )}
          {activeTab === 'farmers' && <RealTimeFarmers globalCountryFilter={globalCountryFilter} />}
          {activeTab === 'farmerNeeds' && <FarmerNeedsTab token={adminToken} isFr={isFr} />}
          {activeTab === 'cooperatives' && (
            <CooperativesTab token={adminToken} isFr={isFr} globalCountryFilter={globalCountryFilter} />
          )}
          {activeTab === 'centers' && <CentersManagement globalCountryFilter={globalCountryFilter} />}
          {activeTab === 'trainings' && <TrainingsManagement />}
          {activeTab === 'governance' && <GovernanceTab isFr={isFr} />}
          {activeTab === 'perks' && <BenefitsTab token={adminToken} isFr={isFr} />}
          {activeTab === 'irrigation' && <IrrigationTab token={adminToken} isFr={isFr} />}
          {activeTab === 'optimization' && (
            <OptimizationTab token={adminToken} isFr={isFr} />
          )}
          {activeTab === 'expertRequests' && (
            <ExpertRequestsManagement onCountsChanged={setExpertRequestsNewCount} globalCountryFilter={globalCountryFilter} />
          )}
          {activeTab === 'seasonal' && <PlanningTab token={adminToken} isFr={isFr} />}
          {activeTab === 'certification' && <CertificationTab token={adminToken} isFr={isFr} />}
          {activeTab === 'logistics' && <LogisticsTab token={adminToken} isFr={isFr} />}
          {activeTab === 'reports' && <ReportsTab token={adminToken} isFr={isFr} />}
          {activeTab === 'afriyield' && <AfriYieldAdminTab token={adminToken} isFr={isFr} />}
          {activeTab === 'countryLicenses' && isSuperAdmin ? <CountryLicensesPanel /> : null}
        </div>
      </main>
    </div>
  );
};

export default CentralAdminDashboard;
