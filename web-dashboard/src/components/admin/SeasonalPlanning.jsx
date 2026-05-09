import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const SeasonalPlanning = () => {
  const [selectedSeason, setSelectedSeason] = useState('rainy');
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const url = `${base}/api/farmers?limit=50`;

      const deriveSeason = (country) => {
        const c = String(country || '').trim();
        return ['Mali', 'Burkina Faso', 'Niger'].includes(c) ? 'rainy' : 'dry';
      };

      const mapFarmer = (farmer) => ({
        id: farmer._id || farmer.id,
        nom: farmer.nom,
        region: `${farmer.region}, ${farmer.country}`,
        saison: deriveSeason(farmer.country),
        cultures: Array.isArray(farmer.cultures) ? farmer.cultures : [],
        superficie: `${farmer.superficie} ha`,
        besoins: { intrants: '—', fertilisants: '—', pesticides: '—' },
        sol: { type: '—', pH: '—', sante: '—' },
      });

      try {
        const publicRes = await fetch(url);
        if (!cancelled && publicRes.ok) {
          const json = await publicRes.json().catch(() => null);
          const list = json?.farmers || json || [];
          setFarmers(Array.isArray(list) ? list.map(mapFarmer) : []);
        } else if (!cancelled && (publicRes.status === 401 || publicRes.status === 403)) {
          const token = localStorage.getItem('adminToken');
          const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
          const res2 = await fetch(url, { headers });
          if (!res2.ok) throw new Error('Auth required');
          const json2 = await res2.json().catch(() => null);
          const list2 = json2?.farmers || json2 || [];
          setFarmers(Array.isArray(list2) ? list2.map(mapFarmer) : []);
        } else if (!cancelled) {
          setLoadError(true);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getSoilRecommendations = (farmer) => {
    const recommendations = [];
    
    if (farmer.sol.sante === 'Faible' || farmer.sol.pH < 6) {
      recommendations.push('Apport urgent de compost de fèces de bétail (5-10 tonnes/ha)');
      recommendations.push('Correction du pH avec chaux agricole si nécessaire');
    }
    
    if (farmer.sol.type === 'Sableux') {
      recommendations.push('Apport régulier de matière organique pour améliorer la rétention d\'eau');
    }
    
    recommendations.push('Rotation des cultures recommandée (légumineuses après céréales)');
    recommendations.push('Utilisation d\'engrais verts pour améliorer la fertilité');
    
    return recommendations;
  };

  const filteredFarmers = farmers.filter(f => f.saison === selectedSeason);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Planification Saisonnière</h2>
        <p className="text-gray-600">Gestion des agriculteurs par saison de culture</p>
      </div>

      {/* Sélection de saison */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setSelectedSeason('rainy')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedSeason === 'rainy'
              ? 'bg-primary-blue text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🌧️ Saison des Pluies
        </button>
        <button
          onClick={() => setSelectedSeason('dry')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedSeason === 'dry'
              ? 'bg-primary-orange text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ☀️ Hors Saison
        </button>
      </div>

      {loading ? (
        <div className="card mb-6 flex items-center justify-center gap-3 py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary-green" aria-hidden />
          <span className="text-sm text-gray-600">Chargement…</span>
        </div>
      ) : null}

      {!loading && loadError ? (
        <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          Erreur de chargement — vérifiez la connexion au serveur
        </div>
      ) : null}

      {/* Liste des agriculteurs */}
      <div className="space-y-6">
        {filteredFarmers.map((farmer) => {
          const recommendations = getSoilRecommendations(farmer);
          
          return (
            <div key={farmer.id} className="card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary-green mb-2">{farmer.nom}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Région :</span>
                      <p className="font-medium">{farmer.region}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Superficie :</span>
                      <p className="font-medium">{farmer.superficie}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Cultures prévues :</span>
                      <p className="font-medium">{farmer.cultures.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Besoins en intrants */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-primary-blue mb-3">📋 Besoins en Intrants</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Intrants :</span>
                    <p className="text-gray-700">{farmer.besoins.intrants}</p>
                  </div>
                  <div>
                    <span className="font-medium">Fertilisants :</span>
                    <p className="text-gray-700">{farmer.besoins.fertilisants}</p>
                  </div>
                  <div>
                    <span className="font-medium">Pesticides :</span>
                    <p className="text-gray-700">{farmer.besoins.pesticides}</p>
                  </div>
                </div>
              </div>

              {/* Rapport Santé des Sols */}
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-800 mb-3">🌱 Rapport : Santé des Sols et Nutriments</h4>
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type de sol :</span>
                    <p className="font-medium">{farmer.sol.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">pH :</span>
                    <p className="font-medium">{farmer.sol.pH}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Santé :</span>
                    <p className={`font-medium ${
                      farmer.sol.sante === 'Bonne' ? 'text-green-600' :
                      farmer.sol.sante === 'Moyenne' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {farmer.sol.sante}
                    </p>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-green-800 mb-2">Recommandations Automatiques :</h5>
                  <ul className="space-y-1">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-green-600 mr-2">→</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonalPlanning;

