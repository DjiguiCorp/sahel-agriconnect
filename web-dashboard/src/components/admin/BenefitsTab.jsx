import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { mergeCooperativeSources } from './CentralAdminTabs';

function headersWith(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Map UI benefit keys → Perk.type enum */
function mapBenefitTypeToPerk(key) {
  const m = {
    equipment: 'equipment',
    certification: 'training',
    training: 'training',
    investment: 'financial',
    export: 'financial',
    seasonal: 'fertilizer',
  };
  return m[key] || 'equipment';
}

function perkStatut(p) {
  return p.statut || p.status || 'pending';
}

export default function BenefitsTab({ token, isFr }) {
  const [cooperatives, setCooperatives] = useState([]);
  const [perks, setPerks] = useState([]);
  const [equipmentApps, setEquipmentApps] = useState([]);
  const [certApps, setCertApps] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    coopId: '',
    benefitType: '',
    description: '',
    value: '',
    expiry: '',
  });
  const [granting, setGranting] = useState(false);

  const headers = headersWith(token);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminJ, platJ, perksJ, equipJ, certsJ, trainsJ, farmersJ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/perks`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/equipment-fund/applications`, { headers })
          .then((r) => r.json())
          .catch(() => ({ applications: [] })),
        fetch(`${API_BASE_URL}/api/certifications`, { headers }).then((r) => r.json()),
        fetch(`${API_ENDPOINTS.TRAININGS.BASE}`, { headers }).then((r) => r.json()),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=800`, { headers }).then((r) => r.json()),
      ]);

      const admin = adminJ.cooperatives || [];
      const plat = platJ.registrations || [];
      setCooperatives(mergeCooperativeSources(admin, plat));

      setPerks(perksJ.perks || perksJ || []);
      const eq = equipJ.applications || equipJ || [];
      setEquipmentApps(Array.isArray(eq) ? eq : []);
      setCertApps(certsJ.certifications || certsJ || []);
      const tr = trainsJ.trainings || trainsJ || [];
      setTrainings(Array.isArray(tr) ? tr : []);
      const fl = Array.isArray(farmersJ) ? farmersJ : farmersJ.farmers || [];
      setFarmers(fl);
    } catch {
      setPerks([]);
      setEquipmentApps([]);
      setCertApps([]);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const benefitTypes = [
    {
      key: 'equipment',
      icon: '🔧',
      label: isFr ? 'Équipement' : 'Equipment',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      key: 'certification',
      icon: '⭐',
      label: isFr ? 'Certification' : 'Certification',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'training',
      icon: '📚',
      label: isFr ? 'Formation' : 'Training',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      key: 'investment',
      icon: '💰',
      label: isFr ? 'Investissement diaspora' : 'Diaspora Investment',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      key: 'export',
      icon: '🌍',
      label: isFr ? 'Programme export' : 'Export Program',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      key: 'seasonal',
      icon: '🌾',
      label: isFr ? 'Production hors-saison' : 'Off-Season Production',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
  ];

  const resolveFarmerForCoop = (coopId) => {
    const coop = cooperatives.find((c) => String(c._id) === String(coopId));
    const name = (coop?.cooperativeName || coop?.nomCooperative || coop?.nom || '').trim();
    const match = farmers.find(
      (f) =>
        String(f.nomCooperative || '')
          .toLowerCase()
          .includes(name.slice(0, 12).toLowerCase()) ||
        String(name).length > 0 && String(f.region || '').includes(String(coop?.country || ''))
    );
    return (match || farmers[0])?._id || (match || farmers[0])?.id;
  };

  const grantBenefit = async () => {
    if (!grantForm.coopId || !grantForm.benefitType) return;
    const farmerId = resolveFarmerForCoop(grantForm.coopId);
    if (!farmerId) {
      alert(isFr ? 'Aucun agriculteur trouvé pour lier la demande.' : 'No farmer found to attach the perk.');
      return;
    }
    setGranting(true);
    try {
      const type = mapBenefitTypeToPerk(grantForm.benefitType);
      const notesExtra = [
        grantForm.value && `value:${grantForm.value}`,
        grantForm.expiry && `expiry:${grantForm.expiry}`,
        'grantedByAdmin:true',
      ]
        .filter(Boolean)
        .join(' | ');
      const res = await fetch(`${API_BASE_URL}/api/perks/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          farmerId,
          cooperativeId: grantForm.coopId,
          type,
          description:
            grantForm.description?.trim() ||
            (isFr ? `Avantage accordé par admin (${grantForm.benefitType})` : `Admin-granted benefit (${grantForm.benefitType})`),
          notes: notesExtra,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || 'Request failed');
      const perkId = data.perk?._id || data.perk?.id;
      if (perkId) {
        await fetch(`${API_BASE_URL}/api/perks/${perkId}/approve`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            notes: grantForm.description || 'Admin grant',
          }),
        });
      }
      setShowGrantModal(false);
      setGrantForm({ coopId: '', benefitType: '', description: '', value: '', expiry: '' });
      await load();
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setGranting(false);
    }
  };

  const updatePerkStatus = async (id, action) => {
    const path =
      action === 'approved' ? 'approve' : action === 'rejected' ? 'reject' : action === 'fulfilled' ? 'fulfill' : null;
    if (!path) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/perks/${id}/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await load();
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  const filteredPerks = useMemo(() => {
    if (filter === 'all') return perks;
    return perks.filter((p) => perkStatut(p) === filter);
  }, [perks, filter]);

  const stats = [
    {
      label: isFr ? 'Total demandes' : 'Total requests',
      value: perks.length,
      bg: 'bg-gray-50',
      color: 'text-gray-700',
    },
    {
      label: isFr ? 'En attente' : 'Pending',
      value: perks.filter((p) => perkStatut(p) === 'pending').length,
      bg: 'bg-yellow-50',
      color: 'text-yellow-700',
    },
    {
      label: isFr ? 'Approuvés' : 'Approved',
      value: perks.filter((p) => perkStatut(p) === 'approved').length,
      bg: 'bg-green-50',
      color: 'text-green-700',
    },
    {
      label: isFr ? 'Remplis' : 'Fulfilled',
      value: perks.filter((p) => perkStatut(p) === 'fulfilled').length,
      bg: 'bg-blue-50',
      color: 'text-blue-700',
    },
  ];

  const perksByBenefitKey = (key) =>
    perks.filter((p) => (p.type || p.benefitType) === key || (p.details && String(p.notes).includes(key))).length;

  const coopName = (coop) => coop.cooperativeName || coop.nomCooperative || coop.nom;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
        {isFr ? 'Chargement…' : 'Loading…'}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Avantages & Bénéfices Coopératifs' : 'Cooperative Benefits & Advantages'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? 'Gérez tous les avantages disponibles pour les coopératives membres'
              : 'Manage all benefits available to member cooperatives'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGrantModal(true)}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + {isFr ? 'Accorder un avantage' : 'Grant Benefit'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, bg, color }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {benefitTypes.map((b) => (
          <div key={b.key} className={`rounded-xl border p-4 ${b.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{b.icon}</span>
              <span className="font-semibold text-sm">{b.label}</span>
            </div>
            <p className="text-2xl font-bold font-mono">
              {b.key === 'equipment'
                ? equipmentApps.length
                : b.key === 'certification'
                  ? certApps.length
                  : b.key === 'training'
                    ? trainings.length
                    : perksByBenefitKey(b.key)}
            </p>
            <p className="text-xs opacity-70 mt-0.5">{isFr ? 'éléments / demandes' : 'items / requests'}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-brand-forest">
            {isFr ? 'Avantages par coopérative' : 'Benefits by Cooperative'}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {cooperatives.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🎁</p>
              <p className="text-gray-500 text-sm">
                {isFr ? 'Aucune coopérative enregistrée.' : 'No cooperatives registered.'}
              </p>
            </div>
          ) : (
            cooperatives.map((coop) => {
              const name = coopName(coop);
              const coopPerks = perks.filter(
                (p) =>
                  String(p.cooperativeId?._id || p.cooperativeId) === String(coop._id)
              );
              const coopEquip = equipmentApps.filter(
                (e) =>
                  String(e.cooperativeName || '').toLowerCase() === String(name || '').toLowerCase()
              );
              const coopCert = certApps.filter((c) => {
                const fn = c.farmerId?.nomCooperative || c.farmerId?.nom || '';
                return name && String(fn).toLowerCase().includes(String(name).slice(0, 8).toLowerCase());
              });
              const coopTraining = trainings.filter(
                (t) =>
                  String(t.cooperativeId || t.cooperative || '') === String(coop._id)
              );
              const country = coop.country || coop.pays;
              const certLevel = coop.certificationStatus || 'None';
              const email =
                coop.email ||
                coop.contact ||
                coop.leaderEmail ||
                'info@djiguicorporation.org';

              return (
                <div key={coop._id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div>
                      <p className="font-bold text-brand-forest">{name}</p>
                      <p className="text-xs text-gray-500">
                        🌍 {country} · {coop.memberCount ?? coop.nombreMembres ?? 0}{' '}
                        {isFr ? 'membres' : 'members'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGrantForm((f) => ({ ...f, coopId: coop._id }));
                        setShowGrantModal(true);
                      }}
                      className="text-xs bg-brand-forest text-white px-3 py-1.5 rounded-lg hover:bg-brand-forest/90 shrink-0"
                    >
                      + {isFr ? 'Avantage' : 'Benefit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        icon: '🔧',
                        label: isFr ? 'Équipement' : 'Equipment',
                        count: coopEquip.length,
                        status: coopEquip[0]?.status,
                      },
                      {
                        icon: '⭐',
                        label: isFr ? 'Certification' : 'Certification',
                        count: coopCert.length,
                        status: certLevel !== 'None' ? certLevel : null,
                      },
                      {
                        icon: '📚',
                        label: isFr ? 'Formation' : 'Training',
                        count: coopTraining.length,
                        status: coopTraining[0]?.statut || coopTraining[0]?.status,
                      },
                      {
                        icon: '🎁',
                        label: isFr ? 'Avantages' : 'Benefits',
                        count: coopPerks.length,
                        status: perkStatut(coopPerks[0]),
                      },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <span className="text-lg">{item.icon}</span>
                        <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                        <p
                          className={`text-lg font-bold font-mono ${item.count > 0 ? 'text-brand-forest' : 'text-gray-300'}`}
                        >
                          {item.count}
                        </p>
                        {item.status ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            {item.status}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent('Formation disponible — Sahel AgriConnect')}&body=${encodeURIComponent(`Bonjour ${coop.leaderName || coop.responsable || name},\n\nNous avons une formation disponible pour votre coopérative. Veuillez nous confirmer votre intérêt.`)}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                    >
                      📚 {isFr ? 'Proposer formation' : 'Propose Training'}
                    </a>
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent("Opportunité d'investissement diaspora — AfriYield Exchange")}&body=${encodeURIComponent(`Bonjour ${coop.leaderName || coop.responsable || name},\n\nUn investisseur diaspora est intéressé par votre coopérative sur AfriYield Exchange.`)}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition"
                    >
                      💰 {isFr ? 'Connecter investisseur' : 'Connect Investor'}
                    </a>
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent('Certification export — Prochaines étapes')}&body=${encodeURIComponent(`Bonjour ${coop.leaderName || coop.responsable || name},\n\nVotre coopérative est éligible à la prochaine étape de certification export.`)}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                    >
                      ⭐ {isFr ? 'Avancer certification' : 'Advance Certification'}
                    </a>
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent('Programme hors-saison — Opportunité')}&body=${encodeURIComponent(`Bonjour ${coop.leaderName || coop.responsable || name},\n\nUne opportunité de production hors-saison est disponible pour votre coopérative.`)}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
                    >
                      🌾 {isFr ? 'Hors-saison' : 'Off-Season'}
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-bold text-brand-forest">
            {isFr ? "Demandes en attente d'approbation" : 'Pending Approval Requests'}
          </h3>
          <div className="flex gap-1 flex-wrap">
            {['all', 'pending', 'approved', 'fulfilled', 'rejected'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filter === f ? 'bg-brand-forest text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all'
                  ? isFr
                    ? 'Tous'
                    : 'All'
                  : f === 'pending'
                    ? isFr
                      ? 'En attente'
                      : 'Pending'
                    : f === 'approved'
                      ? isFr
                        ? 'Approuvés'
                        : 'Approved'
                      : f === 'fulfilled'
                        ? isFr
                          ? 'Remplis'
                          : 'Fulfilled'
                        : isFr
                          ? 'Rejetés'
                          : 'Rejected'}
              </button>
            ))}
          </div>
        </div>
        {filteredPerks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-gray-400 text-sm">{isFr ? 'Aucune demande.' : 'No requests.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  {[isFr ? 'Coopérative' : 'Cooperative', isFr ? 'Avantage demandé' : 'Benefit Requested', isFr ? 'Statut' : 'Status', isFr ? 'Date' : 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPerks.map((perk, i) => {
                  const st = perkStatut(perk);
                  return (
                    <tr key={perk._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-medium text-brand-forest">
                        {perk.cooperativeId?.nom || perk.cooperativeName || perk.requestedBy || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {perk.type || perk.benefitType || perk.description || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            st === 'approved'
                              ? 'bg-green-50 text-green-700'
                              : st === 'pending'
                                ? 'bg-yellow-50 text-yellow-700'
                                : st === 'fulfilled'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {perk.createdAt ? new Date(perk.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {st === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updatePerkStatus(perk._id, 'approved')}
                                className="text-xs text-green-600 hover:underline font-medium"
                              >
                                {isFr ? 'Approuver' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePerkStatus(perk._id, 'rejected')}
                                className="text-xs text-red-500 hover:underline"
                              >
                                {isFr ? 'Rejeter' : 'Reject'}
                              </button>
                            </>
                          )}
                          {st === 'approved' && (
                            <button
                              type="button"
                              onClick={() => updatePerkStatus(perk._id, 'fulfilled')}
                              className="text-xs text-blue-600 hover:underline font-medium"
                            >
                              {isFr ? 'Marquer rempli' : 'Mark Fulfilled'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-brand-forest text-xl mb-4">
              {isFr ? 'Accorder un avantage' : 'Grant a Benefit'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Coopérative' : 'Cooperative'}
                </label>
                <select
                  value={grantForm.coopId}
                  onChange={(e) => setGrantForm((f) => ({ ...f, coopId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  {cooperatives.map((c) => (
                    <option key={c._id} value={c._id}>
                      {coopName(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? "Type d'avantage" : 'Benefit Type'}
                </label>
                <select
                  value={grantForm.benefitType}
                  onChange={(e) => setGrantForm((f) => ({ ...f, benefitType: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  {benefitTypes.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.icon} {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Description' : 'Description'}
                </label>
                <textarea
                  value={grantForm.description}
                  onChange={(e) => setGrantForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Valeur / Montant' : 'Value / Amount'}
                  </label>
                  <input
                    value={grantForm.value}
                    onChange={(e) => setGrantForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="ex: $500, 2 formations"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Expiration' : 'Expiry Date'}
                  </label>
                  <input
                    type="date"
                    value={grantForm.expiry}
                    onChange={(e) => setGrantForm((f) => ({ ...f, expiry: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                disabled={granting}
                onClick={grantBenefit}
                className="flex-1 bg-brand-forest text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-50"
              >
                {isFr ? 'Accorder' : 'Grant Benefit'}
              </button>
              <button
                type="button"
                onClick={() => setShowGrantModal(false)}
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
