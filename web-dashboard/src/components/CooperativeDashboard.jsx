import { useState, useMemo } from 'react';
import { phase2Cooperatives } from '../data/phase2CooperativesSeed';
import CooperativeInquiryModal from './CooperativeInquiryModal';
import { Users, MapPin } from 'lucide-react';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';

const countriesFilter = ['Tous', ...AFRICAN_COUNTRIES];

const CooperativeDashboard = () => {
  const [countryFilter, setCountryFilter] = useState('Tous');
  const [inquiryCoop, setInquiryCoop] = useState(null);

  const filtered = useMemo(() => {
    if (countryFilter === 'Tous') return phase2Cooperatives;
    return phase2Cooperatives.filter((c) => c.country === countryFilter);
  }, [countryFilter]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-forest mb-2">Coopératives partenaires</h2>
          <p className="text-gray-600 max-w-2xl">
            Réseau de coopératives en Afrique de l&apos;Ouest et au-delà — demandez à rejoindre une structure proche
            de votre exploitation.
          </p>
        </div>
        <div>
          <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrer par pays
          </label>
          <select
            id="country-filter"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-sage min-w-[200px]"
          >
            {countriesFilter.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((coop) => (
          <article
            key={coop.id}
            className="card flex flex-col border border-gray-100 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <h3 className="text-xl font-bold text-brand-forest pr-2">{coop.name}</h3>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-iconBg text-brand-forest border border-brand-sage/30">
                <MapPin className="w-3.5 h-3.5 mr-1" aria-hidden />
                {coop.region}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{coop.country}</p>
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
              <Users className="w-4 h-4 text-brand-sage shrink-0" aria-hidden />
              <span>{coop.memberCount} membres</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-gray-800">Cultures principales :</span>{' '}
              {coop.mainCrops.join(', ')}
            </p>
            <p className="text-sm text-gray-500 mb-6">Contact : {coop.contact}</p>
            <div className="mt-auto">
              <button
                type="button"
                onClick={() => setInquiryCoop(coop)}
                className="w-full btn-primary"
                aria-label={`Demander à rejoindre ${coop.name}`}
              >
                Demander à rejoindre
              </button>
            </div>
          </article>
        ))}
      </div>

      {inquiryCoop && <CooperativeInquiryModal cooperative={inquiryCoop} onClose={() => setInquiryCoop(null)} />}
    </div>
  );
};

export default CooperativeDashboard;
