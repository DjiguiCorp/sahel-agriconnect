import { useEffect, useState } from 'react';

const statTotalForLevel = (stats, levelId) => {
  if (stats == null) return null;
  if (Array.isArray(stats)) {
    const row = stats.find((s) => s._id === levelId);
    return row != null ? row.total : null;
  }
  if (typeof stats === 'object' && levelId in stats) return stats[levelId];
  return null;
};

const CertificationManagement = () => {
  const [selectedLevel, setSelectedLevel] = useState('all');

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`${base}/api/certifications`, { headers }).then((r) => r.json()),
      fetch(`${base}/api/certifications/stats/by-level`, { headers }).then((r) => r.json()),
    ])
      .then(([certResult, statsResult]) => {
        if (certResult.status === 'fulfilled') {
          setProducts(certResult.value.certifications || certResult.value || []);
        }
        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value.stats || statsResult.value || null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur de chargement — vérifiez la connexion au serveur');
        setLoading(false);
      });
  }, []);

  const levels = [
    { id: 'all', label: 'Tous les niveaux', icon: '⭐', count: products.length },
    {
      id: 'local',
      label: 'Local',
      icon: '⭐',
      color: 'green',
      count: statTotalForLevel(stats, 'local') ?? products.filter((p) => p.niveau === 'local').length,
    },
    {
      id: 'regional',
      label: 'Régional (CEDEAO)',
      icon: '⭐⭐',
      color: 'orange',
      count:
        statTotalForLevel(stats, 'regional') ??
        products.filter((p) => p.niveau === 'regional').length,
    },
    {
      id: 'international',
      label: 'International (UE/USDA)',
      icon: '⭐⭐⭐',
      color: 'blue',
      count:
        statTotalForLevel(stats, 'international') ??
        products.filter((p) => p.niveau === 'international').length,
    },
  ];

  const filteredProducts =
    selectedLevel === 'all' ? products : products.filter((p) => p.niveau === selectedLevel);

  const getStatusColor = (statut) => {
    if (statut === 'Conforme') return 'text-green-600 bg-green-100';
    if (statut === 'En inspection') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Certification et 3 Branches</h2>
        <p className="text-gray-600">Gestion des certifications selon 3 niveaux de qualité</p>
      </div>

      {/* Filtres par niveau */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => setSelectedLevel(level.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedLevel === level.id
                ? `border-primary-${level.color || 'green'} bg-primary-${level.color || 'green'}/10`
                : 'border-gray-300 hover:border-primary-orange'
            }`}
          >
            <div className="text-2xl mb-2">{level.icon}</div>
            <div className="font-medium text-gray-900">
              {level.label} ({level.count})
            </div>
          </button>
        ))}
      </div>

      {/* Liste des produits */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📋 Produits à Certifier</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Producteur</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Produit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantité</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Niveau</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date Inspection</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Conformité</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id || product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{product.producteur}</td>
                  <td className="py-4 px-4 text-gray-700">{product.produit}</td>
                  <td className="py-4 px-4 font-semibold text-primary-green">{product.quantite}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        product.niveau === 'local'
                          ? 'bg-green-100 text-green-800'
                          : product.niveau === 'regional'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {product.niveau === 'local'
                        ? '⭐ Local'
                        : product.niveau === 'regional'
                          ? '⭐⭐ Régional'
                          : '⭐⭐⭐ International'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.statut)}`}
                    >
                      {product.statut}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{product.dateInspection}</td>
                  <td className="py-4 px-4 text-gray-600">{product.conformite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 Branches de Certification */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">🌍 Les 3 Branches de Certification</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Branche Locale */}
          <div className="p-6 bg-green-50 rounded-lg border-2 border-green-500">
            <div className="text-3xl mb-3">⭐</div>
            <h4 className="text-xl font-bold text-green-800 mb-3">Branche Locale</h4>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Marché :</strong> National (Afrique de l&apos;Ouest et au-delà)
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-green-800">Objectifs :</strong>
                <ul className="list-disc list-inside text-gray-700 mt-1">
                  <li>Sécurité alimentaire locale</li>
                  <li>Normes basiques de qualité</li>
                  <li>Accès marché national</li>
                </ul>
              </div>
              <div>
                <strong className="text-green-800">Suivi Certification :</strong>
                <p className="text-gray-700 mt-1">Inspection mensuelle, contrôle qualité basique</p>
              </div>
              <div>
                <strong className="text-green-800">Accès Marchés :</strong>
                <p className="text-gray-700 mt-1">Marchés locaux, coopératives, vente directe</p>
              </div>
              <div>
                <strong className="text-green-800">Logistique :</strong>
                <p className="text-gray-700 mt-1">Transport local, stockage communautaire</p>
              </div>
              <div>
                <strong className="text-green-800">Partenariats :</strong>
                <p className="text-gray-700 mt-1">Coopératives locales, transformateurs régionaux</p>
              </div>
            </div>
          </div>

          {/* Branche Régionale */}
          <div className="p-6 bg-orange-50 rounded-lg border-2 border-primary-orange">
            <div className="text-3xl mb-3">⭐⭐</div>
            <h4 className="text-xl font-bold text-orange-800 mb-3">Branche Régionale (CEDEAO)</h4>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Marché :</strong> Afrique de l'Ouest (CEDEAO/ECOWAS)
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-orange-800">Objectifs :</strong>
                <ul className="list-disc list-inside text-gray-700 mt-1">
                  <li>Qualité intermédiaire certifiée</li>
                  <li>Emballage conforme</li>
                  <li>Logistique intra-africaine</li>
                </ul>
              </div>
              <div>
                <strong className="text-orange-800">Suivi Certification :</strong>
                <p className="text-gray-700 mt-1">Inspection trimestrielle, certification CEDEAO</p>
              </div>
              <div>
                <strong className="text-orange-800">Accès Marchés :</strong>
                <p className="text-gray-700 mt-1">Marchés régionaux, export Afrique, hubs commerciaux</p>
              </div>
              <div>
                <strong className="text-orange-800">Logistique :</strong>
                <p className="text-gray-700 mt-1">Transport régional, ports (Dakar, Abidjan), chaîne du froid</p>
              </div>
              <div>
                <strong className="text-orange-800">Partenariats :</strong>
                <p className="text-gray-700 mt-1">Processeurs certifiés, exportateurs régionaux, hubs logistiques</p>
              </div>
              <div>
                <strong className="text-orange-800">Business Development :</strong>
                <p className="text-gray-700 mt-1">Accords commerciaux CEDEAO, foires régionales, réseaux d'export</p>
              </div>
            </div>
          </div>

          {/* Branche Internationale */}
          <div className="p-6 bg-blue-50 rounded-lg border-2 border-primary-blue">
            <div className="text-3xl mb-3">⭐⭐⭐</div>
            <h4 className="text-xl font-bold text-blue-800 mb-3">Branche Internationale (UE/USDA)</h4>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Marché :</strong> Europe, USA, Marchés internationaux
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-blue-800">Objectifs :</strong>
                <ul className="list-disc list-inside text-gray-700 mt-1">
                  <li>Certification bio (UE/USDA)</li>
                  <li>Fair Trade</li>
                  <li>Traçabilité complète</li>
                  <li>Export haute qualité</li>
                </ul>
              </div>
              <div>
                <strong className="text-blue-800">Suivi Certification :</strong>
                <p className="text-gray-700 mt-1">Inspection saisonnière, audits UE/USDA, certification bio</p>
              </div>
              <div>
                <strong className="text-blue-800">Accès Marchés :</strong>
                <p className="text-gray-700 mt-1">Europe, USA, marchés premium, commerce équitable</p>
              </div>
              <div>
                <strong className="text-blue-800">Logistique :</strong>
                <p className="text-gray-700 mt-1">Transport maritime/aérien, ports internationaux, chaîne du froid certifiée</p>
              </div>
              <div>
                <strong className="text-blue-800">Partenariats :</strong>
                <p className="text-gray-700 mt-1">Importateurs certifiés, distributeurs bio, labels Fair Trade</p>
              </div>
              <div>
                <strong className="text-blue-800">Business Development :</strong>
                <p className="text-gray-700 mt-1">Salons internationaux, réseaux commerce équitable, certifications premium</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier des inspections */}
      <div className="card">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📅 Calendrier des Inspections Saisonnières</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-primary-blue">
            <h4 className="font-bold text-primary-blue mb-2">Mensuelles</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Inspection qualité locale : 1er de chaque mois</li>
              <li>• Vérification stockage : 15 de chaque mois</li>
              <li>• Contrôle traçabilité : 25 de chaque mois</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-primary-orange">
            <h4 className="font-bold text-primary-orange mb-2">Trimestrielles</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Certification régionale CEDEAO : Début de trimestre</li>
              <li>• Audit coopératives : Milieu de trimestre</li>
              <li>• Évaluation sols : Fin de trimestre</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-green-800 mb-2">Saisonnières</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Certification internationale : Avant récolte</li>
              <li>• Inspection post-récolte : Après récolte</li>
              <li>• Planification saison suivante : Entre saisons</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationManagement;
