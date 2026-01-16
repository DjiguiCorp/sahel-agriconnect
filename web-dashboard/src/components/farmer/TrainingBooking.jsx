import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const TrainingBooking = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [formData, setFormData] = useState({
    farmerId: '',
    nom: '',
    telephone: ''
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TRAININGS.BASE);
      const data = await response.json();
      if (data.success) {
        // Filtrer les formations avec sessions disponibles
        const availableTrainings = data.trainings.filter(t => 
          t.statut === 'open' || t.statut === 'planned'
        );
        setTrainings(availableTrainings);
      }
    } catch (error) {
      console.error('Erreur récupération formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (trainingId, sessionId) => {
    if (!formData.nom || !formData.telephone) {
      alert('Veuillez remplir votre nom et téléphone');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.TRAININGS.REGISTER(trainingId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          farmerId: formData.farmerId || null,
          nom: formData.nom,
          telephone: formData.telephone
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Inscription réussie!');
        await fetchTrainings();
        setSelectedTraining(null);
      } else {
        alert('Erreur: ' + (data.error || 'Erreur lors de l\'inscription'));
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      alert('Erreur lors de l\'inscription');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des formations...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-primary-green mb-6">Formations Disponibles</h2>

      {!selectedTraining ? (
        <div className="space-y-4">
          {trainings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Aucune formation disponible pour le moment.</p>
            </div>
          ) : (
            trainings.map((training) => (
              <div key={training._id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{training.titre}</h3>
                    <p className="text-gray-600 mb-4">{training.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
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
                      {training.sessions?.length || 0} session(s) disponible(s)
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTraining(training)}
                    className="ml-4 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen"
                  >
                    Voir les sessions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedTraining(null)}
            className="mb-4 text-primary-green hover:underline"
          >
            ← Retour aux formations
          </button>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-2xl font-bold mb-4">{selectedTraining.titre}</h3>
            <p className="text-gray-600 mb-4">{selectedTraining.description}</p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Vos informations</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold">Sessions disponibles:</h4>
              {selectedTraining.sessions?.map((session) => (
                <div key={session._id} className="border p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {new Date(session.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.heureDebut} - {session.heureFin}
                      </p>
                      {session.lieu && (
                        <p className="text-sm text-gray-600">📍 {session.lieu}</p>
                      )}
                      {session.mentor && (
                        <p className="text-sm text-gray-600">
                          👨‍🏫 Mentor: {session.mentor.nom} - {session.mentor.specialite}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        {session.participants?.length || 0} / {session.capaciteMax} participants
                      </p>
                    </div>
                    <button
                      onClick={() => handleRegister(selectedTraining._id, session._id)}
                      disabled={
                        (session.participants?.length || 0) >= session.capaciteMax ||
                        session.statut !== 'scheduled'
                      }
                      className={`ml-4 px-4 py-2 rounded-lg ${
                        (session.participants?.length || 0) >= session.capaciteMax
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-green text-white hover:bg-primary-lightgreen'
                      }`}
                    >
                      {(session.participants?.length || 0) >= session.capaciteMax
                        ? 'Complet'
                        : 'S\'inscrire'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingBooking;
