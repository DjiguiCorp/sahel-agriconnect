import { useState } from 'react';

const PartnershipsManagement = () => {
  const [partners] = useState([
    {
      id: 1,
      nom: 'AES',
      type: 'Partenaire Technique et Financier',
      contact: 'contact@aes.org',
      mou: 'Signé - 2024-01-15',
      equipements: [
        'Systèmes d\'irrigation solaire',
        'Équipements de transformation',
        'Formation technique'
      ],
      transfertTechnologie: 'Oui - Programmes de formation en cours'
    },
    {
      id: 2,
      nom: 'Djigui',
      type: 'Organisation Locale',
      contact: 'contact@djigui.org',
      mou: 'Signé - 2023-12-10',
      equipements: [
        'Matériel agricole partagé',
        'Centres de collecte',
        'Support logistique'
      ],
      transfertTechnologie: 'Oui - Transfert de connaissances locales'
    },
    {
      id: 3,
      nom: 'Universités US (Pennsylvanie/Delaware)',
      type: 'Partenaires Académiques',
      contact: 'research@university.edu',
      mou: 'Signé - 2024-02-01',
      equipements: [
        'Recherche et développement',
        'Formation académique',
        'Innovation technologique'
      ],
      transfertTechnologie: 'Oui - Projets de recherche collaboratifs'
    }
  ]);

  const [factories] = useState([
    {
      id: 1,
      nom: 'Usine de Transformation de Karité - Sikasso',
      localisation: 'Sikasso, Mali',
      capacite: '20 tonnes/mois',
      produits: ['Beurre de karité', 'Huile de karité', 'Savon'],
      statut: 'Opérationnelle',
      partenaires: ['AES', 'Djigui']
    },
    {
      id: 2,
      nom: 'Unité de Transformation de Sésame - Bobo',
      localisation: 'Bobo-Dioulasso, Burkina Faso',
      capacite: '15 tonnes/mois',
      produits: ['Huile de sésame', 'Tahini'],
      statut: 'Opérationnelle',
      partenaires: ['AES']
    },
    {
      id: 3,
      nom: 'Centre de Transformation Multi-Produits',
      localisation: 'Ouagadougou, Burkina Faso',
      capacite: '50 tonnes/mois',
      produits: ['Tous produits transformés'],
      statut: 'En construction',
      partenaires: ['AES', 'Universités US']
    }
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Partenariats et Usines</h2>
        <p className="text-gray-600">Gestion des partenaires et usines de transformation</p>
      </div>

      {/* Partenaires */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">🤝 Partenaires</h3>
        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-orange transition-colors">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-primary-green mb-2">{partner.nom}</h4>
                  <p className="text-gray-600 mb-2">{partner.type}</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Contact :</span> {partner.contact}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">MoU :</span> {partner.mou}
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-primary-blue mb-2">Équipements Disponibles</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    {partner.equipements.map((eq, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-primary-blue mr-2">→</span>
                        <span>{eq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h5 className="font-semibold text-green-800 mb-2">Transfert de Technologie</h5>
                  <p className="text-sm text-gray-700">{partner.transfertTechnologie}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usines/Factories */}
      <div className="card">
        <h3 className="text-2xl font-bold text-primary-green mb-4">🏭 Usines de Transformation</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {factories.map((factory) => (
            <div key={factory.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-orange transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-primary-green mb-2">{factory.nom}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Localisation :</span> {factory.localisation}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Capacité :</span> {factory.capacite}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  factory.statut === 'Opérationnelle' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {factory.statut}
                </span>
              </div>
              
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Produits transformés :</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {factory.produits.map((produit, idx) => (
                    <span key={idx} className="px-2 py-1 bg-primary-orange/10 text-primary-orange rounded text-xs">
                      {produit}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Partenaires :</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {factory.partenaires.map((part, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnershipsManagement;

