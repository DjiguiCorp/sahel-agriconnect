import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, UserPlus } from 'lucide-react';
import LocationSelector from '../LocationSelector';

const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  inquiry: 'bg-gray-100 text-gray-700',
  pilot: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  expired: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS = {
  en: { inquiry: 'Inquiry', pilot: 'Pilot', active: 'Active', suspended: 'Suspended', expired: 'Expired' },
  fr: { inquiry: 'Demande', pilot: 'Pilote', active: 'Actif', suspended: 'Suspendu', expired: 'Expiré' },
};

export default function CountryLicensesManagement({ token }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'fr' ? 'fr' : 'en';
  const [licenses, setLicenses] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(null);
  const [showCreateGovAdmin, setShowCreateGovAdmin] = useState(null);
  const [form, setForm] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
    role: '',
    licenseType: 'pilot',
    monthlyFee: 999,
    location: { country: '', region: '' },
  });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [govAdminForm, setGovAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    orgType: 'government',
    organization: '',
  });
  const [govAdminState, setGovAdminState] = useState({ loading: false, ok: false, err: '' });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [licRes, inqRes] = await Promise.all([
        fetch(`${API}/api/licenses`, { headers }),
        fetch(`${API}/api/licensing/inquiries`, { headers }),
      ]);
      if (licRes.ok) setLicenses(await licRes.json().then((d) => d.licenses || d || []));
      if (inqRes.ok) setInquiries(await inqRes.json().then((d) => d.inquiries || d || []));
    } catch {}
    setLoading(false);
  };

  const createLicense = async () => {
    try {
      await fetch(`${API}/api/licenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...form,
          country: form.location.country,
          countryCode: form.location.country,
        }),
      });
      setShowAddModal(false);
      loadData();
    } catch {}
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/api/licenses/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch {}
  };

  const createCountryAdmin = async (licenseId) => {
    try {
      await fetch(`${API}/api/licenses/${licenseId}/create-admin`, {
        method: 'POST',
        headers,
        body: JSON.stringify(adminForm),
      });
      setShowAdminModal(null);
      setAdminForm({ name: '', email: '', password: '' });
      // eslint-disable-next-line no-alert
      alert(lang === 'fr' ? 'Compte admin créé avec succès' : 'Admin account created successfully');
    } catch {}
  };

  const createGovAdmin = async () => {
    if (!showCreateGovAdmin) return;
    setGovAdminState({ loading: true, ok: false, err: '' });
    try {
      const countryCode =
        showCreateGovAdmin.countryCode ||
        (typeof showCreateGovAdmin.country === 'string' && showCreateGovAdmin.country.length === 2
          ? showCreateGovAdmin.country.toUpperCase()
          : '');
      const r = await fetch(`${API}/api/government/create-admin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...govAdminForm,
          country: showCreateGovAdmin.country,
          countryCode,
          licenseId: showCreateGovAdmin._id,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setGovAdminState({ loading: false, ok: true, err: '' });
      setTimeout(() => {
        setShowCreateGovAdmin(null);
        setGovAdminState({ loading: false, ok: false, err: '' });
        setGovAdminForm({ name: '', email: '', password: '', orgType: 'government', organization: '' });
        loadData();
      }, 2000);
    } catch (err) {
      setGovAdminState({ loading: false, ok: false, err: err.message });
    }
  };

  const subTabs = [
    { key: 'overview', label: lang === 'fr' ? "Vue d'ensemble" : 'Overview' },
    { key: 'licenses', label: lang === 'fr' ? 'Licences actives' : 'Active Licenses' },
    { key: 'inquiries', label: lang === 'fr' ? 'Demandes' : 'Inquiries' },
    { key: 'revenue', label: lang === 'fr' ? 'Revenus' : 'Revenue' },
  ];

  const totalMRR = licenses.filter((l) => l.status === 'active').reduce((s, l) => s + (l.monthlyFee || 999), 0);
  const totalARR = totalMRR * 12;

  return (
    <div className="p-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeSubTab === tab.key ? 'bg-[#1a3c2e] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#B5850A' }}
        >
          <Plus className="w-4 h-4" />
          {lang === 'fr' ? 'Nouvelle licence' : 'New License'}
        </button>
      </div>

      {loading ? <p className="text-sm text-gray-600">{lang === 'fr' ? 'Chargement…' : 'Loading…'}</p> : null}

      {/* OVERVIEW TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: lang === 'fr' ? 'Licences actives' : 'Active Licenses',
                value: licenses.filter((l) => l.status === 'active').length,
                color: 'text-green-700',
              },
              {
                label: lang === 'fr' ? 'En pilote' : 'In Pilot',
                value: licenses.filter((l) => l.status === 'pilot').length,
                color: 'text-blue-700',
              },
              { label: 'MRR', value: `$${totalMRR.toLocaleString()}`, color: 'text-[#1a3c2e]' },
              { label: 'ARR', value: `$${totalARR.toLocaleString()}`, color: 'text-[#B5850A]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-gray-200 p-4 bg-white">
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <h3 className="font-bold text-[#1a3c2e] mb-4">{lang === 'fr' ? 'Pays sous licence' : 'Licensed Countries'}</h3>
            {licenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🌍</div>
                <p className="text-gray-500">
                  {lang === 'fr'
                    ? 'Aucune licence active. Cliquez sur "Nouvelle licence" pour commencer.'
                    : 'No active licenses. Click "New License" to get started.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {licenses.map((l) => (
                  <div key={l._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-2xl">🌍</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1a3c2e] truncate">{l.country}</p>
                      <p className="text-xs text-gray-500 truncate">{l.organizationName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status]}`}>
                      {STATUS_LABELS[lang][l.status] || l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inquiries.length > 0 ? (
            <div className="rounded-xl border border-gray-200 p-5 bg-white">
              <h3 className="font-bold text-[#1a3c2e] mb-3">{lang === 'fr' ? 'Dernières demandes' : 'Latest Inquiries'}</h3>
              <div className="space-y-2">
                {inquiries.slice(0, 5).map((inq, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{inq.organizationName}</p>
                      <p className="text-xs text-gray-500">
                        {inq.country} · {inq.email}
                      </p>
                    </div>
                    <a
                      href={`mailto:${inq.email}?subject=AfriYield Exchange — Country License for ${inq.country}`}
                      className="text-xs text-[#B5850A] hover:underline"
                    >
                      {lang === 'fr' ? 'Répondre' : 'Reply'} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* LICENSES TAB */}
      {activeSubTab === 'licenses' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          {licenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🌍</div>
              <p className="text-gray-500 mb-4">{lang === 'fr' ? 'Aucune licence créée.' : 'No licenses created yet.'}</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: '#1a3c2e' }}
              >
                {lang === 'fr' ? 'Créer la première licence' : 'Create first license'}
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1a3c2e' }}>
                  {[
                    lang === 'fr' ? 'Pays' : 'Country',
                    lang === 'fr' ? 'Organisation' : 'Organization',
                    lang === 'fr' ? 'Type' : 'Type',
                    lang === 'fr' ? 'Frais/mois' : 'Fee/month',
                    lang === 'fr' ? 'Statut' : 'Status',
                    lang === 'fr' ? 'Admin pays' : 'Country Admin',
                    'Actions',
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white font-medium text-xs uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {licenses.map((l, i) => (
                  <tr key={l._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-[#1a3c2e]">🌍 {l.country}</td>
                    <td className="px-4 py-3 text-gray-700">{l.organizationName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{l.licenseType}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#1a3c2e]">${(l.monthlyFee || 999).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={l.status}
                        onChange={(e) => updateStatus(l._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[l.status]}`}
                      >
                        {Object.entries(STATUS_LABELS[lang]).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {l.adminUserId ? (
                        <span className="text-xs text-green-600 font-medium">✓ {lang === 'fr' ? 'Créé' : 'Created'}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAdminModal(l)}
                          className="flex items-center gap-1 text-xs text-[#B5850A] hover:underline"
                        >
                          <UserPlus className="w-3 h-3" />
                          {lang === 'fr' ? 'Créer' : 'Create'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${l.contactEmail}?subject=AfriYield License Update — ${l.country}`}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Email
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateGovAdmin(l);
                            setGovAdminForm({
                              name: '',
                              email: '',
                              password: '',
                              orgType: 'government',
                              organization: l.organizationName || '',
                            });
                            setGovAdminState({ loading: false, ok: false, err: '' });
                          }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                          style={{ background: '#B5850A' }}
                        >
                          🏛️ {lang === 'fr' ? 'Créer compte portail' : 'Create portal account'}
                        </button>
                        {l.status === 'active' ? (
                          <button type="button" onClick={() => updateStatus(l._id, 'suspended')} className="text-xs text-red-500 hover:underline">
                            {lang === 'fr' ? 'Suspendre' : 'Suspend'}
                          </button>
                        ) : (
                          <button type="button" onClick={() => updateStatus(l._id, 'active')} className="text-xs text-green-600 hover:underline">
                            {lang === 'fr' ? 'Activer' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* INQUIRIES TAB */}
      {activeSubTab === 'inquiries' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          {inquiries.length === 0 ? (
            <p className="text-center py-12 text-gray-500">{lang === 'fr' ? 'Aucune demande reçue.' : 'No inquiries received yet.'}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1a3c2e' }}>
                  {[
                    'Organisation',
                    lang === 'fr' ? 'Pays' : 'Country',
                    lang === 'fr' ? 'Contact' : 'Contact',
                    'Email',
                    lang === 'fr' ? 'Rôle' : 'Role',
                    lang === 'fr' ? 'Date' : 'Date',
                    'Actions',
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white font-medium text-xs uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-[#1a3c2e]">{inq.organizationName}</td>
                    <td className="px-4 py-3">🌍 {inq.country}</td>
                    <td className="px-4 py-3 text-gray-700">{inq.contactName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{inq.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{inq.role}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${inq.email}?subject=AfriYield Exchange — Platform License for ${inq.country}`}
                          className="text-xs bg-[#1a3c2e] text-white px-3 py-1.5 rounded-lg hover:bg-[#143326] transition"
                        >
                          {lang === 'fr' ? 'Répondre' : 'Reply'}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((p) => ({
                              ...p,
                              organizationName: inq.organizationName,
                              contactName: inq.contactName,
                              email: inq.email,
                              phone: inq.phone || '',
                              role: inq.role || '',
                              location: { country: inq.country, region: '' },
                            }));
                            setShowAddModal(true);
                          }}
                          className="text-xs text-[#B5850A] hover:underline"
                        >
                          {lang === 'fr' ? 'Créer licence' : 'Create license'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* REVENUE TAB */}
      {activeSubTab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: lang === 'fr' ? 'Revenu mensuel récurrent' : 'Monthly Recurring Revenue',
                value: `$${totalMRR.toLocaleString()}`,
                sub: 'MRR',
              },
              {
                label: lang === 'fr' ? 'Revenu annuel récurrent' : 'Annual Recurring Revenue',
                value: `$${totalARR.toLocaleString()}`,
                sub: 'ARR',
              },
              {
                label: lang === 'fr' ? 'Licences actives' : 'Active Licenses',
                value: licenses.filter((l) => l.status === 'active').length,
                sub: lang === 'fr' ? 'pays' : 'countries',
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl border border-gray-200 p-6 bg-white text-center">
                <p className="text-gray-500 text-sm mb-2">{label}</p>
                <p className="text-4xl font-bold font-mono text-[#1a3c2e]">{value}</p>
                <p className="text-gray-400 text-xs mt-1">{sub}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <h3 className="font-bold text-[#1a3c2e] mb-4">{lang === 'fr' ? 'Détail par licence' : 'Revenue by License'}</h3>
            {licenses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{lang === 'fr' ? 'Aucune licence active' : 'No active licenses'}</p>
            ) : (
              <div className="space-y-2">
                {licenses.map((l) => (
                  <div key={l._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-sm text-[#1a3c2e]">🌍 {l.country}</p>
                      <p className="text-xs text-gray-500">{l.organizationName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#1a3c2e]">${(l.monthlyFee || 999).toLocaleString()}/mo</p>
                      <p className="text-xs text-gray-400">${((l.monthlyFee || 999) * 12).toLocaleString()}/yr</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD LICENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="font-bold text-[#1a3c2e] text-xl mb-4">{lang === 'fr' ? 'Nouvelle licence pays' : 'New Country License'}</h3>
            <div className="space-y-4">
              <LocationSelector value={form.location} onChange={(location) => setForm((p) => ({ ...p, location }))} required showDetectedBanner={false} />
              {[
                ['organizationName', lang === 'fr' ? "Nom de l'organisation" : 'Organization name', 'text'],
                ['contactName', lang === 'fr' ? 'Nom du contact' : 'Contact name', 'text'],
                ['email', 'Email', 'email'],
                ['phone', lang === 'fr' ? 'Téléphone' : 'Phone', 'text'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Type' : 'License Type'}</label>
                  <select
                    value={form.licenseType}
                    onChange={(e) => setForm((p) => ({ ...p, licenseType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#B5850A]"
                  >
                    <option value="pilot">{lang === 'fr' ? 'Pilote ($299/mois)' : 'Pilot ($299/month)'}</option>
                    <option value="standard">{lang === 'fr' ? 'Standard ($999/mois)' : 'Standard ($999/month)'}</option>
                    <option value="enterprise">{lang === 'fr' ? 'Entreprise ($1999/mois)' : 'Enterprise ($1999/month)'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Frais mensuels ($)' : 'Monthly fee ($)'}</label>
                  <input
                    type="number"
                    value={form.monthlyFee}
                    onChange={(e) => setForm((p) => ({ ...p, monthlyFee: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={createLicense} className="flex-1 rounded-xl py-3 font-bold text-white text-sm" style={{ background: '#1a3c2e' }}>
                {lang === 'fr' ? 'Créer la licence' : 'Create License'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition border border-gray-200"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUNTRY ADMIN MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-[#1a3c2e] text-xl mb-2">{lang === 'fr' ? 'Créer un admin pays' : 'Create Country Admin'}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {lang === 'fr'
                ? `Cet admin ne verra que les données de ${showAdminModal.country}.`
                : `This admin will only see data from ${showAdminModal.country}.`}
            </p>
            <div className="space-y-3">
              {[
                ['name', lang === 'fr' ? 'Nom complet' : 'Full name', 'text'],
                ['email', 'Email', 'email'],
                ['password', lang === 'fr' ? 'Mot de passe temporaire' : 'Temporary password', 'password'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={adminForm[field]}
                    onChange={(e) => setAdminForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </div>
              ))}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-3">
              <p className="text-yellow-800 text-xs">
                ⚠️{' '}
                {lang === 'fr'
                  ? "Partagez ces identifiants de manière sécurisée avec l'organisation. L'admin pays ne pourra voir que les données de son pays."
                  : "Share these credentials securely with the organization. The country admin will only see their country's data."}
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => createCountryAdmin(showAdminModal._id)}
                className="flex-1 rounded-xl py-2.5 font-bold text-white text-sm"
                style={{ background: '#1a3c2e' }}
              >
                {lang === 'fr' ? 'Créer le compte' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdminModal(null)}
                className="px-5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition border border-gray-200"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGovAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-brand-forest text-lg mb-1">
              🏛️ {lang === 'fr' ? 'Créer un compte portail institutionnel' : 'Create institutional portal account'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {lang === 'fr' ? `Pour: ${showCreateGovAdmin.country}` : `For: ${showCreateGovAdmin.country}`}
            </p>
            {govAdminState.ok ? (
              <div className="text-center py-4">
                <p className="text-4xl mb-2">✅</p>
                <p className="font-bold text-green-700">{lang === 'fr' ? 'Compte créé !' : 'Account created!'}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {lang === 'fr' ? 'Les identifiants ont été configurés.' : 'Credentials have been configured.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? "Type d'organisation" : 'Organization type'}
                  </label>
                  <select
                    value={govAdminForm.orgType}
                    onChange={(e) => setGovAdminForm((f) => ({ ...f, orgType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="government">
                      🏛️ {lang === 'fr' ? 'Gouvernement / Ministère' : 'Government / Ministry'}
                    </option>
                    <option value="ngo">
                      🤝 {lang === 'fr' ? 'ONG / Organisation internationale' : 'NGO / International Organization'}
                    </option>
                    <option value="enterprise">🏢 {lang === 'fr' ? 'Entreprise' : 'Enterprise'}</option>
                  </select>
                </div>
                {[
                  { key: 'name', label: lang === 'fr' ? 'Nom du responsable' : 'Contact person name', placeholder: '' },
                  {
                    key: 'organization',
                    label: lang === 'fr' ? "Nom de l'organisation" : 'Organization name',
                    placeholder: '',
                  },
                  {
                    key: 'email',
                    label: lang === 'fr' ? 'Email officiel' : 'Official email',
                    placeholder:
                      govAdminForm.orgType === 'government'
                        ? 'user@ministry.gov.ml'
                        : govAdminForm.orgType === 'ngo'
                          ? 'user@organization.org'
                          : 'user@company.com',
                  },
                  {
                    key: 'password',
                    label: lang === 'fr' ? 'Mot de passe temporaire' : 'Temporary password',
                    placeholder: lang === 'fr' ? 'Min. 8 caractères' : 'Min. 8 characters',
                  },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
                    <input
                      type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                      value={govAdminForm[key]}
                      onChange={(e) => setGovAdminForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                    />
                  </div>
                ))}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  {govAdminForm.orgType === 'government'
                    ? '🔒 Email must end in .gov, .gouv, or country equivalent (e.g. .gov.ml)'
                    : govAdminForm.orgType === 'ngo'
                      ? '🔒 Email must use .org, .ngo, or institutional domain'
                      : '🔒 No personal emails (Gmail, Yahoo etc)'}
                </div>
                {govAdminState.err && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{govAdminState.err}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={createGovAdmin}
                    disabled={govAdminState.loading || !govAdminForm.name || !govAdminForm.email || !govAdminForm.password}
                    className="flex-1 bg-brand-forest text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-50"
                  >
                    {govAdminState.loading ? '...' : lang === 'fr' ? 'Créer le compte' : 'Create account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGovAdmin(null);
                      setGovAdminState({ loading: false, ok: false, err: '' });
                    }}
                    className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm"
                  >
                    {lang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

