import { useState } from 'react';

const CooperativeFinanceForm = ({ cooperativeId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    equipements: [],
    capaciteTransformation: '',
    certification: '',
    message: '',
    montantEstime: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const financeTypes = [
    { value: 'equipment', label: 'Équipement (tracteurs, séchoirs, irrigation)' },
    { value: 'diaspora', label: 'Partenariat diaspora' },
    { value: 'expansion', label: 'Expansion transformation' }
  ];

  const equipements = [
    'Tracteurs',
    'Séchoirs solaires',
    'Systèmes d\'irrigation',
    'Équipements de transformation',
    'Stockage sec/froid',
    'Équipements de certification'
  ];

  const certifications = [
    'Local',
    'Régional (Afrique)',
    'International (FDA/USDA)'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCheckboxChange = (equipement) => {
    setFormData(prev => ({
      ...prev,
      equipements: prev.equipements.includes(equipement)
        ? prev.equipements.filter(e => e !== equipement)
        : [...prev.equipements, equipement]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Sélectionnez un type de financement';
    if (formData.equipements.length === 0 && formData.type === 'equipment') {
      newErrors.equipements = 'Sélectionnez au moins un équipement';
    }
    if (!formData.capaciteTransformation && formData.type === 'expansion') {
      newErrors.capaciteTransformation = 'Indiquez la capacité de transformation souhaitée';
    }
    if (!formData.certification && formData.type === 'expansion') {
      newErrors.certification = 'Sélectionnez le niveau de certification';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit({
        ...formData,
        cooperativeId,
        date: new Date().toISOString(),
        statut: 'En attente'
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary-green">
              Demande de Financement
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-primary-blue rounded">
            <p className="text-sm text-gray-700">
              <strong>💡 Financement sans prêt :</strong> Tous les financements sont réalisés via la diaspora et les ressources locales, sans prêt bancaire. Utilisation des ressources locales, formation gratuite, équipement partagé via coopératives.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de financement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de financement <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez un type</option>
                {financeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* Équipements (si type = equipment) */}
            {formData.type === 'equipment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipements nécessaires <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {equipements.map(equipement => (
                    <label key={equipement} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.equipements.includes(equipement)}
                        onChange={() => handleCheckboxChange(equipement)}
                        className="w-4 h-4 text-primary-orange rounded focus:ring-primary-orange"
                      />
                      <span className="text-sm text-gray-700">{equipement}</span>
                    </label>
                  ))}
                </div>
                {errors.equipements && (
                  <p className="mt-1 text-sm text-red-600">{errors.equipements}</p>
                )}
              </div>
            )}

            {/* Capacité de transformation (si type = expansion) */}
            {formData.type === 'expansion' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité de transformation souhaitée (tonnes/mois) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capaciteTransformation"
                  value={formData.capaciteTransformation}
                  onChange={handleChange}
                  placeholder="Ex: 50"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                    errors.capaciteTransformation ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.capaciteTransformation && (
                  <p className="mt-1 text-sm text-red-600">{errors.capaciteTransformation}</p>
                )}
              </div>
            )}

            {/* Certification (si type = expansion) */}
            {formData.type === 'expansion' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification souhaitée <span className="text-red-500">*</span>
                </label>
                <select
                  name="certification"
                  value={formData.certification}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                    errors.certification ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez un niveau</option>
                  {certifications.map(cert => (
                    <option key={cert} value={cert}>{cert}</option>
                  ))}
                </select>
                {errors.certification && (
                  <p className="mt-1 text-sm text-red-600">{errors.certification}</p>
                )}
              </div>
            )}

            {/* Montant estimé */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant estimé (USD) <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                type="number"
                name="montantEstime"
                value={formData.montantEstime}
                onChange={handleChange}
                placeholder="Ex: 50000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message complémentaire
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Décrivez vos besoins et objectifs..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              />
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-primary-darkgreen transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CooperativeFinanceForm;

