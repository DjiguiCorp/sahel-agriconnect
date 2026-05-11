import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

function InviteFarmersSection({ coop, isFr }) {
  const [form, setForm] = useState({
    inviteeName: '',
    inviteePhone: '',
    inviteeEmail: '',
    inviteeRegion: '',
    message: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (!coop?._id) return;
    fetch(`${API_BASE_URL}/api/coop-invitations/cooperative/${coop._id}`)
      .then((r) => r.json())
      .then((d) => setInvitations(d.invitations || []))
      .catch(() => {});
  }, [coop?._id]);

  const sendInvite = async () => {
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(`${API_BASE_URL}/api/coop-invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooperativeId: coop._id, ...form }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setState({ loading: false, ok: true, err: '' });
      setInvitations((prev) => [{ ...form, inviteCode: d.invitation.inviteCode, status: 'sent', createdAt: new Date() }, ...prev]);
      setForm({ inviteeName: '', inviteePhone: '', inviteeEmail: '', inviteeRegion: '', message: '' });
      setTimeout(() => setState((s) => ({ ...s, ok: false })), 3000);
    } catch (err) {
      setState({ loading: false, ok: false, err: err.message });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
      <h3 className="font-bold text-brand-forest mb-4">📨 {isFr ? 'Inviter des agriculteurs' : 'Invite Farmers'}</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {[
          { key: 'inviteeName', label: isFr ? "Nom de l'agriculteur" : 'Farmer name' },
          { key: 'inviteePhone', label: isFr ? 'Téléphone WhatsApp *' : 'WhatsApp Phone *' },
          { key: 'inviteeEmail', label: isFr ? 'Email (optionnel)' : 'Email (optional)' },
          { key: 'inviteeRegion', label: isFr ? 'Région' : 'Region' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">{isFr ? "Message d'invitation personnalisé" : 'Personalized invitation message'}</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={2}
            placeholder={
              isFr
                ? 'Ex: Bonjour, nous cherchons des producteurs de karité dans votre région...'
                : 'Ex: Hello, we are looking for shea producers in your region...'
            }
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
          />
        </div>
      </div>

      {state.err && <p className="text-red-500 text-xs mb-3">{state.err}</p>}
      {state.ok && <p className="text-green-600 text-xs mb-3">✓ {isFr ? 'Invitation envoyée !' : 'Invitation sent!'}</p>}

      <button
        onClick={sendInvite}
        disabled={state.loading || !form.inviteePhone}
        className="bg-brand-forest text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {state.loading ? '...' : isFr ? "📨 Envoyer l'invitation" : '📨 Send Invitation'}
      </button>

      {invitations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            {isFr ? 'Invitations envoyées' : 'Sent invitations'} ({invitations.length})
          </p>
          <div className="space-y-2">
            {invitations.slice(0, 5).map((inv, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600 py-1 border-b border-gray-50">
                <span>{inv.inviteeName || inv.inviteePhone || '—'}</span>
                <div className="flex items-center gap-2">
                  {inv.inviteCode && <span className="font-mono text-gray-400">{inv.inviteCode}</span>}
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      inv.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : inv.status === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CooperativesTab({ token, isFr, globalCountryFilter = '' }) {
  const [cooperatives, setCooperatives] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/farmers`, { headers }).then((r) => r.json()),
    ])
      .then(([coops, farm]) => {
        const coopList = Array.isArray(coops) ? coops : coops.cooperatives || coops.registrations || [];
        setCooperatives(coopList);
        setFarmers(Array.isArray(farm) ? farm : farm.farmers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, headers]);

  const updateCoopStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE_URL}/api/cooperatives/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });
      setCooperatives((prev) => prev.map((c) => (c._id === id ? { ...c, status } : c)));
      setSelectedCoop((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
    } catch {
      /* ignore */
    }
  };

  const getCoopFarmers = (coop) =>
    farmers.filter(
      (f) =>
        f.cooperativeId === coop._id ||
        f.cooperative === (coop.cooperativeName || coop.nomCooperative)
    );

  const certProgress = (level) =>
    ({ None: 0, Local: 33, Regional: 66, International: 100 }[level] || 0);

  const cooperativesForView = useMemo(() => {
    if (!globalCountryFilter) return cooperatives;
    const cf = globalCountryFilter.toLowerCase();
    return cooperatives.filter((c) => {
      const blob = `${c.country || ''} ${c.pays || ''} ${c.regionCity || ''} ${c.localisation || ''}`.toLowerCase();
      return blob.includes(cf);
    });
  }, [cooperatives, globalCountryFilter]);

  if (selectedCoop && viewMode === 'detail') {
    const coopFarmers = getCoopFarmers(selectedCoop);
    const name = selectedCoop.cooperativeName || selectedCoop.nomCooperative;
    const leader = selectedCoop.leaderName || selectedCoop.nomResponsable;
    const cert = selectedCoop.certificationStatus || 'None';
    const certPct = certProgress(cert);

    return (
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedCoop(null);
              setViewMode('list');
            }}
            className="text-brand-forest hover:underline text-sm flex items-center gap-1"
          >
            ← {isFr ? 'Retour à la liste' : 'Back to list'}
          </button>
        </div>

        <div className="bg-[#1a3c2e] text-white rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              <p className="text-white/70 text-sm mt-1">
                🌍 {selectedCoop.country || selectedCoop.pays} · {selectedCoop.regionCity || '—'}
              </p>
              <p className="text-white/70 text-sm">
                👤 {leader} · 📧 {selectedCoop.email}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 ${
                selectedCoop.status === 'active'
                  ? 'bg-green-400/20 text-green-300'
                  : selectedCoop.status === 'pending'
                    ? 'bg-yellow-400/20 text-yellow-300'
                    : 'bg-gray-400/20 text-gray-300'
              }`}
            >
              {selectedCoop.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: '👩‍🌾',
              label: isFr ? 'Agriculteurs membres' : 'Member Farmers',
              value: coopFarmers.length || selectedCoop.memberCount || 0,
            },
            {
              icon: '🌾',
              label: isFr ? 'Culture principale' : 'Main Crop',
              value: selectedCoop.primaryCrops?.[0] || 'Shea',
            },
            {
              icon: '⭐',
              label: isFr ? 'Certification' : 'Certification',
              value: cert,
            },
            {
              icon: '💰',
              label: isFr ? 'Intérêts' : 'Interests',
              value: `${(selectedCoop.interests || []).length} ${isFr ? 'programmes' : 'programs'}`,
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <span className="text-2xl">{icon}</span>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
              <p className="font-bold text-brand-forest text-sm mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-brand-forest mb-3">
            {isFr ? '⭐ Parcours de certification' : '⭐ Certification Pathway'}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            {['None', 'Local', 'Regional', 'International'].map((level, i) => (
              <div key={level} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex-1 h-3 rounded-full ${certPct >= i * 33 ? 'bg-brand-forest' : 'bg-gray-200'}`}
                />
                {i < 3 && <div className="w-1" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{isFr ? 'Aucune' : 'None'}</span>
            <span>Local</span>
            <span>Regional</span>
            <span>International</span>
          </div>
          <p className="text-sm text-brand-forest font-semibold mt-2">
            {isFr ? `Niveau actuel: ${cert}` : `Current level: ${cert}`}
          </p>
          {cert !== 'International' && (
            <a
              href={`mailto:${selectedCoop.email}?subject=Prochaine étape certification — Sahel AgriConnect`}
              className="inline-block mt-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
            >
              ⭐ {isFr ? 'Initier la prochaine étape' : 'Initiate next step'}
            </a>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-brand-forest mb-3">
            {isFr ? '🎯 Programmes demandés' : '🎯 Requested Programs'}
          </h3>
          {(selectedCoop.interests || []).length === 0 ? (
            <p className="text-gray-400 text-sm">
              {isFr ? 'Aucun programme sélectionné.' : 'No programs selected.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(selectedCoop.interests || []).map((interest) => (
                <span
                  key={interest}
                  className="text-sm px-3 py-1.5 rounded-full bg-brand-forest/10 text-brand-forest font-medium"
                >
                  {interest === 'Equipment Fund'
                    ? `🔧 ${isFr ? 'Fonds équipement' : 'Equipment Fund'}`
                    : interest === 'Certification'
                      ? '⭐ Certification'
                      : interest === 'Diaspora Investment'
                        ? `💰 ${isFr ? 'Investissement diaspora' : 'Diaspora Investment'}`
                        : interest === 'Export Program'
                          ? `🌍 ${isFr ? 'Programme export' : 'Export Program'}`
                          : interest}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-brand-forest">
              👩‍🌾{' '}
              {isFr
                ? `Agriculteurs membres (${coopFarmers.length})`
                : `Member Farmers (${coopFarmers.length})`}
            </h3>
          </div>
          {coopFarmers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                {isFr
                  ? 'Aucun agriculteur lié à cette coopérative dans la base.'
                  : 'No farmers linked to this cooperative in database.'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {isFr
                  ? `La coopérative déclare ${selectedCoop.memberCount || 0} membres.`
                  : `Cooperative reports ${selectedCoop.memberCount || 0} members.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[isFr ? 'Nom' : 'Name', isFr ? 'Région' : 'Region', isFr ? 'Culture' : 'Crop', isFr ? 'Statut' : 'Status'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {coopFarmers.slice(0, 10).map((f, i) => (
                  <tr key={f._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-medium text-brand-forest">
                      {f.nomComplet || f.fullName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{f.region || f.zone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {f.culturesPrincipales?.[0] || f.mainCrop || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          f.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {f.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-brand-forest mb-3">
            {isFr ? '⚡ Actions rapides admin' : '⚡ Admin Quick Actions'}
          </h3>
          <div className="mb-2">
            <button
              onClick={async () => {
                await fetch(`${API_BASE_URL}/api/cooperatives/${selectedCoop._id}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify({ status: 'active', paymentReceived: true, paymentDate: new Date() }),
                });
                setCooperatives((prev) =>
                  prev.map((c) => (c._id === selectedCoop._id ? { ...c, status: 'active' } : c))
                );
                setSelectedCoop((c) => ({ ...c, status: 'active' }));
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition w-full justify-center"
            >
              💳 {isFr ? 'Confirmer paiement reçu — Activer portail' : 'Confirm Payment Received — Activate Portal'}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              {
                icon: '✅',
                label: isFr ? 'Activer la coopérative' : 'Activate Cooperative',
                action: () => updateCoopStatus(selectedCoop._id, 'active'),
                color: 'bg-green-50 text-green-700 border-green-200',
              },
              {
                icon: '📚',
                href: `mailto:${selectedCoop.email}?subject=Formation disponible — Sahel AgriConnect`,
                label: isFr ? 'Proposer une formation' : 'Propose Training',
                color: 'bg-purple-50 text-purple-700 border-purple-200',
              },
              {
                icon: '💰',
                href: `mailto:${selectedCoop.email}?subject=Opportunité investisseur diaspora — AfriYield Exchange`,
                label: isFr ? 'Connecter un investisseur' : 'Connect Investor',
                color: 'bg-[#B5850A]/10 text-[#B5850A] border-[#B5850A]/20',
              },
              {
                icon: '🔧',
                href: `mailto:${selectedCoop.email}?subject=Fonds équipement — Éligibilité confirmée`,
                label: isFr ? 'Confirmer fonds équipement' : 'Confirm Equipment Fund',
                color: 'bg-blue-50 text-blue-700 border-blue-200',
              },
              {
                icon: '🌍',
                href: `mailto:${selectedCoop.email}?subject=Programme export — Prochaines étapes`,
                label: isFr ? 'Initier programme export' : 'Initiate Export Program',
                color: 'bg-red-50 text-red-700 border-red-200',
              },
              {
                icon: '🌾',
                href: `mailto:${selectedCoop.email}?subject=Production hors-saison — Opportunité`,
                label: isFr ? 'Production hors-saison' : 'Off-Season Production',
                color: 'bg-orange-50 text-orange-700 border-orange-200',
              },
            ].map((action) =>
              action.href ? (
                <a
                  key={action.label}
                  href={action.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:opacity-80 transition ${action.color}`}
                >
                  <span>{action.icon}</span> {action.label}
                </a>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.action}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:opacity-80 transition ${action.color}`}
                >
                  <span>{action.icon}</span> {action.label}
                </button>
              )
            )}
          </div>
        </div>

        <InviteFarmersSection coop={selectedCoop} isFr={isFr} />

        <div className="mt-6 pt-5 border-t border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">
            {isFr ? 'Zone dangereuse' : 'Danger zone'}
          </p>
          <button
            type="button"
            onClick={() => {
              const coopName = selectedCoop.cooperativeName || selectedCoop.nomCooperative || 'cooperative';
              if (
                window.confirm(
                  isFr
                    ? `Supprimer définitivement ${coopName} ? Les liens membres et invitations seront supprimés. Irréversible.`
                    : `Permanently delete ${coopName}? All member links and invitations will be removed. This cannot be undone.`
                )
              ) {
                fetch(`${API_BASE_URL}/api/deletion-requests/admin/users/cooperative/${selectedCoop._id}`, {
                  method: 'DELETE',
                  headers,
                  body: JSON.stringify({ reason: 'Admin deletion from cooperative tab', notify: true }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success) {
                      setSelectedCoop(null);
                      setCooperatives((prev) => prev.filter((c) => c._id !== selectedCoop._id));
                      setViewMode('list');
                    } else {
                      // eslint-disable-next-line no-alert
                      alert(d.error || 'Delete failed');
                    }
                  })
                  .catch(() => {
                    // eslint-disable-next-line no-alert
                    alert('Delete failed');
                  });
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
          >
            🗑 {isFr ? 'Supprimer cette coopérative définitivement' : 'Delete this cooperative permanently'}
          </button>
        </div>
      </div>
    );
  }

  const filtered =
    statusFilter === 'all'
      ? cooperativesForView
      : cooperativesForView.filter((c) => (c.status || 'pending') === statusFilter);

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Gestion des Coopératives' : 'Cooperative Management'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? 'Chaque coopérative a son propre espace de données et ses programmes'
              : 'Each cooperative has its own data space and programs'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: isFr ? 'Total' : 'Total',
            value: cooperativesForView.length,
            bg: 'bg-gray-50',
            color: 'text-gray-700',
          },
          {
            label: isFr ? 'Actives' : 'Active',
            value: cooperativesForView.filter((c) => c.status === 'active').length,
            bg: 'bg-green-50',
            color: 'text-green-700',
          },
          {
            label: isFr ? 'En attente' : 'Pending',
            value: cooperativesForView.filter((c) => !c.status || c.status === 'pending').length,
            bg: 'bg-yellow-50',
            color: 'text-yellow-700',
          },
          {
            label: isFr ? '⏳ Paiement en attente' : '⏳ Awaiting Payment',
            value: cooperativesForView.filter((c) => c.status === 'pending_payment' || c.paymentReceived === false).length,
            bg: 'bg-amber-50',
            color: 'text-amber-700',
          },
          {
            label: isFr ? 'Total membres' : 'Total Members',
            value: cooperativesForView.reduce((s, c) => s + (c.memberCount || c.nombreMembres || 0), 0),
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

      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'pending', 'pending_payment'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
              statusFilter === f ? 'bg-brand-forest text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all'
              ? isFr
                ? 'Toutes'
                : 'All'
              : f === 'active'
                ? isFr
                  ? 'Actives'
                  : 'Active'
                : f === 'pending_payment'
                  ? isFr
                    ? '⏳ Paiement en attente'
                    : '⏳ Awaiting Payment'
                : isFr
                  ? 'En attente'
                  : 'Pending'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">🤝</p>
          <p className="text-gray-500">{isFr ? 'Aucune coopérative.' : 'No cooperatives.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((coop) => {
            const name = coop.cooperativeName || coop.nomCooperative;
            const cert = coop.certificationStatus || 'None';
            const certPct = certProgress(cert);
            const coopFarmers = getCoopFarmers(coop);

            return (
              <div
                key={coop._id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCoop(coop);
                    setViewMode('detail');
                  }
                }}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-brand-forest/30 transition cursor-pointer"
                onClick={() => {
                  setSelectedCoop(coop);
                  setViewMode('detail');
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-brand-forest">{name}</p>
                    <p className="text-xs text-gray-500">
                      🌍 {coop.country || coop.pays} · {coop.regionCity || '—'}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      coop.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {coop.status || 'pending'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-brand-forest font-mono">
                      {coop.memberCount || coopFarmers.length || 0}
                    </p>
                    <p className="text-xs text-gray-400">{isFr ? 'Membres' : 'Members'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-amber-600">{cert}</p>
                    <p className="text-xs text-gray-400">{isFr ? 'Certification' : 'Certification'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-brand-forest font-mono">
                      {(coop.interests || []).length}
                    </p>
                    <p className="text-xs text-gray-400">{isFr ? 'Programmes' : 'Programs'}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{isFr ? 'Parcours certification' : 'Cert. pathway'}</span>
                    <span>{certPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-400 to-brand-forest"
                      style={{ width: `${certPct}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-brand-forest font-medium mt-2">
                  {isFr ? 'Voir le détail →' : 'View details →'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
