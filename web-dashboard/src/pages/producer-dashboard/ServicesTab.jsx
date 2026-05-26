import { memo } from 'react';
import { Link } from 'react-router-dom';

function ServicesTab({ isFr }) {
  const services = [
    {
      type: 'tractor',
      icon: '🚜',
      label: isFr ? 'Tracteur' : 'Tractor',
      desc: isFr ? 'Labour, semis, transport de récolte' : 'Plowing, planting, harvest transport',
      price: isFr ? '15–25$/heure' : '$15–25/hour',
    },
    {
      type: 'irrigation',
      icon: '💧',
      label: isFr ? 'Irrigation' : 'Irrigation',
      desc: isFr ? "Systèmes d'irrigation solaire ou gravitaire" : 'Solar or gravity irrigation systems',
      price: isFr ? 'Selon besoins' : 'Based on needs',
    },
    {
      type: 'cold_storage',
      icon: '🏠',
      label: isFr ? 'Stockage frigorifique' : 'Cold Storage',
      desc: isFr ? 'Conservation post-récolte certifiée' : 'Certified post-harvest conservation',
      price: isFr ? '2$/kg/mois' : '$2/kg/month',
    },
    {
      type: 'training',
      icon: '📚',
      label: isFr ? 'Formation' : 'Training',
      desc: isFr ? 'Techniques agricoles, certification, export' : 'Farming techniques, certification, export',
      price: isFr ? '99–299$ selon niveau' : '$99–299 by level',
    },
    {
      type: 'micro_loan',
      icon: '💰',
      label: isFr ? 'Micro-financement' : 'Micro-loan',
      desc: isFr ? 'Financement intrants, équipements via AfriYield' : 'Input/equipment financing via AfriYield',
      price: isFr ? 'Dès 500$' : 'From $500',
    },
    {
      type: 'processing',
      icon: '⚙️',
      label: isFr ? 'Transformation' : 'Processing',
      desc: isFr ? 'Centres de transformation certifiés' : 'Certified transformation centers',
      price: isFr ? '0.5–1$/kg' : '$0.5–1/kg',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-[#1a3c2e]">{isFr ? 'Services disponibles' : 'Available Services'}</h3>
        <p className="text-gray-500 text-sm mt-1">
          {isFr
            ? 'Réservez des services via votre coopérative ou directement.'
            : 'Book services via your cooperative or directly.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map((service) => (
          <div key={service.type} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl shrink-0">{service.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1a3c2e]">{service.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{service.desc}</p>
                <p className="text-xs font-semibold text-[#B5850A] mt-1">{service.price}</p>
              </div>
            </div>
            <Link
              to="/farmer-needs"
              className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90"
              style={{ background: '#1a3c2e' }}
            >
              {isFr ? 'Demander ce service →' : 'Request this service →'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ServicesTab);
