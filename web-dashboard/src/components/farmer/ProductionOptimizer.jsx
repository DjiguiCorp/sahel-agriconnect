import { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ProductionOptimizer = () => {
  const [formData, setFormData] = useState({
    farmerId: '',
    region: '',
    crop: '',
    superficie: '',
    saison: 'Pluvieuse',
    currentPractices: {
      irrigation: '',
      fertilisation: '',
      semis: '',
      autres: ''
    },
    soilConditions: {
      type: '',
      ph: '',
      texture: '',
      autres: ''
    }
  });
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.OPTIMIZE.PRODUCTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          superficie: parseFloat(formData.superficie) || 0,
          soilConditions: {
            ...formData.soilConditions,
            ph: parseFloat(formData.soilConditions.ph) || null
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setOptimization(data.optimization);
      } else {
        alert('Erreur: ' + (data.error || 'Erreur lors de la génération'));
      }
    } catch (error) {
      console.error('Erreur optimisation:', error);
      alert('Erreur lors de la génération des recommandations');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (rating, comments) => {
    if (!optimization) return;

    try {
      const response = await fetch(API_ENDPOINTS.OPTIMIZE.FEEDBACK(optimization._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          comments,
          implemented: [],
          results: ''
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Feedback enregistré avec succès!');
      }
    } catch (error) {
      console.error('Erreur feedback:', error);
    }
  };

  if (optimization) {
    const recommendations = optimization.aiRecommendations?.recommendations || [];
    const forecast = optimization.aiRecommendations?.forecast || {};
    const budget = optimization.aiRecommendations?.budget || {};

    const budgetChartData = {
      labels: budget.breakdown?.map(item => item.item) || [],
      datasets: [{
        data: budget.breakdown?.map(item => item.cost) || [],
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6'
        ]
      }]
    };

    const recommendationsChartData = {
      labels: recommendations.map(r => r.category),
      datasets: [{
        label: 'Priorité',
        data: recommendations.map(r => 
          r.priority === 'Haute' ? 3 : r.priority === 'Moyenne' ? 2 : 1
        ),
        backgroundColor: recommendations.map(r =>
          r.priority === 'Haute' ? '#ef4444' :
          r.priority === 'Moyenne' ? '#f59e0b' : '#10b981'
        )
      }]
    };

    return (
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => setOptimization(null)}
          className="mb-4 text-primary-green hover:underline"
        >
          ← Nouvelle optimisation
        </button>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Recommandations d'Optimisation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Rendement estimé</p>
              <p className="text-2xl font-bold text-green-600">
                {forecast.yieldEstimate?.toFixed(2) || 'N/A'} tonnes
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Confiance</p>
              <p className="text-2xl font-bold text-blue-600">
                {forecast.confidence || 0}%
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Budget total</p>
              <p className="text-2xl font-bold text-orange-600">
                {budget.total?.toLocaleString() || 0} FCFA
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Recommandations</h3>
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="border-l-4 border-primary-green p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold">{rec.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          rec.priority === 'Haute' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'Moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {rec.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{rec.description}</p>
                      <p className="text-sm text-gray-500">
                        Impact estimé: {rec.estimatedImpact}
                      </p>
                      {rec.cost > 0 && (
                        <p className="text-sm font-medium text-primary-green">
                          Coût: {rec.cost.toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-bold mb-2">Répartition du budget</h4>
              <Doughnut data={budgetChartData} />
            </div>
            <div>
              <h4 className="font-bold mb-2">Priorités des recommandations</h4>
              <Bar data={recommendationsChartData} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold mb-2">Facteurs de prévision</h4>
            <ul className="list-disc list-inside text-gray-600">
              {forecast.factors?.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-bold mb-2">Votre avis</h4>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFeedback(rating, '')}
                  className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
                >
                  ⭐ {rating}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-primary-green mb-6">Optimisation de Production avec IA</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Région</label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
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
            <label className="block text-sm font-medium mb-2">Culture</label>
            <input
              type="text"
              value={formData.crop}
              onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Mil, Sorgho, Maïs..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Superficie (hectares)</label>
            <input
              type="number"
              step="0.1"
              value={formData.superficie}
              onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Saison</label>
            <select
              value={formData.saison}
              onChange={(e) => setFormData({ ...formData, saison: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="Sèche">Sèche</option>
              <option value="Pluvieuse">Pluvieuse</option>
              <option value="Hivernale">Hivernale</option>
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Pratiques actuelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Irrigation</label>
              <input
                type="text"
                value={formData.currentPractices.irrigation}
                onChange={(e) => setFormData({
                  ...formData,
                  currentPractices: { ...formData.currentPractices, irrigation: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Décrivez votre système d'irrigation..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fertilisation</label>
              <input
                type="text"
                value={formData.currentPractices.fertilisation}
                onChange={(e) => setFormData({
                  ...formData,
                  currentPractices: { ...formData.currentPractices, fertilisation: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Type d'engrais utilisé..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Semis</label>
              <input
                type="text"
                value={formData.currentPractices.semis}
                onChange={(e) => setFormData({
                  ...formData,
                  currentPractices: { ...formData.currentPractices, semis: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Méthode de semis..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Autres pratiques</label>
              <textarea
                value={formData.currentPractices.autres}
                onChange={(e) => setFormData({
                  ...formData,
                  currentPractices: { ...formData.currentPractices, autres: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="2"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Conditions du sol</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de sol</label>
              <input
                type="text"
                value={formData.soilConditions.type}
                onChange={(e) => setFormData({
                  ...formData,
                  soilConditions: { ...formData.soilConditions, type: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Sableux, Argileux..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">pH</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={formData.soilConditions.ph}
                onChange={(e) => setFormData({
                  ...formData,
                  soilConditions: { ...formData.soilConditions, ph: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Texture</label>
              <input
                type="text"
                value={formData.soilConditions.texture}
                onChange={(e) => setFormData({
                  ...formData,
                  soilConditions: { ...formData.soilConditions, texture: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Autres informations</label>
              <textarea
                value={formData.soilConditions.autres}
                onChange={(e) => setFormData({
                  ...formData,
                  soilConditions: { ...formData.soilConditions, autres: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="2"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen font-medium disabled:opacity-50"
        >
          {loading ? 'Génération en cours...' : 'Générer les recommandations IA'}
        </button>
      </form>
    </div>
  );
};

export default ProductionOptimizer;
