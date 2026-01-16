import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const ProductionOptimizationManagement = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');

  useEffect(() => {
    fetchForecast();
  }, [region]);

  const fetchForecast = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = region
        ? `${API_ENDPOINTS.OPTIMIZE.REGIONAL}?region=${region}`
        : API_ENDPOINTS.OPTIMIZE.REGIONAL;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setForecast(data.forecast);
      }
    } catch (error) {
      console.error('Erreur prévisions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Optimisation de Production</h2>
        <p className="text-gray-600">Prévisions régionales basées sur l'IA</p>
      </div>

      <div className="mb-4">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Toutes les régions</option>
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

      {forecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-2">Optimisations générées</p>
              <p className="text-3xl font-bold text-primary-green">{forecast.totalOptimizations}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-2">Superficie totale</p>
              <p className="text-3xl font-bold text-primary-green">{forecast.totalSuperficie.toFixed(2)} ha</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-2">Rendement estimé total</p>
              <p className="text-3xl font-bold text-primary-green">{forecast.totalYieldEstimate.toFixed(2)} tonnes</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Rendement moyen par hectare</h3>
            <p className="text-3xl font-bold text-primary-green">
              {forecast.averageYield.toFixed(2)} tonnes/ha
            </p>
          </div>

          {forecast.byCrop && Object.keys(forecast.byCrop).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Par culture</h3>
              <div className="space-y-4">
                {Object.entries(forecast.byCrop).map(([crop, data]) => (
                  <div key={crop} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{crop}</h4>
                      <span className="text-sm text-gray-600">
                        {data.count} optimisation(s) - {data.superficie.toFixed(2)} ha
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-gray-600">Rendement estimé</p>
                        <p className="text-lg font-bold">{data.yield.toFixed(2)} tonnes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rendement moyen</p>
                        <p className="text-lg font-bold">
                          {data.superficie > 0 ? (data.yield / data.superficie).toFixed(2) : 0} tonnes/ha
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionOptimizationManagement;
