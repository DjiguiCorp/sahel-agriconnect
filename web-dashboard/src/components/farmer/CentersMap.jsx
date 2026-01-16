import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { API_ENDPOINTS } from '../../config/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CentersMap = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CENTERS.BASE);
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

  if (loading) {
    return <div className="text-center py-8">Chargement de la carte...</div>;
  }

  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-2">Centres Agricoles</h2>
        <p className="text-sm text-gray-600 mb-4">{centers.length} centre(s) disponible(s)</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {centers.map((center) => (
            <div
              key={center._id}
              onClick={() => setSelectedCenter(center)}
              className={`p-2 rounded cursor-pointer ${
                selectedCenter?._id === center._id ? 'bg-primary-green text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <p className="font-medium">{center.nom}</p>
              <p className="text-xs">{center.region}</p>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={[13.5, -4.0]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {centers.map((center) => (
          <Marker
            key={center._id}
            position={[center.latitude, center.longitude]}
            eventHandlers={{
              click: () => setSelectedCenter(center)
            }}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{center.nom}</h3>
                <p className="text-sm">{center.region}</p>
                <p className="text-sm">{center.localisation}</p>
                {center.contact?.telephone && (
                  <p className="text-sm">📞 {center.contact.telephone}</p>
                )}
                {center.services && center.services.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium">Services:</p>
                    <p className="text-xs">{center.services.join(', ')}</p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedCenter && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{selectedCenter.nom}</h3>
              <p className="text-gray-600 mb-2">{selectedCenter.region}</p>
              <p className="text-sm text-gray-600 mb-4">{selectedCenter.localisation}</p>
              {selectedCenter.contact && (
                <div className="mb-4">
                  <p className="text-sm"><strong>Téléphone:</strong> {selectedCenter.contact.telephone}</p>
                  {selectedCenter.contact.email && (
                    <p className="text-sm"><strong>Email:</strong> {selectedCenter.contact.email}</p>
                  )}
                </div>
              )}
              {selectedCenter.services && selectedCenter.services.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Services disponibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCenter.services.map((service, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary-green text-white rounded text-xs">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedCenter(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentersMap;
