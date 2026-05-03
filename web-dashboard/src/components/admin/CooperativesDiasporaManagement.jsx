import { useState } from 'react';
import CooperativeDashboard from '../CooperativeDashboard';
import DiasporaPartnership from '../DiasporaPartnership';
import TransformationCenters from '../TransformationCenters';
import { Handshake, Globe, Factory, ClipboardList } from 'lucide-react';

const views = [
  { id: 'cooperatives', label: 'Coopératives', Icon: Handshake },
  { id: 'diaspora', label: 'Partenariat Diaspora', Icon: Globe },
  { id: 'centers', label: 'Centres Transformation', Icon: Factory },
  { id: 'requests', label: 'Demandes & Matching', Icon: ClipboardList },
];

const CooperativesDiasporaManagement = () => {
  const [activeView, setActiveView] = useState('cooperatives');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">
            Coopératives & Diaspora
          </h2>
          <p className="text-gray-600">
            Gestion des coopératives, partenariats diaspora et centres de transformation
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`py-4 px-6 border-b-2 font-medium transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
                activeView === view.id
                  ? 'border-primary-green text-primary-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <view.Icon className="w-4 h-4 shrink-0" aria-hidden />
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeView === 'cooperatives' && <CooperativeDashboard />}
        {activeView === 'diaspora' && <DiasporaPartnership />}
        {activeView === 'centers' && <TransformationCenters />}
        {activeView === 'requests' && <RequestsManagement />}
      </div>
    </div>
  );
};

// Composant pour gérer les demandes et matching
const RequestsManagement = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      type: 'financement',
      cooperative: 'Coopérative Agricole de Sikasso',
      date: new Date().toISOString(),
      statut: 'En attente',
      montant: '50000 USD'
    },
    {
      id: 2,
      type: 'certification',
      center: 'Centre de Transformation de Karité - Sikasso',
      date: new Date().toISOString(),
      statut: 'En attente d\'inspection',
      certification: 'FDA/USDA'
    },
    {
      id: 3,
      type: 'diaspora',
      entreprise: 'Sahel Foods USA',
      ville: 'New York, NY',
      date: new Date().toISOString(),
      statut: 'Matching en cours',
      matches: 3
    }
  ]);

  const getStatusBadge = (statut) => {
    const badges = {
      'En attente': 'bg-yellow-100 text-yellow-800',
      'En attente d\'inspection': 'bg-blue-100 text-blue-800',
      'Matching en cours': 'bg-purple-100 text-purple-800',
      'Approuvé': 'bg-green-100 text-green-800',
      'Rejeté': 'bg-red-100 text-red-800'
    };
    return badges[statut] || badges['En attente'];
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-xl font-bold text-primary-green mb-4">
          Demandes de Financement
        </h3>
        <div className="space-y-4">
          {requests.filter(r => r.type === 'financement').map((request) => (
            <div key={request.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-blue">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{request.cooperative}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Date: {new Date(request.date).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Montant: {request.montant}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.statut)}`}>
                  {request.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-primary-green mb-4">
          Demandes de Certification
        </h3>
        <div className="space-y-4">
          {requests.filter(r => r.type === 'certification').map((request) => (
            <div key={request.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-green">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{request.center}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Date: {new Date(request.date).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Certification: {request.certification}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.statut)}`}>
                  {request.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-primary-green mb-4">
          Matching Diaspora
        </h3>
        <div className="space-y-4">
          {requests.filter(r => r.type === 'diaspora').map((request) => (
            <div key={request.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-orange">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{request.entreprise}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {request.ville}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.matches} centre(s) correspondant(s)
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.statut)}`}>
                  {request.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CooperativesDiasporaManagement;

