import { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const IrrigationAssessment = () => {
  const [formData, setFormData] = useState({
    farmerId: '',
    region: '',
    localisation: {
      latitude: '',
      longitude: '',
      adresse: ''
    },
    currentIrrigation: {
      type: 'Aucune',
      superficieIrriguee: '',
      sourceEau: '',
      probleme: ''
    },
    needs: {
      typeIrrigation: '',
      superficieCible: '',
      budgetEstime: '',
      priorite: 'Moyenne',
      urgence: 'Saison prochaine'
    }
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ENDPOINTS.IRRIGATION.ASSESS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          localisation: {
            latitude: parseFloat(formData.localisation.latitude) || 0,
            longitude: parseFloat(formData.localisation.longitude) || 0,
            adresse: formData.localisation.adresse
          },
          currentIrrigation: {
            ...formData.currentIrrigation,
            superficieIrriguee: parseFloat(formData.currentIrrigation.superficieIrriguee) || 0
          },
          needs: {
            ...formData.needs,
            superficieCible: parseFloat(formData.needs.superficieCible) || 0,
            budgetEstime: parseFloat(formData.needs.budgetEstime) || 0
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setFormData({
          farmerId: '',
          region: '',
          localisation: { latitude: '', longitude: '', adresse: '' },
          currentIrrigation: {
            type: 'Aucune',
            superficieIrriguee: '',
            sourceEau: '',
            probleme: ''
          },
          needs: {
            typeIrrigation: '',
            superficieCible: '',
            budgetEstime: '',
            priorite: 'Moyenne',
            urgence: 'Saison prochaine'
          }
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
        <h2 className="text-2xl font-bold text-green-800 mb-4">Évaluation soumise avec succès!</h2>
        <p className="text-green-700 mb-4">
          Votre évaluation d'irrigation a été soumise. Un technicien vous contactera bientôt pour discuter de vos besoins.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen"
        >
          Faire une autre évaluation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-primary-green mb-6">Évaluation des Besoins en Irrigation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <h3 className="text-xl font-bold mb-4">Informations de localisation</h3>
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
              <label className="block text-sm font-medium mb-2">Adresse</label>
              <input
                type="text"
                value={formData.localisation.adresse}
                onChange={(e) => setFormData({
                  ...formData,
                  localisation: { ...formData.localisation, adresse: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Village, Commune..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.localisation.latitude}
                onChange={(e) => setFormData({
                  ...formData,
                  localisation: { ...formData.localisation, latitude: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.localisation.longitude}
                onChange={(e) => setFormData({
                  ...formData,
                  localisation: { ...formData.localisation, longitude: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Irrigation actuelle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type d'irrigation actuelle</label>
              <select
                value={formData.currentIrrigation.type}
                onChange={(e) => setFormData({
                  ...formData,
                  currentIrrigation: { ...formData.currentIrrigation, type: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="Aucune">Aucune</option>
                <option value="Manuelle">Manuelle</option>
                <option value="Gravitaire">Gravitaire</option>
                <option value="Pompe diesel">Pompe diesel</option>
                <option value="Pompe solaire">Pompe solaire</option>
                <option value="Goutte à goutte">Goutte à goutte</option>
                <option value="Aspersion">Aspersion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Superficie irriguée (ha)</label>
              <input
                type="number"
                step="0.1"
                value={formData.currentIrrigation.superficieIrriguee}
                onChange={(e) => setFormData({
                  ...formData,
                  currentIrrigation: { ...formData.currentIrrigation, superficieIrriguee: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Source d'eau</label>
              <select
                value={formData.currentIrrigation.sourceEau}
                onChange={(e) => setFormData({
                  ...formData,
                  currentIrrigation: { ...formData.currentIrrigation, sourceEau: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Sélectionner</option>
                <option value="Puits">Puits</option>
                <option value="Forage">Forage</option>
                <option value="Rivière">Rivière</option>
                <option value="Lac">Lac</option>
                <option value="Barrage">Barrage</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Problèmes rencontrés</label>
              <textarea
                value={formData.currentIrrigation.probleme}
                onChange={(e) => setFormData({
                  ...formData,
                  currentIrrigation: { ...formData.currentIrrigation, probleme: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
                placeholder="Décrivez les problèmes..."
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Besoins en irrigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type d'irrigation souhaité</label>
              <select
                value={formData.needs.typeIrrigation}
                onChange={(e) => setFormData({
                  ...formData,
                  needs: { ...formData.needs, typeIrrigation: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner</option>
                <option value="Pompe solaire">Pompe solaire</option>
                <option value="Goutte à goutte">Goutte à goutte</option>
                <option value="Aspersion">Aspersion</option>
                <option value="Système mixte">Système mixte</option>
                <option value="Amélioration existant">Amélioration existant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Superficie cible (ha)</label>
              <input
                type="number"
                step="0.1"
                value={formData.needs.superficieCible}
                onChange={(e) => setFormData({
                  ...formData,
                  needs: { ...formData.needs, superficieCible: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget estimé (FCFA)</label>
              <input
                type="number"
                value={formData.needs.budgetEstime}
                onChange={(e) => setFormData({
                  ...formData,
                  needs: { ...formData.needs, budgetEstime: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priorité</label>
              <select
                value={formData.needs.priorite}
                onChange={(e) => setFormData({
                  ...formData,
                  needs: { ...formData.needs, priorite: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Haute">Haute</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Basse">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Urgence</label>
              <select
                value={formData.needs.urgence}
                onChange={(e) => setFormData({
                  ...formData,
                  needs: { ...formData.needs, urgence: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Immédiate">Immédiate</option>
                <option value="Saison prochaine">Saison prochaine</option>
                <option value="Long terme">Long terme</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen font-medium"
        >
          Soumettre l'évaluation
        </button>
      </form>
    </div>
  );
};

export default IrrigationAssessment;
