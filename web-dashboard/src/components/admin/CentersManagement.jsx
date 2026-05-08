import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import LocationSelector from '../LocationSelector';
import { COUNTRY_CODES } from '../../data/africanRegions';

const CentersManagement = ({ globalCountryFilter = '' }) => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [processorLocation, setProcessorLocation] = useState({ country: '', region: '' });
  const [formData, setFormData] = useState({
    nom: '',
    region: '',
    localisation: '',
    latitude: '',
    longitude: '',
    contact: { telephone: '', email: '' },
    technicians: [],
    inventory: { equipment: [], fertilizers: [], seeds: [] },
    services: [],
    statut: 'Opérationnel'
  });

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.CENTERS.BASE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCenters(data.centers);
      }
    } catch (error) {
      console.error('Erreur récupération centres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = selectedCenter 
        ? API_ENDPOINTS.CENTERS.BY_ID(selectedCenter._id)
        : API_ENDPOINTS.CENTERS.BASE;
      
      const method = selectedCenter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          pays: processorLocation.country,
          country: processorLocation.country,
          countryCode: COUNTRY_CODES[processorLocation.country] || '',
          region: processorLocation.region || formData.region,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchCenters();
        setShowForm(false);
        setSelectedCenter(null);
        setProcessorLocation({ country: '', region: '' });
        setFormData({
          nom: '',
          region: '',
          localisation: '',
          latitude: '',
          longitude: '',
          contact: { telephone: '', email: '' },
          technicians: [],
          inventory: { equipment: [], fertilizers: [], seeds: [] },
          services: [],
          statut: 'Opérationnel'
        });
      }
    } catch (error) {
      console.error('Erreur sauvegarde centre:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  const filteredCenters = globalCountryFilter
    ? centers.filter(
        (item) =>
          item.country === globalCountryFilter ||
          item.pays === globalCountryFilter ||
          String(item.region || '').includes(globalCountryFilter)
      )
    : centers;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Centres Agricoles</h2>
          <p className="text-gray-600">{centers.length} centre(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen transition-colors"
        >
          + Nouveau Centre
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">
            {selectedCenter ? 'Modifier le Centre' : 'Nouveau Centre'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du Centre</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <LocationSelector value={processorLocation} onChange={setProcessorLocation} required showDetectedBanner={true} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formData.contact.telephone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, telephone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-lightgreen"
              >
                {selectedCenter ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedCenter(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCenters.map((center) => (
          <div key={center._id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">{center.nom}</h3>
            <p className="text-gray-600 mb-2">{center.region}</p>
            <p className="text-sm text-gray-500 mb-4">{center.localisation}</p>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded text-xs ${
                center.statut === 'Opérationnel' ? 'bg-green-100 text-green-800' :
                center.statut === 'En construction' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {center.statut}
              </span>
              <button
                onClick={() => {
                  setSelectedCenter(center);
                  setProcessorLocation({
                    country: center.pays || center.country || '',
                    region: center.region || '',
                  });
                  setFormData({
                    nom: center.nom,
                    region: center.region,
                    localisation: center.localisation,
                    latitude: center.latitude?.toString() || '',
                    longitude: center.longitude?.toString() || '',
                    contact: center.contact || { telephone: '', email: '' },
                    technicians: center.technicians || [],
                    inventory: center.inventory || { equipment: [], fertilizers: [], seeds: [] },
                    services: center.services || [],
                    statut: center.statut
                  });
                  setShowForm(true);
                }}
                className="text-primary-green hover:underline text-sm"
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CentersManagement;
