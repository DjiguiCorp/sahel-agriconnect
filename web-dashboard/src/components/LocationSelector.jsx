import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import {
  AFRICAN_COUNTRY_GROUPS,
  ALL_COUNTRY_OPTIONS,
  legacyCountryToAppName,
  regionsForAppCountry,
} from '../data/africanCountries';
import { useGeolocation } from '../hooks/useGeolocation';

export default function LocationSelector({
  value = { country: '', region: '' },
  onChange,
  required = false,
  showDetectedBanner = true,
  className = '',
}) {
  const { i18n } = useTranslation();
  const { country: detectedCountry, region: detectedRegion, detected, source } = useGeolocation();
  const [showBanner, setShowBanner] = useState(true);
  const isFr = i18n.language === 'fr';

  const detectedAppCountry = legacyCountryToAppName(detectedCountry);

  useEffect(() => {
    if (detected && detectedAppCountry && !value.country && showBanner) {
      const regions = regionsForAppCountry(detectedAppCountry);
      let region = '';
      if (detectedRegion && regions.includes(detectedRegion)) region = detectedRegion;
      else if (regions.length) region = regions[0];
      onChange({ country: detectedAppCountry, region });
    }
  }, [detected, detectedAppCountry, detectedRegion, onChange, showBanner, value.country]);

  const regions = regionsForAppCountry(value.country);

  const flagFor = (name) =>
    ALL_COUNTRY_OPTIONS.find((c) => c.name === name)?.flag ?? '🌍';

  return (
    <div className={`space-y-3 ${className}`}>
      {showDetectedBanner &&
        detected &&
        detectedCountry &&
        showBanner &&
        value.country &&
        detectedAppCountry === value.country && (
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs"
            style={{ background: '#f0f9f4', border: '1px solid #22c55e' }}
          >
            <span className="flex items-center gap-1.5 text-green-700">
              <MapPin className="w-3.5 h-3.5" />
              {isFr ? `Localisation détectée : ${value.country}` : `Location detected: ${value.country}`}
              {source === 'ip' && <span className="text-green-500"> (IP)</span>}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowBanner(false);
                onChange({ country: '', region: '' });
              }}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              {isFr ? 'Changer' : 'Change'}
            </button>
          </div>
        )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isFr ? 'Pays' : 'Country'}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          value={value.country}
          onChange={(e) => onChange({ country: e.target.value, region: '' })}
          required={required}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#B5850A]"
        >
          <option value="">{isFr ? 'Sélectionnez un pays' : 'Select a country'}</option>
          <optgroup label={isFr ? 'Afrique de l\'Ouest' : 'West Africa'}>
            {AFRICAN_COUNTRY_GROUPS.westAfrica.map((c) => (
              <option key={c} value={c}>
                {flagFor(c)} {c}
              </option>
            ))}
          </optgroup>
          <optgroup label={isFr ? 'Afrique centrale' : 'Central Africa'}>
            {AFRICAN_COUNTRY_GROUPS.centralAfrica.map((c) => (
              <option key={c} value={c}>
                {flagFor(c)} {c}
              </option>
            ))}
          </optgroup>
          <optgroup label={isFr ? 'Afrique de l\'Est' : 'East Africa'}>
            {AFRICAN_COUNTRY_GROUPS.eastAfrica.map((c) => (
              <option key={c} value={c}>
                {flagFor(c)} {c}
              </option>
            ))}
          </optgroup>
          <optgroup label={isFr ? 'Afrique australe' : 'Southern Africa'}>
            {AFRICAN_COUNTRY_GROUPS.southernAfrica.map((c) => (
              <option key={c} value={c}>
                {flagFor(c)} {c}
              </option>
            ))}
          </optgroup>
          <optgroup label={isFr ? 'Afrique du Nord' : 'North Africa'}>
            {AFRICAN_COUNTRY_GROUPS.northAfrica.map((c) => (
              <option key={c} value={c}>
                {flagFor(c)} {c}
              </option>
            ))}
          </optgroup>
          <optgroup
            label={isFr ? '✈️ Diaspora & International' : '✈️ Diaspora & International'}
          >
            {['United States', 'United Kingdom', 'France', 'Canada'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {value.country && regions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isFr ? 'Région / Ville' : 'Region / City'}
          </label>
          <select
            value={value.region}
            onChange={(e) => onChange({ ...value, region: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#B5850A]"
          >
            <option value="">{isFr ? 'Sélectionnez une région' : 'Select a region'}</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="Autre">{isFr ? 'Autre' : 'Other'}</option>
          </select>
        </div>
      )}
    </div>
  );
}
