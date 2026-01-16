import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const TrainingsManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    sujet: '',
    niveau: 'Débutant',
    duree: '',
    format: 'Présentiel',
    region: '',
    sessions: []
  });

  useEffect(() => {
    fetchTrainings();
    fetchMentors();
  }, []);

  const fetchTrainings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.TRAININGS.BASE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTrainings(data.trainings);
      }
    } catch (error) {
      console.error('Erreur récupération formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.TRAININGS.MENTORS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMentors(data.mentors);
      }
    } catch (error) {
      console.error('Erreur récupération mentors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.TRAININGS.SCHEDULE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchTrainings();
        setShowForm(false);
        setFormData({
          titre: '',
          description: '',
          sujet: '',
          niveau: 'Débutant',
          duree: '',
          format: 'Présentiel',
          region: '',
          sessions: []
        });
      }
    } catch (error) {
      console.error('Erreur création formation:', error);
      alert('Erreur lors de la création');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Formations</h2>
          <p className="text-gray-600">{trainings.length} formation(s) planifiée(s)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen"
        >
          + Planifier une Formation
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Nouvelle Formation</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sujet</label>
                <select
                  value={formData.sujet}
                  onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Techniques agricoles">Techniques agricoles</option>
                  <option value="Gestion financière">Gestion financière</option>
                  <option value="Irrigation">Irrigation</option>
                  <option value="Transformation">Transformation</option>
                  <option value="Certification">Certification</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Région</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Kayes">Kayes</option>
                  <option value="Koulikoro">Koulikoro</option>
                  <option value="Sikasso">Sikasso</option>
                  <option value="Ségou">Ségou</option>
                  <option value="Mopti">Mopti</option>
                  <option value="Tombouctou">Tombouctou</option>
                  <option value="Gao">Gao</option>
                  <option value="Kidal">Kidal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Durée (heures)</label>
                <input
                  type="number"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {trainings.map((training) => (
          <div key={training._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{training.titre}</h3>
                <p className="text-gray-600 mb-2">{training.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {training.sujet}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {training.region}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    {training.duree}h
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                    {training.format}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {training.sessions?.length || 0} session(s) planifiée(s)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingsManagement;
