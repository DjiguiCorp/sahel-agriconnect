import { useState } from 'react';

const SoilDiagnostic = () => {
  const [formData, setFormData] = useState({
    typeSol: '',
    pH: '',
    symptomes: []
  });

  const [diagnostic, setDiagnostic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const typesSol = [
    'Argileux',
    'Sableux',
    'Limoneux',
    'Argilo-limoneux',
    'Sablo-argileux',
    'Autre'
  ];

  const symptomes = [
    'Jaunissement des feuilles',
    'Faible rendement',
    'Croissance ralentie',
    'Feuilles qui se fanent',
    'Taches sur les feuilles',
    'Racines peu développées',
    'Sol compacté',
    'Érosion visible',
    'Autre'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSymptomeChange = (symptome) => {
    setFormData(prev => {
      const symptomes = prev.symptomes.includes(symptome)
        ? prev.symptomes.filter(s => s !== symptome)
        : [...prev.symptomes, symptome];
      return { ...prev, symptomes };
    });
  };

  // Simulation IA mockée
  const generateDiagnostic = () => {
    setIsLoading(true);
    
    // Simulation d'un délai de traitement IA
    setTimeout(() => {
      const { typeSol, pH, symptomes } = formData;
      const pHValue = parseFloat(pH);
      
      let problemes = [];
      let solutions = [];
      let recommandations = [];

      // Analyse basée sur le type de sol
      if (typeSol === 'Argileux') {
        if (pHValue < 6) {
          problemes.push('Sol argileux avec pH bas (acide)');
          solutions.push('Apport de chaux agricole (2-3 tonnes/ha)');
          solutions.push('Amendement organique (compost, fumier)');
        } else if (pHValue > 7.5) {
          problemes.push('Sol argileux avec pH élevé (alcalin)');
          solutions.push('Apport de matière organique acide');
          solutions.push('Utilisation de soufre élémentaire si nécessaire');
        } else {
          problemes.push('Sol argileux avec pH acceptable');
          solutions.push('Maintien de la matière organique');
        }
        solutions.push('Drainage amélioré pour éviter la compaction');
      } else if (typeSol === 'Sableux') {
        problemes.push('Sol sableux avec faible rétention d\'eau et de nutriments');
        solutions.push('Apport régulier de matière organique (compost, fumier)');
        solutions.push('Irrigation fréquente mais modérée');
        solutions.push('Fertilisation fractionnée');
        solutions.push('Paillage pour réduire l\'évaporation');
      } else if (typeSol === 'Limoneux') {
        problemes.push('Sol limoneux généralement fertile');
        solutions.push('Maintien de la matière organique');
        solutions.push('Rotation des cultures');
      }

      // Analyse basée sur les symptômes
      if (symptomes.includes('Jaunissement des feuilles')) {
        problemes.push('Carence en azote ou en fer possible');
        solutions.push('Apport d\'engrais azoté (urée, NPK)');
        solutions.push('Vérification de la disponibilité du fer');
      }
      if (symptomes.includes('Faible rendement')) {
        problemes.push('Déficience en nutriments ou conditions de sol défavorables');
        solutions.push('Analyse de sol complète recommandée');
        solutions.push('Fertilisation équilibrée (NPK)');
      }
      if (symptomes.includes('Croissance ralentie')) {
        problemes.push('Manque de nutriments essentiels');
        solutions.push('Apport d\'engrais complet (NPK 15-15-15)');
        solutions.push('Amélioration de la structure du sol');
      }
      if (symptomes.includes('Sol compacté')) {
        problemes.push('Compaction du sol limitant la croissance des racines');
        solutions.push('Labour profond ou sous-solage');
        solutions.push('Apport de matière organique');
        solutions.push('Rotation avec cultures à racines profondes');
      }

      // Recommandations générales
      recommandations.push('Effectuer une analyse de sol complète tous les 2-3 ans');
      recommandations.push('Maintenir un taux de matière organique > 2%');
      recommandations.push('Pratiquer la rotation des cultures');
      recommandations.push('Utiliser des engrais verts (légumineuses)');
      recommandations.push('Adapter l\'irrigation au type de sol');

      setDiagnostic({
        problemes,
        solutions,
        recommandations
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.typeSol || !formData.pH || formData.symptomes.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setDiagnostic(null);
    generateDiagnostic();
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-green to-primary-lightgreen text-white py-12">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Diagnostic du Sol</h1>
          <p className="text-lg text-gray-100 max-w-2xl mx-auto">
            Analysez les problèmes de votre sol et obtenez des recommandations personnalisées
          </p>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Formulaire */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-primary-green mb-6">
              Informations sur le Sol
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type de sol */}
              <div>
                <label htmlFor="typeSol" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de sol <span className="text-red-500">*</span>
                </label>
                <select
                  id="typeSol"
                  name="typeSol"
                  value={formData.typeSol}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                >
                  <option value="">Sélectionnez un type de sol</option>
                  {typesSol.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* pH */}
              <div>
                <label htmlFor="pH" className="block text-sm font-medium text-gray-700 mb-2">
                  pH estimé du sol <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="pH"
                  name="pH"
                  value={formData.pH}
                  onChange={handleChange}
                  min="4"
                  max="9"
                  step="0.1"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="Ex: 6.5 (entre 4 et 9)"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 pH neutre = 7.0 | Acide &lt; 7.0 | Alcalin &gt; 7.0
                </p>
              </div>

              {/* Symptômes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptômes observés <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {symptomes.map((symptome) => (
                    <label
                      key={symptome}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.symptomes.includes(symptome)
                          ? 'bg-primary-green text-white border-primary-green'
                          : 'bg-white border-gray-300 hover:border-primary-orange'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.symptomes.includes(symptome)}
                        onChange={() => handleSymptomeChange(symptome)}
                        className="sr-only"
                      />
                      <span className="text-sm">{symptome}</span>
                    </label>
                  ))}
                </div>
                {formData.symptomes.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Symptômes sélectionnés : <strong>{formData.symptomes.join(', ')}</strong>
                  </p>
                )}
              </div>

              {/* Bouton de soumission */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyse en cours...
                    </span>
                  ) : (
                    'Analyser le sol avec IA'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Résultats du diagnostic */}
          {diagnostic && (
            <div className="space-y-6">
              {/* Problèmes identifiés */}
              <div className="card bg-red-50 border-l-4 border-red-500">
                <h3 className="text-xl font-bold text-red-800 mb-4">
                  🔍 Problèmes Identifiés
                </h3>
                <ul className="space-y-2">
                  {diagnostic.problemes.map((probleme, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span className="text-red-700">{probleme}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions recommandées */}
              <div className="card bg-green-50 border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-green-800 mb-4">
                  💡 Solutions Recommandées
                </h3>
                <ul className="space-y-2">
                  {diagnostic.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-green-700">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommandations générales */}
              <div className="card bg-blue-50 border-l-4 border-primary-blue">
                <h3 className="text-xl font-bold text-primary-blue mb-4">
                  📋 Recommandations Générales
                </h3>
                <ul className="space-y-2">
                  {diagnostic.recommandations.map((reco, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-blue mr-2">→</span>
                      <span className="text-gray-700">{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note */}
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Note importante :</strong> Ce diagnostic est basé sur les informations 
                  fournies. Pour une analyse précise, il est recommandé de faire effectuer une 
                  analyse de sol en laboratoire par un agronome certifié.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SoilDiagnostic;

