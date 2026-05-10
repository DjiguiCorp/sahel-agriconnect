import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../../config/api';

const CooperativesManagement = ({ globalCountryFilter = '' }) => {
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [toolsUpdate, setToolsUpdate] = useState({});

  const [cooperatives, setCooperatives] = useState([]);
  const [pendingRegs, setPendingRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${base}/api/cooperatives/admin`, { headers }).then((r) => r.json()),
      fetch(`${base}/api/cooperatives/platform-registrations?status=pending`, { headers }).then((r) =>
        r.json()
      ),
    ])
      .then(([adminData, pendData]) => {
        setCooperatives(adminData.cooperatives || adminData || []);
        setPendingRegs(pendData.registrations || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur de chargement — vérifiez la connexion au serveur');
        setLoading(false);
      });
  }, []);

  const handleToolUpdate = (coopId, tool, value) => {
    setToolsUpdate((prev) => ({
      ...prev,
      [coopId]: {
        ...prev[coopId],
        [tool]: value,
      },
    }));
  };

  const saveToolsUpdate = async (coopId) => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const token = localStorage.getItem('adminToken');
    const updates = toolsUpdate[coopId];
    if (!updates) return;

    try {
      await fetch(`${base}/api/cooperatives/${coopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ outils: updates }),
      });
      setCooperatives((prev) =>
        prev.map((c) =>
          c._id === coopId ? { ...c, outils: { ...c.outils, ...updates } } : c
        )
      );
      setToolsUpdate((prev) => {
        const updated = { ...prev };
        delete updated[coopId];
        return updated;
      });
    } catch {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const filteredCoops = useMemo(() => {
    if (!globalCountryFilter) return cooperatives;
    const cf = globalCountryFilter.toLowerCase();
    return cooperatives.filter((c) => String(c.localisation || '').toLowerCase().includes(cf));
  }, [cooperatives, globalCountryFilter]);

  const filteredPending = useMemo(() => {
    if (!globalCountryFilter) return pendingRegs;
    const cf = globalCountryFilter.toLowerCase();
    return pendingRegs.filter((r) => String(r.country || '').toLowerCase().includes(cf));
  }, [pendingRegs, globalCountryFilter]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Coopératives</h2>
        <p className="text-gray-600">Suivi et gestion des coopératives locales</p>
      </div>

      {filteredPending.length > 0 ? (
        <div className="card mb-8 border-amber-200 bg-amber-50/50">
          <h3 className="text-xl font-bold text-amber-900 mb-2">Inscriptions plateforme — en attente</h3>
          <p className="text-sm text-gray-600 mb-4">
            Source API :{' '}
            <code className="text-xs bg-white px-1 rounded">GET /api/cooperatives/platform-registrations?status=pending</code>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 text-left">
                  <th className="py-2 pr-3">Coopérative</th>
                  <th className="py-2 pr-3">Pays / région</th>
                  <th className="py-2 pr-3">Responsable</th>
                  <th className="py-2 pr-3">Contact</th>
                  <th className="py-2 pr-3">Membres</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((r) => (
                  <tr key={r._id} className="border-b border-amber-100">
                    <td className="py-3 pr-3 font-medium">{r.cooperativeName}</td>
                    <td className="py-3 pr-3">
                      {r.country} — {r.regionCity}
                    </td>
                    <td className="py-3 pr-3">{r.leaderName}</td>
                    <td className="py-3 pr-3 text-gray-600">
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ''}
                    </td>
                    <td className="py-3 pr-3">{r.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        {filteredCoops.map((coop) => (
          <div key={coop._id} className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-green mb-2">{coop.nom}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Localisation :</span>
                    <p className="font-medium">{coop.localisation}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Responsable :</span>
                    <p className="font-medium">{coop.responsable}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Membres :</span>
                    <p className="font-medium">{coop.membres} agriculteurs</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Statut :</span>
                    <p className="font-medium text-green-600">{coop.statut}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setSelectedCooperative(selectedCooperative === coop._id ? null : coop._id)
                }
                className="mt-4 md:mt-0 btn-secondary"
              >
                {selectedCooperative === coop._id ? 'Masquer' : 'Vérifier outils'}
              </button>
            </div>

            {selectedCooperative === coop._id && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-primary-blue">
                <h4 className="font-bold text-primary-blue mb-4">Checklist des Outils Disponibles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          toolsUpdate[coop._id]?.tracteurs !== undefined
                            ? toolsUpdate[coop._id].tracteurs
                            : (coop.outils?.tracteurs ?? 0) > 0
                        }
                        onChange={(e) => handleToolUpdate(coop._id, 'tracteurs', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>
                        Tracteurs ({coop.outils?.tracteurs ?? 0} disponible
                        {(coop.outils?.tracteurs ?? 0) > 1 ? 's' : ''})
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          toolsUpdate[coop._id]?.sechoirs !== undefined
                            ? toolsUpdate[coop._id].sechoirs
                            : (coop.outils?.sechoirs ?? 0) > 0
                        }
                        onChange={(e) => handleToolUpdate(coop._id, 'sechoirs', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>
                        Séchoirs ({coop.outils?.sechoirs ?? 0} disponible
                        {(coop.outils?.sechoirs ?? 0) > 1 ? 's' : ''})
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          toolsUpdate[coop._id]?.stockage !== undefined
                            ? toolsUpdate[coop._id].stockage
                            : coop.outils?.stockage === 'Oui'
                        }
                        onChange={(e) => handleToolUpdate(coop._id, 'stockage', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Stockage sec/froid</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          toolsUpdate[coop._id]?.irrigationSolaire !== undefined
                            ? toolsUpdate[coop._id].irrigationSolaire
                            : coop.outils?.irrigationSolaire === 'Oui'
                        }
                        onChange={(e) =>
                          handleToolUpdate(coop._id, 'irrigationSolaire', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Irrigation solaire</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          toolsUpdate[coop._id]?.transformation !== undefined
                            ? toolsUpdate[coop._id].transformation
                            : coop.outils?.transformation === 'Oui'
                        }
                        onChange={(e) => handleToolUpdate(coop._id, 'transformation', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Équipement de transformation</span>
                    </label>
                  </div>
                </div>
                <button onClick={() => saveToolsUpdate(coop._id)} className="mt-4 btn-primary">
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CooperativesManagement;
