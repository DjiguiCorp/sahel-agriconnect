import { useState } from 'react';

const LandDetection = ({ latitude, longitude, onLandDetected }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState(null);

  // Simulation de détection satellite mockée
  const mockSatelliteDetection = (lat, lon) => {
    // Simulation basée sur des coordonnées typiques du Mali/Burkina Faso
    const detections = [
      { culture: 'Riz', superficie: '2.5 ha', confiance: 0.92 },
      { culture: 'Mil', superficie: '1.8 ha', confiance: 0.88 },
      { culture: 'Sorgho', superficie: '1.2 ha', confiance: 0.85 },
      { culture: 'Maïs', superficie: '0.8 ha', confiance: 0.90 },
      { culture: 'Coton', superficie: '1.5 ha', confiance: 0.87 }
    ];

    // Sélectionner aléatoirement 1-3 cultures détectées
    const numDetections = Math.floor(Math.random() * 3) + 1;
    const selected = detections
      .sort(() => Math.random() - 0.5)
      .slice(0, numDetections);

    return selected;
  };

  const handleDetect = async () => {
    if (!latitude || !longitude) {
      setError('Veuillez d\'abord saisir les coordonnées GPS.');
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError('Coordonnées GPS invalides.');
      return;
    }

    setIsDetecting(true);
    setError(null);
    setDetectionResult(null);

    // Simulation d'un délai d'analyse satellite
    setTimeout(() => {
      try {
        // En production, appeler une vraie API de détection satellite
        // const response = await fetch(`/api/detect-land?lat=${lat}&lon=${lon}`);
        // const data = await response.json();

        // Simulation mockée
        const detections = mockSatelliteDetection(lat, lon);
        const totalArea = detections.reduce((sum, d) => {
          return sum + parseFloat(d.superficie.replace(' ha', ''));
        }, 0);

        const result = {
          latitude: lat,
          longitude: lon,
          detections: detections,
          totalArea: totalArea.toFixed(1),
          dateDetection: new Date().toLocaleDateString('fr-FR')
        };

        setDetectionResult(result);

        // Appeler le callback si fourni
        if (onLandDetected) {
          onLandDetected(result);
        }
      } catch (err) {
        setError('Erreur lors de la détection. Veuillez réessayer.');
      } finally {
        setIsDetecting(false);
      }
    }, 2000);
  };

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-primary-blue mb-1">Détection de Terres via Satellite</h4>
          <p className="text-xs text-gray-600">
            Analyse satellite pour détecter les cultures sur votre terrain
          </p>
        </div>
        <button
          type="button"
          onClick={handleDetect}
          disabled={isDetecting}
          className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
        >
          {isDetecting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse...
            </span>
          ) : (
            '🛰️ Détecter les cultures'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border-l-4 border-red-500 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {detectionResult && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-primary-blue">Cultures Détectées</h5>
            <span className="text-xs text-gray-500">
              {detectionResult.dateDetection}
            </span>
          </div>
          <div className="space-y-2">
            {detectionResult.detections.map((detection, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌾</span>
                  <span className="font-medium text-gray-900">{detection.culture}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-primary-green">{detection.superficie}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(detection.confiance * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Superficie totale détectée :</span>
              <span className="font-bold text-primary-green text-lg">
                {detectionResult.totalArea} ha
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            💡 Ces données sont basées sur une analyse satellite. Vérifiez et ajustez si nécessaire.
          </p>
        </div>
      )}
    </div>
  );
};

export default LandDetection;

