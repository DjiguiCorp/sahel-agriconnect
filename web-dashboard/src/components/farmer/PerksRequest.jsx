import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const PerksRequest = () => {
  const [formData, setFormData] = useState({
    farmerId: '',
    cooperativeId: '',
    type: 'equipment',
    description: '',
    details: {},
    paybackOption: 'none'
  });
  const [cooperatives, setCooperatives] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.COOPERATIVES.BASE);
      const data = await response.json();
      if (data.success) {
        setCooperatives(data.cooperatives || []);
      }
    } catch (error) {
      console.error('Erreur récupération coopératives:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ENDPOINTS.PERKS.REQUEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setFormData({
          farmerId: '',
          cooperativeId: '',
          type: 'equipment',
          description: '',
          details: {},
          paybackOption: 'none'
        });
      } else {
        alert('Erreur: ' + (data.error || 'Erreur lors de la soumission'));
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de la soumission');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 rounded-lg">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Demande soumise avec succès!</h2>
        <p className="text-green-700 mb-4">
          Votre demande d'avantage a été soumise. Vous serez notifié une fois qu'elle sera approuvée.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen"
        >
          Faire une autre demande
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-primary-green mb-6">Demander un Avantage Coopératif</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2">Type d'avantage</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value, details: {} })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          >
            <option value="equipment">Équipement</option>
            <option value="fertilizer">Fertilisant</option>
            <option value="insurance">Assurance</option>
            <option value="training">Formation</option>
            <option value="financial">Financement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Coopérative</label>
          <select
            value={formData.cooperativeId}
            onChange={(e) => setFormData({ ...formData, cooperativeId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          >
            <option value="">Sélectionner une coopérative</option>
            {cooperatives.map((coop) => (
              <option key={coop._id} value={coop._id}>{coop.nom} - {coop.region}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description de la demande</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows="4"
            placeholder="Décrivez votre besoin..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Option de remboursement</label>
          <select
            value={formData.paybackOption}
            onChange={(e) => setFormData({ ...formData, paybackOption: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="none">Aucun remboursement</option>
            <option value="cash">Remboursement en espèces</option>
            <option value="crop">Remboursement en récolte</option>
            <option value="service">Remboursement en service</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen font-medium"
        >
          Soumettre la demande
        </button>
      </form>
    </div>
  );
};

export default PerksRequest;
