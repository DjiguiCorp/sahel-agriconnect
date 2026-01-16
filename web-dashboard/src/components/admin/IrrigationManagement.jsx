import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const IrrigationManagement = () => {
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted');

  useEffect(() => {
    fetchSurveys();
    fetchStats();
  }, [filter]);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = filter === 'all'
        ? API_ENDPOINTS.IRRIGATION.BASE
        : `${API_ENDPOINTS.IRRIGATION.BASE}?statut=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSurveys(data.surveys);
      }
    } catch (error) {
      console.error('Erreur récupération évaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.IRRIGATION.REGIONAL, {
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

  const handleAssess = async (id, assessment) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.IRRIGATION.ASSESS_REQUEST(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assessment)
      });

      const data = await response.json();
      if (data.success) {
        await fetchSurveys();
        await fetchStats();
      }
    } catch (error) {
      console.error('Erreur évaluation:', error);
      alert('Erreur lors de l\'évaluation');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion de l'Irrigation</h2>
        <p className="text-gray-600">Évaluez et priorisez les besoins en irrigation</p>
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
            <p className="text-sm text-gray-600">En cours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex space-x-2">
        {['all', 'submitted', 'under_review', 'approved', 'in_progress'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f
                ? 'bg-primary-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'submitted' ? 'Soumis' : f === 'under_review' ? 'En révision' : f === 'approved' ? 'Approuvés' : 'En cours'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {surveys.map((survey) => (
          <div key={survey._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">
                  {survey.farmerId?.nom || 'N/A'} - {survey.region}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Irrigation actuelle:</p>
                    <p className="font-medium">{survey.currentIrrigation?.type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Besoin:</p>
                    <p className="font-medium">{survey.needs?.typeIrrigation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priorité:</p>
                    <p className="font-medium">{survey.needs?.priorite || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Urgence:</p>
                    <p className="font-medium">{survey.needs?.urgence || 'N/A'}</p>
                  </div>
                </div>
                {survey.assessment?.faisabilite && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm"><strong>Faisabilité:</strong> {survey.assessment.faisabilite}</p>
                    <p className="text-sm"><strong>Impact estimé:</strong> {survey.assessment.impactEstime}</p>
                    {survey.assessment.notes && (
                      <p className="text-sm mt-2">{survey.assessment.notes}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  survey.statut === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                  survey.statut === 'approved' ? 'bg-green-100 text-green-800' :
                  survey.statut === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {survey.statut}
                </span>
              </div>
            </div>
            {survey.statut === 'submitted' && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleAssess(survey._id, {
                    faisabilite: 'Élevée',
                    impactEstime: 'Très élevé',
                    statut: 'approved'
                  })}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleAssess(survey._id, {
                    faisabilite: 'Moyenne',
                    impactEstime: 'Moyen',
                    statut: 'under_review'
                  })}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  En révision
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IrrigationManagement;
