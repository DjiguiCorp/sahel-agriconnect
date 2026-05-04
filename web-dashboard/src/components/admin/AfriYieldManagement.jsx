import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

const SUB = [
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'investors', label: 'Investors' },
  { id: 'meetings', label: 'Meeting Requests' },
];

const COUNTRIES = [
  'Benin',
  'Burkina Faso',
  'Cabo Verde',
  "Côte d'Ivoire",
  'The Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Liberia',
  'Mali',
  'Mauritania',
  'Niger',
  'Nigeria',
  'Senegal',
  'Sierra Leone',
  'Togo',
  'Algeria',
  'Morocco',
  'Tunisia',
  'Egypt',
  'Cameroon',
  'Other / Diaspora',
  'USA',
  'Canada',
  'UK',
  'France',
  'Germany',
  'UAE',
  'Netherlands',
  'Belgium',
];

const INVESTOR_STATUSES = ['new', 'contacted', 'active', 'declined'];

const emptyOppForm = () => ({
  centerName: '',
  location: '',
  country: 'Mali',
  commodity: 'Shea Butter',
  track: 'Track A',
  certificationStatus: 'Local',
  amountSought: '',
  description: '',
  memberFarmers: 0,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  existingBuyers: '',
  featured: false,
  status: 'pending',
});

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function opportunityStatusClass(s) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    active: 'bg-green-100 text-green-900 border-green-200',
    funded: 'bg-blue-100 text-blue-900 border-blue-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return map[s] || 'bg-gray-100 text-gray-800';
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AfriYieldManagement() {
  const [sub, setSub] = useState('opportunities');
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyOppForm());
  const [saving, setSaving] = useState(false);

  const loadOpportunities = useCallback(async () => {
    const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.ALL, { headers: authHeaders() });
    const data = await r.json();
    if (data.success && Array.isArray(data.opportunities)) setOpportunities(data.opportunities);
    else if (Array.isArray(data)) setOpportunities(data);
  }, []);

  const loadInvestors = useCallback(async () => {
    const r = await fetch(API_ENDPOINTS.INVESTORS.BASE, { headers: authHeaders() });
    const data = await r.json();
    if (data.success && Array.isArray(data.investors)) setInvestors(data.investors);
    else if (Array.isArray(data)) setInvestors(data);
  }, []);

  const loadMeetings = useCallback(async () => {
    const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.MEETING_REQUESTS, { headers: authHeaders() });
    const data = await r.json();
    if (data.success && Array.isArray(data.meetingRequests)) setMeetingRequests(data.meetingRequests);
    else if (Array.isArray(data)) setMeetingRequests(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadOpportunities(), loadInvestors(), loadMeetings()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOpportunities, loadInvestors, loadMeetings]);

  const openAdd = () => {
    setForm(emptyOppForm());
    setModal({ type: 'add' });
  };

  const openEdit = (o) => {
    setForm({
      ...emptyOppForm(),
      ...o,
      amountSought: o.amountSought ?? '',
      memberFarmers: o.memberFarmers ?? 0,
    });
    setModal({ type: 'edit', id: o._id });
  };

  const submitOpportunity = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        centerName: form.centerName,
        location: form.location,
        country: form.country,
        commodity: form.commodity,
        track: form.track,
        certificationStatus: form.certificationStatus,
        amountSought: Number(form.amountSought),
        description: form.description,
        memberFarmers: Number(form.memberFarmers) || 0,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        existingBuyers: form.existingBuyers || undefined,
        featured: Boolean(form.featured),
        status: form.status || 'pending',
      };
      const isEdit = modal?.type === 'edit';
      const url = isEdit ? API_ENDPOINTS.OPPORTUNITIES.BY_ID(modal.id) : API_ENDPOINTS.OPPORTUNITIES.BASE;
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Save failed');
      setModal(null);
      await loadOpportunities();
    } catch (err) {
      alert(err.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const activateOpportunity = async (id) => {
    try {
      const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'active' }),
      });
      if (!r.ok) throw new Error('Activate failed');
      await loadOpportunities();
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteOpportunity = async (id) => {
    if (!window.confirm('Delete this opportunity? Related meeting requests will be removed.')) return;
    try {
      const r = await fetch(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error('Delete failed');
      await loadOpportunities();
    } catch (e) {
      alert(e.message);
    }
  };

  const updateInvestorStatus = async (id, status) => {
    try {
      const r = await fetch(API_ENDPOINTS.INVESTORS.STATUS(id), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error('Update failed');
      await loadInvestors();
    } catch (e) {
      alert(e.message);
    }
  };

  const updateMeetingStatus = async (id, status) => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/opportunities/meeting-requests/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error('Update failed');
      await loadMeetings();
    } catch (e) {
      alert(e.message);
    }
  };

  const exportInvestorsCsv = () => {
    const header = [
      'Name',
      'Email',
      'Country',
      'Track Interest',
      'Commodity',
      'Investment Range',
      'Status',
      'Date Registered',
    ];
    const rows = investors.map((inv) => [
      inv.fullName,
      inv.email,
      inv.countryOfResidence,
      inv.investmentTrack,
      inv.commodityInterest,
      inv.investmentRange,
      inv.status,
      inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '',
    ]);
    const csv = [header.map(csvEscape).join(',')]
      .concat(rows.map((r) => r.map(csvEscape).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `afriyield-investors-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary-green" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">AfriYield Exchange</h2>
        <p className="text-gray-600">Manage investment opportunities, investors, and meeting requests.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        {SUB.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSub(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              sub === s.id ? 'bg-[#B5850A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sub === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-green text-white px-4 py-2 font-semibold hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add New Opportunity
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Center Name</th>
                  <th className="px-3 py-2 font-semibold">Location</th>
                  <th className="px-3 py-2 font-semibold">Commodity</th>
                  <th className="px-3 py-2 font-semibold">Track</th>
                  <th className="px-3 py-2 font-semibold">Certification</th>
                  <th className="px-3 py-2 font-semibold">Amount Sought</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o._id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{o.centerName}</td>
                    <td className="px-3 py-2">{o.location}</td>
                    <td className="px-3 py-2">{o.commodity}</td>
                    <td className="px-3 py-2">{o.track}</td>
                    <td className="px-3 py-2">{o.certificationStatus}</td>
                    <td className="px-3 py-2">${Number(o.amountSought).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${opportunityStatusClass(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {o.status !== 'active' ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-green-700 hover:underline"
                            onClick={() => activateOpportunity(o._id)}
                          >
                            Activate
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-xs font-medium text-blue-700 inline-flex items-center gap-0.5"
                          onClick={() => openEdit(o)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs font-medium text-red-600 inline-flex items-center gap-0.5"
                          onClick={() => deleteOpportunity(o._id)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {opportunities.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No opportunities yet.</p>
            ) : null}
          </div>
        </div>
      )}

      {sub === 'investors' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportInvestorsCsv}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Country</th>
                  <th className="px-3 py-2 font-semibold">Track Interest</th>
                  <th className="px-3 py-2 font-semibold">Commodity</th>
                  <th className="px-3 py-2 font-semibold">Investment Range</th>
                  <th className="px-3 py-2 font-semibold">Date Registered</th>
                  <th className="px-3 py-2 font-semibold">Actions (status)</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv._id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{inv.fullName}</td>
                    <td className="px-3 py-2">{inv.email}</td>
                    <td className="px-3 py-2">{inv.countryOfResidence}</td>
                    <td className="px-3 py-2">{inv.investmentTrack}</td>
                    <td className="px-3 py-2">{inv.commodityInterest}</td>
                    <td className="px-3 py-2">{inv.investmentRange}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvestorStatus(inv._id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        aria-label={`Status for ${inv.fullName}`}
                      >
                        {INVESTOR_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {investors.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No investors yet.</p>
            ) : null}
          </div>
        </div>
      )}

      {sub === 'meetings' && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Investor Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Center Name</th>
                <th className="px-3 py-2 font-semibold">Preferred Date</th>
                <th className="px-3 py-2 font-semibold">Message</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetingRequests.map((m) => (
                <tr key={m._id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{m.investorName}</td>
                  <td className="px-3 py-2">{m.investorEmail}</td>
                  <td className="px-3 py-2">{m.centerName || m.opportunityId?.centerName || '—'}</td>
                  <td className="px-3 py-2">{m.preferredDate || '—'}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={m.message}>
                    {m.message || '—'}
                  </td>
                  <td className="px-3 py-2">{m.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="text-left text-xs text-green-700 hover:underline"
                        onClick={() => updateMeetingStatus(m._id, 'confirmed')}
                      >
                        Mark as Confirmed
                      </button>
                      <button
                        type="button"
                        className="text-left text-xs text-blue-700 hover:underline"
                        onClick={() => updateMeetingStatus(m._id, 'completed')}
                      >
                        Mark as Completed
                      </button>
                      <button
                        type="button"
                        className="text-left text-xs text-gray-600 hover:underline"
                        onClick={() => updateMeetingStatus(m._id, 'cancelled')}
                      >
                        Mark as Cancelled
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meetingRequests.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No meeting requests yet.</p>
          ) : null}
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-primary-green mb-4">
              {modal.type === 'edit' ? 'Edit opportunity' : 'New opportunity'}
            </h3>
            <form onSubmit={submitOpportunity} className="space-y-3 text-sm">
              <label className="block">
                <span className="font-medium text-gray-700">Center Name *</span>
                <input
                  required
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.centerName}
                  onChange={(e) => setForm((p) => ({ ...p, centerName: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Location (city and country) *</span>
                <input
                  required
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Country *</span>
                <select
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 bg-white"
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="font-medium text-gray-700">Commodity *</span>
                  <select
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 bg-white"
                    value={form.commodity}
                    onChange={(e) => setForm((p) => ({ ...p, commodity: e.target.value }))}
                  >
                    <option value="Shea Butter">Shea Butter</option>
                    <option value="Sesame">Sesame</option>
                    <option value="Both">Both</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-medium text-gray-700">Track *</span>
                  <select
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 bg-white"
                    value={form.track}
                    onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
                  >
                    <option value="Track A">Track A</option>
                    <option value="Track B">Track B</option>
                    <option value="Both">Both</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="font-medium text-gray-700">Certification Status</span>
                <select
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 bg-white"
                  value={form.certificationStatus}
                  onChange={(e) => setForm((p) => ({ ...p, certificationStatus: e.target.value }))}
                >
                  <option value="Local">Local</option>
                  <option value="Regional">Regional</option>
                  <option value="International (USDA)">International (USDA)</option>
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Amount Sought (USD) *</span>
                <input
                  type="number"
                  required
                  min={0}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.amountSought}
                  onChange={(e) => setForm((p) => ({ ...p, amountSought: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Description *</span>
                <textarea
                  required
                  rows={3}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Member Farmers</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.memberFarmers}
                  onChange={(e) => setForm((p) => ({ ...p, memberFarmers: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Contact Name</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Contact Email</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Contact Phone</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.contactPhone}
                  onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Existing Buyers</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="e.g. Japan, France"
                  value={form.existingBuyers}
                  onChange={(e) => setForm((p) => ({ ...p, existingBuyers: e.target.value }))}
                />
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                />
                <span className="font-medium text-gray-700">Featured</span>
              </label>
              {modal.type === 'edit' ? (
                <label className="block">
                  <span className="font-medium text-gray-700">Status</span>
                  <select
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 bg-white"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="funded">funded</option>
                    <option value="closed">closed</option>
                  </select>
                </label>
              ) : null}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary-green text-white py-2 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
