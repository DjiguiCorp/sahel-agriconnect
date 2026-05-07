import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import CooperativesManagement from '../components/admin/CooperativesManagement';
import CooperativesDiasporaManagement from '../components/admin/CooperativesDiasporaManagement';
import SeasonalPlanning from '../components/admin/SeasonalPlanning';
import InputsManagement from '../components/admin/InputsManagement';
import CertificationManagement from '../components/admin/CertificationManagement';
import PartnershipsManagement from '../components/admin/PartnershipsManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import RealTimeFarmers from '../components/admin/RealTimeFarmers';
import LogisticsManagement from '../components/admin/LogisticsManagement';
import CentersManagement from '../components/admin/CentersManagement';
import PerksManagement from '../components/admin/PerksManagement';
import TrainingsManagement from '../components/admin/TrainingsManagement';
import IrrigationManagement from '../components/admin/IrrigationManagement';
import ProductionOptimizationManagement from '../components/admin/ProductionOptimizationManagement';
import AfriYieldManagement from '../components/admin/AfriYieldManagement';
import Governance from '../pages/Governance';
import Modal from '../components/Modal';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import ExpertRequestsManagement from '../components/admin/ExpertRequestsManagement';
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
  UserPlus,
  ClipboardList,
} from 'lucide-react';

const BASE_TABS = [
  { id: 'farmers', label: 'Agriculteurs', Icon: Sprout, shortLabel: 'Agric.' },
  { id: 'cooperatives', label: 'Coopératives', Icon: Handshake, shortLabel: 'Coop.' },
  { id: 'centers', label: 'Centres', Icon: Building2, shortLabel: 'Centres' },
  { id: 'trainings', label: 'Formations', Icon: BookOpen, shortLabel: 'Form.' },
  { id: 'governance', label: 'Gouvernance', Icon: Scale, shortLabel: 'Gouv.' },
  { id: 'perks', label: 'Avantages', Icon: Gift, shortLabel: 'Avant.' },
  { id: 'irrigation', label: 'Irrigation', Icon: Droplets, shortLabel: 'Irr.' },
  { id: 'optimization', label: 'Optimisation', Icon: Bot, shortLabel: 'Opt.' },
  {
    id: 'expertRequests',
    label: 'Demandes Experts',
    Icon: ClipboardList,
    shortLabel: 'Experts',
  },
  { id: 'seasonal', label: 'Planification', Icon: Calendar, shortLabel: 'Plan.' },
  { id: 'certification', label: 'Certification', Icon: Star, shortLabel: 'Cert.' },
  { id: 'logistics', label: 'Logistique', Icon: Truck, shortLabel: 'Log.' },
  { id: 'reports', label: 'Rapports', Icon: BarChart3, shortLabel: 'Rapp.' },
  { id: 'afriyield', label: 'AfriYield Exchange', Icon: Coins, shortLabel: 'AfriY.', accent: 'gold' },
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
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState([]);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState({ open: false, license: null });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [adminCreating, setAdminCreating] = useState(false);
  const [adminBanner, setAdminBanner] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE_URL}/api/licenses`, { headers: authHeaders() });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || data.message || 'Failed to load licenses');
      setLicenses(Array.isArray(data.licenses) ? data.licenses : []);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const active = licenses.filter((l) => l.status === 'active');
    const activeCount = active.length;
    const mrr = active.reduce((sum, l) => sum + (Number(l.monthlyFee) || 0), 0);
    return { activeCount, mrr };
  }, [licenses]);

  const updateStatus = async (licenseId, status) => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/licenses/${licenseId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || data.message || 'Update failed');
      setLicenses((prev) => prev.map((l) => (l._id === licenseId ? data.license : l)));
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  const openCreateAdmin = (license) => {
    setAdminBanner(null);
    setAdminForm({ name: '', email: '', password: '' });
    setModal({ open: true, license });
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    if (!modal.license?._id) return;
    setAdminCreating(true);
    setAdminBanner(null);
    try {
      const r = await fetch(`${API_BASE_URL}/api/licenses/${modal.license._id}/create-admin`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(adminForm),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || data.message || 'Create admin failed');
      setAdminBanner(`Admin créé: ${data.admin?.email}`);
      await load();
    } catch (e2) {
      setAdminBanner(e2.message || 'Create admin failed');
    } finally {
      setAdminCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-600">Licences actives</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-forest">{summary.activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-600">MRR (actif)</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-forest">{fmtMoney(summary.mrr)}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Organization</th>
              <th className="px-4 py-3 text-left font-semibold">Country</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">License Type</th>
              <th className="px-4 py-3 text-left font-semibold">Monthly Fee</th>
              <th className="px-4 py-3 text-left font-semibold">Admin Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {licenses.map((l) => (
              <tr key={l._id} className="text-gray-800">
                <td className="px-4 py-3 font-medium">{l.organizationName}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{l.country}</div>
                  <div className="text-xs text-gray-500">{l.countryCode}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusPill(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${typePill(l.licenseType)}`}>
                    {l.licenseType}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{fmtMoney(l.monthlyFee)}</td>
                <td className="px-4 py-3">
                  {l.adminUserId ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                      <BadgeCheck className="h-4 w-4" aria-hidden /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                      <ShieldAlert className="h-4 w-4" aria-hidden /> No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(l._id, 'active')}
                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(l._id, 'suspended')}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateAdmin(l)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      Create Country Admin
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {licenses.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                  No licenses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, license: null })}
        title={modal.license ? `Create Country Admin — ${modal.license.country}` : 'Create Country Admin'}
      >
        <form onSubmit={createAdmin} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Name *</span>
            <input
              required
              value={adminForm.name}
              onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Email *</span>
            <input
              type="email"
              required
              value={adminForm.email}
              onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Password *</span>
            <input
              type="password"
              required
              value={adminForm.password}
              onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </label>
          {adminBanner ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">{adminBanner}</div>
          ) : null}
          <button
            type="submit"
            disabled={adminCreating}
            className="w-full rounded-lg bg-primary-green px-4 py-3 font-bold text-white hover:bg-primary-lightgreen disabled:opacity-60"
          >
            {adminCreating ? 'Creating...' : 'Create admin'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const CentralAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('farmers');
  const [expertRequestsNewCount, setExpertRequestsNewCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    async function badge() {
      try {
        const r = await fetch(`${API_ENDPOINTS.EXPERTS.REQUESTS}?status=new`, {
          headers: authHeaders(),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return;
        setExpertRequestsNewCount(Array.isArray(data.requests) ? data.requests.length : 0);
      } catch {
        setExpertRequestsNewCount(0);
      }
    }
    if (localStorage.getItem('adminToken')) badge();
  }, [activeTab]);

  const tabs = useMemo(() => {
    const out = [...BASE_TABS];
    if (isSuperAdmin) {
      out.push({ id: 'countryLicenses', label: 'Licences Pays', Icon: Database, shortLabel: 'Lic.' });
    }
    return out;
  }, [isSuperAdmin]);

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
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-green to-primary-lightgreen rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">SA</span>
              </div>
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
              <Link
                to="/admin/donnees"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-forest bg-brand-iconBg rounded-lg hover:bg-brand-cream border border-brand-sage/30"
              >
                <Database className="w-4 h-4" aria-hidden />
                Données Supabase
              </Link>
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted for mobile */}
      <main className="md:ml-64 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'farmers' && <RealTimeFarmers />}
          {activeTab === 'cooperatives' && <CooperativesManagement />}
          {activeTab === 'centers' && <CentersManagement />}
          {activeTab === 'trainings' && <TrainingsManagement />}
          {activeTab === 'governance' && <Governance />}
          {activeTab === 'perks' && <PerksManagement />}
          {activeTab === 'irrigation' && <IrrigationManagement />}
          {activeTab === 'optimization' && <ProductionOptimizationManagement />}
          {activeTab === 'expertRequests' && (
            <ExpertRequestsManagement onCountsChanged={setExpertRequestsNewCount} />
          )}
          {activeTab === 'seasonal' && <SeasonalPlanning />}
          {activeTab === 'certification' && <CertificationManagement />}
          {activeTab === 'logistics' && <LogisticsManagement />}
          {activeTab === 'reports' && <ReportsManagement />}
          {activeTab === 'afriyield' && <AfriYieldManagement />}
          {activeTab === 'countryLicenses' && isSuperAdmin ? <CountryLicensesPanel /> : null}
        </div>
      </main>
    </div>
  );
};

export default CentralAdminDashboard;
