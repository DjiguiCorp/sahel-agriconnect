import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const PerksManagement = () => {
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPerks();
    fetchStats();
  }, [filter]);

  const fetchPerks = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = filter === 'all' 
        ? API_ENDPOINTS.PERKS.BASE
        : `${API_ENDPOINTS.PERKS.BASE}?statut=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPerks(data.perks);
      }
    } catch (error) {
      console.error('Erreur récupération avantages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.PERKS.STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur statistiques:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.PERKS.APPROVE(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchPerks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.PERKS.REJECT(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchPerks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet');
    }
  };

  const handleFulfill = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.PERKS.FULFILL(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchPerks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Erreur remplissage:', error);
      alert('Erreur');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Avantages Coopératifs</h2>
        <p className="text-gray-600">Approuvez et gérez les demandes d'avantages</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Approuvés</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Remplis</p>
            <p className="text-2xl font-bold text-blue-600">{stats.fulfilled}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex space-x-2">
        {['all', 'pending', 'approved', 'fulfilled', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f
                ? 'bg-primary-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvés' : f === 'fulfilled' ? 'Remplis' : 'Rejetés'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {perks.map((perk) => (
          <div key={perk._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h3 className="text-lg font-bold">{perk.description}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    perk.statut === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    perk.statut === 'approved' ? 'bg-green-100 text-green-800' :
                    perk.statut === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {perk.statut === 'pending' ? 'En attente' :
                     perk.statut === 'approved' ? 'Approuvé' :
                     perk.statut === 'fulfilled' ? 'Rempli' : 'Rejeté'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {perk.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Agriculteur: {perk.farmerId?.nom || 'N/A'} - {perk.farmerId?.telephone || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Coopérative: {perk.cooperativeId?.nom || 'N/A'}
                </p>
                {perk.paybackOption !== 'none' && (
                  <p className="text-sm text-gray-600">
                    Remboursement: {perk.paybackOption}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {perk.statut === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(perk._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(perk._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Rejeter
                    </button>
                  </>
                )}
                {perk.statut === 'approved' && (
                  <button
                    onClick={() => handleFulfill(perk._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Marquer comme rempli
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerksManagement;
