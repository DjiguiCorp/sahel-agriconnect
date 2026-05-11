import { useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { useTranslation } from 'react-i18next';
import { COUNTRY_LIST } from '../../data/africanRegions';
import { useGeolocation } from '../../hooks/useGeolocation';

const RealTimeFarmers = ({ globalCountryFilter = '' }) => {
  const { farmers, realTimeUpdates, isConnected, clearUpdates } = useWebSocket();
  const { i18n } = useTranslation();
  const { country: detectedCountry, detected } = useGeolocation();
  const [filter, setFilter] = useState('all');
  const [showUpdates, setShowUpdates] = useState(true);
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    if (!globalCountryFilter) return;
    setCountryFilter(globalCountryFilter);
  }, [globalCountryFilter]);

  useEffect(() => {
    if (!detected || !detectedCountry) return;
    if (!COUNTRY_LIST.includes(detectedCountry)) return;
    setCountryFilter((p) => p || detectedCountry);
  }, [detected, detectedCountry]);

  const farmersWithInvestment = farmers.filter(f => f.investissementCooperative === 'oui');
  const farmersByObjective = {
    local: farmers.filter(f => f.objectifsProduction?.includes('Souveraineté alimentaire locale')),
    regional: farmers.filter(f => f.objectifsProduction?.includes('Export régional')),
    international: farmers.filter(f => f.objectifsProduction?.includes('Export international'))
  };

  const challenges = {
    irrigation: farmers.filter(f => f.besoinSolaire === 'oui' || f.accesElectricite === 'non'),
    stockage: farmers.filter(f => f.accesStockage === 'non'),
    energie: farmers.filter(f => f.accesElectricite === 'non' || f.accesElectricite === 'partiel')
  };

  const filteredFarmers = useMemo(() => {
    const byCategory =
      filter === 'all'
        ? farmers
        : filter === 'investment'
          ? farmersWithInvestment
          : filter === 'irrigation'
            ? challenges.irrigation
            : filter === 'stockage'
              ? challenges.stockage
              : filter === 'energie'
                ? challenges.energie
                : farmers;

    if (!countryFilter) return byCategory;
    const cf = countryFilter.toLowerCase();
    return byCategory.filter((f) => {
      const c = String(f.pays || f.country || '').toLowerCase();
      if (c === cf) return true;
      const region = String(f.region || '').toLowerCase();
      return region.includes(cf);
    });
  }, [challenges.energie, challenges.irrigation, challenges.stockage, countryFilter, farmers, farmersWithInvestment, filter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">Agriculteurs en Temps Réel</h2>
          <p className="text-gray-600">
            {farmers.length} agriculteur{farmers.length > 1 ? 's' : ''} enregistré{farmers.length > 1 ? 's' : ''}
            {isConnected ? (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ● Connecté
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⚠ Mode simulation
              </span>
            )}
          </p>
        </div>
        {realTimeUpdates.length > 0 && (
          <button
            onClick={clearUpdates}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Effacer notifications
          </button>
        )}
      </div>

      {/* Notifications temps réel */}
      {showUpdates && realTimeUpdates.length > 0 && (
        <div className="mb-6 space-y-2">
          {realTimeUpdates.slice(-5).reverse().map((update, idx) => (
            <div
              key={idx}
              className="p-4 bg-blue-50 border-l-4 border-primary-blue rounded animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-primary-blue">
                    {update.type === 'farmer_registered' ? '🆕 Nouvel agriculteur' : '🔄 Mise à jour'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {update.data.nom} - {update.data.region}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Tous ({farmers.length})
        </button>
        <button
          onClick={() => setFilter('investment')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'investment' ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Investissement ({farmersWithInvestment.length})
        </button>
        <button
          onClick={() => setFilter('irrigation')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'irrigation' ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Irrigation ({challenges.irrigation.length})
        </button>
        <button
          onClick={() => setFilter('stockage')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'stockage' ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Stockage ({challenges.stockage.length})
        </button>
        <button
          onClick={() => setFilter('energie')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'energie' ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Énergie ({challenges.energie.length})
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600">{i18n.language === 'fr' ? 'Pays :' : 'Country:'}</span>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">{i18n.language === 'fr' ? 'Tous les pays' : 'All countries'}</option>
            {COUNTRY_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des agriculteurs */}
      <div className="grid gap-4">
        {filteredFarmers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Aucun agriculteur trouvé</p>
          </div>
        ) : (
          filteredFarmers.map((farmer) => (
            <div key={farmer.id} className="card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary-green mb-2">{farmer.nom}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Téléphone :</span>
                      <p className="font-medium">{farmer.telephone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Région :</span>
                      <p className="font-medium">{farmer.region}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Superficie :</span>
                      <p className="font-medium">{farmer.superficie}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Cultures :</span>
                      <p className="font-medium">
                        {Array.isArray(farmer.cultures)
                          ? farmer.cultures.join(', ')
                          : farmer.cultures}
                        {farmer.autresCultures && (
                          <span className="ml-1 text-[#B5850A] italic">+ {farmer.autresCultures}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Objectifs de production */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Objectifs :</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {farmer.objectifsProduction?.includes('Souveraineté alimentaire locale') && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Local</span>
                      )}
                      {farmer.objectifsProduction?.includes('Export régional') && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Régional</span>
                      )}
                      {farmer.objectifsProduction?.includes('Export international') && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">International</span>
                      )}
                    </div>
                  </div>

                  {/* Défis */}
                  <div className="flex flex-wrap gap-2">
                    {farmer.besoinSolaire === 'oui' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">⚠️ Irrigation solaire</span>
                    )}
                    {farmer.accesStockage === 'non' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚠️ Stockage</span>
                    )}
                    {farmer.accesElectricite === 'non' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚠️ Énergie</span>
                    )}
                    {farmer.investissementCooperative === 'oui' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">💰 Investissement</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RealTimeFarmers;

