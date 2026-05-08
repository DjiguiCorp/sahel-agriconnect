import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { AFRICAN_REGIONS } from '../data/africanRegions';
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

  // Auto-fill when detected
  useEffect(() => {
    if (detected && detectedCountry && !value.country && showBanner) {
      onChange({ country: detectedCountry, region: detectedRegion || '' });
    }
  }, [detected, detectedCountry, detectedRegion, onChange, showBanner, value.country]);

  const regions = value.country ? AFRICAN_REGIONS[value.country] || [] : [];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Auto-detected banner */}
      {showDetectedBanner && detected && detectedCountry && showBanner && value.country === detectedCountry && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs"
          style={{ background: '#f0f9f4', border: '1px solid #22c55e' }}
        >
          <span className="flex items-center gap-1.5 text-green-700">
            <MapPin className="w-3.5 h-3.5" />
            {i18n.language === 'fr' ? `Localisation détectée : ${detectedCountry}` : `Location detected: ${detectedCountry}`}
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
            {i18n.language === 'fr' ? 'Changer' : 'Change'}
          </button>
        </div>
      )}

      {/* Country selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {i18n.language === 'fr' ? 'Pays' : 'Country'}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          value={value.country}
          onChange={(e) => onChange({ country: e.target.value, region: '' })}
          required={required}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#B5850A]"
        >
          <option value="">{i18n.language === 'fr' ? 'Sélectionnez un pays' : 'Select a country'}</option>

          <optgroup label={i18n.language === 'fr' ? "🌍 Afrique de l'Ouest" : '🌍 West Africa'}>
            {[
              'Sénégal',
              'Mali',
              "Côte d'Ivoire",
              'Ghana',
              'Nigeria',
              'Burkina Faso',
              'Niger',
              'Guinée',
              'Togo',
              'Bénin',
              'Gambie',
              'Guinée-Bissau',
              'Sierra Leone',
              'Liberia',
              'Mauritanie',
              'Cap-Vert',
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>

          <optgroup label={i18n.language === 'fr' ? '🌍 Afrique Centrale' : '🌍 Central Africa'}>
            {['Cameroun', 'Tchad', 'RD Congo'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>

          <optgroup label={i18n.language === 'fr' ? "🌍 Afrique de l'Est" : '🌍 East Africa'}>
            {['Kenya', 'Éthiopie', 'Tanzanie', 'Ouganda', 'Rwanda', 'Mozambique'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>

          <optgroup label={i18n.language === 'fr' ? '🌍 Afrique Australe' : '🌍 Southern Africa'}>
            {['Afrique du Sud', 'Zimbabwe', 'Zambie', 'Madagascar'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>

          <optgroup label={i18n.language === 'fr' ? '🌍 Afrique du Nord' : '🌍 North Africa'}>
            {['Maroc', 'Algérie', 'Tunisie'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Region selector — only shows when country is selected */}
      {value.country && regions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{i18n.language === 'fr' ? 'Région / Ville' : 'Region / City'}</label>
          <select
            value={value.region}
            onChange={(e) => onChange({ ...value, region: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#B5850A]"
          >
            <option value="">{i18n.language === 'fr' ? 'Sélectionnez une région' : 'Select a region'}</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="Autre">{i18n.language === 'fr' ? 'Autre' : 'Other'}</option>
          </select>
        </div>
      )}
    </div>
  );
}

