import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../config/api';

export default function AfriYieldAdminTab({ token, isFr }) {
  const [opportunities, setOpportunities] = useState([]);
  const [escrowTxs, setEscrowTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    centerName: '',
    location: '',
    country: '',
    commodity: 'Shea Butter',
    track: 'Track B',
    certificationStatus: 'Local',
    amountSought: '',
    minInvestment: '1000',
    expectedROIMin: '12',
    expectedROIMax: '25',
    cycledays: '120',
    description: '',
    descriptionFr: '',
    memberFarmers: '',
    contactEmail: '',
    contactPhone: '',
    featured: false,
    verified: false,
    insuranceCoverage: false,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [opsRes, escRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/opportunities/all`, { headers }),
        fetch(`${API_BASE_URL}/api/escrow`, { headers }),
      ]);
      const opsJson = await opsRes.json().catch(() => ({}));
      const escJson = await escRes.json().catch(() => ({}));
      setOpportunities(opsJson.opportunities || []);
      setEscrowTxs(escJson.transactions || []);
    } catch {
      setOpportunities([]);
      setEscrowTxs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setOpportunities([]);
      setEscrowTxs([]);
      return;
    }
    loadData();
  }, [token, loadData]);

  const createOpportunity = async () => {
    const body = {
      ...form,
      amountSought: Number(form.amountSought),
      minInvestment: Number(form.minInvestment),
      expectedROIMin: Number(form.expectedROIMin),
      expectedROIMax: Number(form.expectedROIMax),
      cycledays: Number(form.cycledays),
      memberFarmers: Number(form.memberFarmers || 0),
      status: 'active',
      milestones: [
        {
          label: isFr ? 'Production confirmée' : 'Production confirmed',
          percentOfTotal: 30,
          status: 'pending',
        },
        {
          label: isFr ? 'Test qualité réussi' : 'Quality test passed',
          percentOfTotal: 30,
          status: 'pending',
        },
        {
          label: isFr ? 'Livraison vérifiée' : 'Delivery verified',
          percentOfTotal: 40,
          status: 'pending',
        },
      ],
    };
    await fetch(`${API_BASE_URL}/api/opportunities`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    setShowForm(false);
    loadData();
  };

  const updateOpportunityStatus = async (id, newStatus) => {
    await fetch(`${API_BASE_URL}/api/opportunities/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: newStatus }),
    });
    setOpportunities((prev) => prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o)));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">AfriYield Exchange — Admin</h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? 'Gérez les opportunités, le pipeline, les investisseurs et les transactions escrow'
              : 'Manage opportunities, pipeline, investors, and escrow transactions'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#B5850A] text-[#1a3c2e] px-4 py-2 rounded-xl text-sm font-bold"
        >
          + {isFr ? 'Nouvelle opportunité' : 'New Opportunity'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: isFr ? 'Total opportunités' : 'Total opportunities',
            value: opportunities.length,
            bg: 'bg-gray-50',
            color: 'text-gray-700',
          },
          {
            label: isFr ? 'Actives' : 'Active',
            value: opportunities.filter((o) => o.status === 'active').length,
            bg: 'bg-green-50',
            color: 'text-green-700',
          },
          {
            label: isFr ? 'Financées' : 'Funded',
            value: opportunities.filter((o) => o.status === 'funded').length,
            bg: 'bg-amber-50',
            color: 'text-amber-700',
          },
          {
            label: isFr ? 'Capital total (USD)' : 'Total capital (USD)',
            value: `$${opportunities.reduce((s, o) => s + (o.amountSought || 0), 0).toLocaleString()}`,
            bg: 'bg-blue-50',
            color: 'text-blue-700',
          },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-brand-forest">
            {isFr ? "Pipeline d'opportunités" : 'Opportunity Pipeline'}
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🌾</p>
            <p className="text-gray-500 text-sm">{isFr ? 'Aucune opportunité créée.' : 'No opportunities created yet.'}</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 text-[#B5850A] text-sm font-semibold hover:underline"
            >
              + {isFr ? 'Créer la première' : 'Create the first one'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50">
                <tr>
                  {[isFr ? 'Centre/Coop' : 'Center/Coop', 'Track', isFr ? 'Commodité' : 'Commodity', isFr ? 'Montant' : 'Amount', isFr ? 'Levé' : 'Raised', 'ROI', 'Score', isFr ? 'Statut' : 'Status', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => (
                  <tr key={opp._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-medium text-brand-forest">
                      {opp.featured && <span className="text-amber-500 mr-1">⭐</span>}
                      {opp.centerName}
                      <div className="text-xs text-gray-400">
                        {opp.location}, {opp.country}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-bold text-white"
                        style={{
                          background: { 'Track A': '#1a3c2e', 'Track B': '#B5850A', 'Track C': '#3b82f6', All: '#6b7280' }[
                            opp.track
                          ] || '#6b7280',
                        }}
                      >
                        {opp.track}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{opp.commodity}</td>
                    <td className="px-4 py-3 font-mono font-semibold">${(opp.amountSought || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">${(opp.amountRaised || 0).toLocaleString()}</div>
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full bg-[#B5850A]"
                          style={{
                            width: `${Math.min(100, Math.round(((opp.amountRaised || 0) / (opp.amountSought || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#B5850A]">
                      {opp.expectedROIMin}–{opp.expectedROIMax}%
                    </td>
                    <td className="px-4 py-3">
                      {opp.afriyieldScore > 0 ? (
                        <span
                          className="font-bold text-sm"
                          style={{ color: opp.afriyieldScore >= 70 ? '#16a34a' : '#B5850A' }}
                        >
                          {opp.afriyieldScore}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={opp.status}
                        onChange={(e) => updateOpportunityStatus(opp._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${
                          opp.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : opp.status === 'funded'
                              ? 'bg-amber-100 text-amber-700'
                              : opp.status === 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="draft">draft</option>
                        <option value="pending">pending</option>
                        <option value="active">{isFr ? 'Actif' : 'Active'}</option>
                        <option value="funded">{isFr ? 'Financé' : 'Funded'}</option>
                        <option value="in_progress">{isFr ? 'En cours' : 'In Progress'}</option>
                        <option value="completed">{isFr ? 'Complété' : 'Completed'}</option>
                        <option value="closed">{isFr ? 'Fermé' : 'Closed'}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/afri-yield/opportunities/${opp._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#B5850A] hover:underline"
                      >
                        {isFr ? 'Voir →' : 'View →'}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-brand-forest">
            {isFr ? 'Transactions escrow' : 'Escrow transactions'} ({escrowTxs.length})
          </h3>
        </div>
        {escrowTxs.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">
            {isFr ? 'Aucune transaction.' : 'No transactions yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {escrowTxs.map((tx) => (
              <li key={tx._id} className="px-5 py-3 text-sm flex justify-between gap-2">
                <span className="text-gray-700 truncate">{tx.supplierName || tx.investorEmail}</span>
                <span className="text-gray-500 shrink-0">${tx.totalAmountUSD?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold text-brand-forest text-xl mb-4">
              {isFr ? '+ Nouvelle opportunité AfriYield' : '+ New AfriYield Opportunity'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'centerName', label: isFr ? 'Nom du centre/coopérative' : 'Center/Cooperative name', required: true },
                { key: 'location', label: isFr ? 'Localisation' : 'Location', required: true },
                { key: 'country', label: isFr ? 'Pays' : 'Country', required: true },
                { key: 'contactEmail', label: 'Email contact' },
                { key: 'contactPhone', label: isFr ? 'Téléphone' : 'Phone' },
                { key: 'memberFarmers', label: isFr ? 'Nb agriculteurs membres' : 'Member farmers', type: 'number' },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && ' *'}
                  </label>
                  <input
                    type={type || 'text'}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </div>
              ))}
              {[
                {
                  key: 'commodity',
                  label: isFr ? 'Commodité' : 'Commodity',
                  opts: ['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton', 'Other'],
                },
                { key: 'track', label: 'Track', opts: ['Track A', 'Track B', 'Track C', 'All'] },
                {
                  key: 'certificationStatus',
                  label: isFr ? 'Certification' : 'Certification',
                  opts: ['Local', 'Regional (ECOWAS)', 'International (EU/USDA)', 'Pending'],
                },
              ].map(({ key, label, opts }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <select
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#B5850A]"
                  >
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {[
                { key: 'amountSought', label: isFr ? 'Montant recherché (USD)' : 'Amount sought (USD)', required: true },
                { key: 'minInvestment', label: isFr ? 'Investissement minimum' : 'Minimum investment' },
                { key: 'expectedROIMin', label: 'ROI min %' },
                { key: 'expectedROIMax', label: 'ROI max %' },
                { key: 'cycledays', label: isFr ? 'Durée du cycle (jours)' : 'Cycle duration (days)' },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && ' *'}
                  </label>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Description (EN)' : 'Description (EN)'} *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
                <textarea
                  value={form.descriptionFr}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionFr: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] resize-none"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-4">
                {[
                  { key: 'featured', label: isFr ? '⭐ En vedette' : '⭐ Featured' },
                  { key: 'verified', label: isFr ? '✓ Vérifié AfriYield' : '✓ AfriYield Verified' },
                  { key: 'insuranceCoverage', label: isFr ? '🛡 Assuré' : '🛡 Insured' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-[#B5850A]"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={createOpportunity}
                className="flex-1 bg-[#B5850A] text-[#1a3c2e] rounded-xl py-3 font-bold text-sm hover:opacity-90"
              >
                {isFr ? "Créer l'opportunité" : 'Create Opportunity'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
