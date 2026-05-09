import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const InputsManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stock, setStock] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const [perksRes, statsRes] = await Promise.allSettled([
        fetch(`${base}/api/perks`, { headers }),
        fetch(`${base}/api/perks/stats/usage`, { headers }),
      ]);

      if (cancelled) return;

      let anyFail = false;
      let perks = [];

      if (perksRes.status === 'fulfilled' && perksRes.value.ok) {
        const json = await perksRes.value.json().catch(() => null);
        perks = json?.perks || json?.items || json || [];
        if (!Array.isArray(perks)) perks = [];
      } else {
        anyFail = true;
      }

      if (!(statsRes.status === 'fulfilled' && statsRes.value.ok)) {
        anyFail = true;
      }

      const mappedStock = perks.map((perk) => ({
        id: perk._id,
        type: perk.type,
        nom: perk.name || perk.description,
        quantite: perk.quantity || '—',
        unite: perk.unit || 'unité',
        localisation: perk.location || 'Non spécifié',
        dateReception: perk.createdAt,
        dateExpiration: '—',
      }));

      const mappedDistributions = perks
        .filter((perk) => perk.status === 'fulfilled' || perk.status === 'pending')
        .map((perk) => ({
          id: perk._id,
          cooperative: perk.cooperativeName || '—',
          agriculteur: perk.farmerName || '—',
          intrant: perk.name || perk.type,
          quantite: perk.quantity || '—',
          date: perk.fulfilledAt || perk.updatedAt,
          statut: perk.status === 'fulfilled' ? 'Distribué' : 'En attente',
        }));

      setStock(mappedStock);
      setDistributions(mappedDistributions);
      setLoadError(anyFail);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = ['all', 'Engrais', 'Pesticide', 'Semence', 'Fertilisant'];
  const filteredStock = selectedCategory === 'all' 
    ? stock 
    : stock.filter(item => item.type === selectedCategory);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Intrants et Fertilisants</h2>
        <p className="text-gray-600">Stock central et distribution aux coopératives et agriculteurs</p>
      </div>

      <div
        className="rounded-lg p-4 mb-6"
        style={{ background: '#fff9e6', border: '1px solid #B5850A' }}
      >
        <p className="text-sm font-medium text-[#1a3c2e]">
          Les intrants affichés correspondent aux demandes de avantages coopératifs. Le module de gestion de stock complet arrive en Phase 2.
        </p>
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

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-green text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat === 'all' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      {/* Stock Central */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📦 Stock Central</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantité</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Localisation</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date Réception</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiration</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{item.nom}</td>
                  <td className="py-4 px-4 font-semibold text-primary-green">{item.quantite}</td>
                  <td className="py-4 px-4 text-gray-600">{item.localisation}</td>
                  <td className="py-4 px-4 text-gray-600">{item.dateReception}</td>
                  <td className="py-4 px-4 text-gray-600">{item.dateExpiration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">🚚 Distribution</h3>
        <div className="space-y-4">
          {distributions.map((dist) => (
            <div key={dist.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Coopérative :</span>
                  <p className="font-medium">{dist.cooperative}</p>
                </div>
                <div>
                  <span className="text-gray-600">Agriculteur :</span>
                  <p className="font-medium">{dist.agriculteur}</p>
                </div>
                <div>
                  <span className="text-gray-600">Intrant :</span>
                  <p className="font-medium">{dist.intrant}</p>
                  <p className="text-primary-green font-semibold">{dist.quantite}</p>
                </div>
                <div>
                  <span className="text-gray-600">Statut :</span>
                  <p className={`font-medium ${
                    dist.statut === 'Distribué' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {dist.statut}
                  </p>
                  <p className="text-xs text-gray-500">{dist.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandations */}
      <div className="card bg-gradient-to-br from-green-50 to-blue-50">
        <h3 className="text-2xl font-bold text-primary-green mb-4">💡 Recommandations Automatiques</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-primary-green mb-2">🌱 Basées sur Type de Sol</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Sol argileux : Compost de fèces (5-10 t/ha)</li>
              <li>• Sol sableux : Matière organique régulière</li>
              <li>• pH bas : Chaux agricole + compost</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-primary-green mb-2">🌾 Basées sur Culture</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Riz : NPK + compost organique</li>
              <li>• Céréales : Engrais azoté + rotation</li>
              <li>• Légumineuses : Moins d'azote nécessaire</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-primary-green mb-2">🐄 Basées sur Élevage</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Fèces de vaches : Compost riche en azote</li>
              <li>• Fèces de poulets : Compost + biogaz</li>
              <li>• Transformation : Fertilisation + énergie</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputsManagement;

