import { useEffect, useState } from 'react';
import { ALL_COUNTRY_NAMES, primaryRegionForAppCountry } from '../data/africanCountries';
import { AFRICAN_REGIONS } from '../data/africanRegions';

// Maps browser locale / timezone to country
function detectCountryFromBrowser() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language || '';

    const tzMap = {
      'Africa/Dakar': 'Sénégal',
      'Africa/Bamako': 'Mali',
      'Africa/Abidjan': "Côte d'Ivoire",
      'Africa/Accra': 'Ghana',
      'Africa/Lagos': 'Nigeria',
      'Africa/Ouagadougou': 'Burkina Faso',
      'Africa/Niamey': 'Niger',
      'Africa/Conakry': 'Guinée',
      'Africa/Lome': 'Togo',
      'Africa/Porto-Novo': 'Bénin',
      'Africa/Banjul': 'Gambie',
      'Africa/Nairobi': 'Kenya',
      'Africa/Addis_Ababa': 'Éthiopie',
      'Africa/Dar_es_Salaam': 'Tanzanie',
      'Africa/Kigali': 'Rwanda',
      'Africa/Kampala': 'Ouganda',
      'Africa/Maputo': 'Mozambique',
      'Africa/Johannesburg': 'Afrique du Sud',
      'Africa/Casablanca': 'Maroc',
      'Africa/Algiers': 'Algérie',
      'Africa/Tunis': 'Tunisie',
      'Africa/Douala': 'Cameroun',
      'Africa/Ndjamena': 'Tchad',
      'Africa/Kinshasa': 'RD Congo',
      'Africa/Lusaka': 'Zambie',
      'Africa/Harare': 'Zimbabwe',
      'Indian/Antananarivo': 'Madagascar',
    };

    if (tzMap[tz]) return { country: tzMap[tz], source: 'timezone' };

    // Fallback: language-based detection
    const langMap = {
      wo: 'Sénégal',
      bm: 'Mali',
      ff: 'Guinée',
      tw: 'Ghana',
      ha: 'Nigeria',
      yo: 'Nigeria',
      sw: 'Kenya',
      am: 'Éthiopie',
      rw: 'Rwanda',
    };
    const langCode = lang.split('-')[0].toLowerCase();
    if (langMap[langCode]) return { country: langMap[langCode], source: 'language' };
  } catch {}
  return null;
}

export function useGeolocation() {
  const [location, setLocation] = useState({
    country: null,
    region: null,
    detected: false,
    loading: true,
    source: null,
  });

  useEffect(() => {
    // Check localStorage cache first
    const cached = localStorage.getItem('sac_detected_location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLocation({ ...parsed, detected: true, loading: false });
        return;
      } catch {}
    }

    // Step 1: try browser timezone/language detection (instant)
    const browserDetected = detectCountryFromBrowser();
    if (browserDetected) {
      const loc = {
        country: browserDetected.country,
        region: AFRICAN_REGIONS[browserDetected.country]?.[0] || null,
        detected: true,
        loading: false,
        source: browserDetected.source,
      };
      setLocation(loc);
      localStorage.setItem('sac_detected_location', JSON.stringify(loc));
      return;
    }

    // Step 2: try IP geolocation API (free tier)
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        const countryName = ALL_COUNTRY_NAMES.find(
          (c) =>
            c.toLowerCase().includes(data.country_name?.toLowerCase()) ||
            data.country_name?.toLowerCase().includes(c.toLowerCase())
        );
        if (countryName) {
          const loc = {
            country: countryName,
            region: data.city || primaryRegionForAppCountry(countryName),
            detected: true,
            loading: false,
            source: 'ip',
          };
          setLocation(loc);
          localStorage.setItem('sac_detected_location', JSON.stringify(loc));
        } else {
          setLocation({ country: null, region: null, detected: false, loading: false, source: null });
        }
      })
      .catch(() => {
        setLocation({ country: null, region: null, detected: false, loading: false, source: null });
      });
  }, []);

  const updateLocation = (country, region) => {
    const loc = { country, region, detected: true, loading: false, source: 'manual' };
    setLocation(loc);
    localStorage.setItem('sac_detected_location', JSON.stringify(loc));
  };

  const clearLocation = () => {
    localStorage.removeItem('sac_detected_location');
    setLocation({ country: null, region: null, detected: false, loading: false, source: null });
  };

  return { ...location, updateLocation, clearLocation };
}

