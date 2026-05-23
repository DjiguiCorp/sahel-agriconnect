import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import {
  AFRICAN_COUNTRY_GROUPS,
  ALL_COUNTRY_OPTIONS,
  DIASPORA_COUNTRIES,
  legacyCountryToAppName,
  regionsForAppCountry,
} from '../data/africanCountries';
import { useGeolocation } from '../hooks/useGeolocation';

const GROUP_KEYS = [
  'westAfrica',
  'centralAfrica',
  'eastAfrica',
  'southernAfrica',
  'northAfrica',
];

const GROUP_LABELS = {
  westAfrica: { en: 'West Africa', fr: "Afrique de l'Ouest" },
  centralAfrica: { en: 'Central Africa', fr: 'Afrique centrale' },
  eastAfrica: { en: 'East Africa', fr: "Afrique de l'Est" },
  southernAfrica: { en: 'Southern Africa', fr: 'Afrique australe' },
  northAfrica: { en: 'North Africa', fr: 'Afrique du Nord' },
  diaspora: { en: '✈️ Diaspora & International', fr: '✈️ Diaspora & International' },
};

function flagFor(name) {
  return ALL_COUNTRY_OPTIONS.find((c) => c.name === name)?.flag ?? '🌍';
}

function isDiasporaCountry(country) {
  return DIASPORA_COUNTRIES.includes(country);
}

function regionIsCustom(region, regions) {
  return Boolean(region && !regions.includes(region));
}

export default function LocationSelector({
  value = { country: '', region: '' },
  onChange,
  required = false,
  showDetectedBanner = true,
  className = '',
}) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const listboxId = useId();
  const searchId = useId();

  const { country: detectedCountry, region: detectedRegion, detected, source } = useGeolocation();
  const [showBanner, setShowBanner] = useState(true);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [otherMode, setOtherMode] = useState(false);
  const [otherText, setOtherText] = useState('');

  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);

  const detectedAppCountry = legacyCountryToAppName(detectedCountry);
  const regions = regionsForAppCountry(value.country);
  const diaspora = isDiasporaCountry(value.country);

  const groupedCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    const filter = (name) => !q || name.toLowerCase().includes(q);

    const groups = GROUP_KEYS.map((key) => ({
      key,
      label: isFr ? GROUP_LABELS[key].fr : GROUP_LABELS[key].en,
      countries: AFRICAN_COUNTRY_GROUPS[key].filter(filter),
    })).filter((g) => g.countries.length > 0);

    const diasporaList = DIASPORA_COUNTRIES.filter(filter);
    if (diasporaList.length) {
      groups.push({
        key: 'diaspora',
        label: isFr ? GROUP_LABELS.diaspora.fr : GROUP_LABELS.diaspora.en,
        countries: diasporaList,
      });
    }

    return groups;
  }, [countryQuery, isFr]);

  const flatOptions = useMemo(
    () => groupedCountries.flatMap((g) => g.countries.map((name) => ({ name, groupKey: g.key }))),
    [groupedCountries],
  );

  useEffect(() => {
    if (detected && detectedAppCountry && !value.country && showBanner) {
      const detectedRegions = regionsForAppCountry(detectedAppCountry);
      let region = '';
      if (detectedRegion && detectedRegions.includes(detectedRegion)) region = detectedRegion;
      else if (detectedRegions.length) region = detectedRegions[0];
      onChange({ country: detectedAppCountry, region });
    }
  }, [detected, detectedAppCountry, detectedRegion, onChange, showBanner, value.country]);

  useEffect(() => {
    if (!value.country || diaspora || !regions.length) return;
    if (regionIsCustom(value.region, regions)) {
      setOtherMode(true);
      setOtherText(value.region);
    } else {
      setOtherMode(false);
      setOtherText('');
    }
  }, [value.country, value.region, diaspora, regions]);

  useEffect(() => {
    if (!countryOpen) return undefined;

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setCountryOpen(false);
        setCountryQuery('');
        setHighlightIndex(-1);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [countryOpen]);

  useEffect(() => {
    if (countryOpen) {
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setCountryQuery('');
      setHighlightIndex(-1);
    }
  }, [countryOpen]);

  const selectCountry = useCallback(
    (name) => {
      onChange({ country: name, region: '' });
      setCountryOpen(false);
      setCountryQuery('');
      setHighlightIndex(-1);
      setOtherMode(false);
      setOtherText('');
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const clearCountry = useCallback(
    (e) => {
      e.stopPropagation();
      onChange({ country: '', region: '' });
      setOtherMode(false);
      setOtherText('');
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const selectRegion = useCallback(
    (region) => {
      setOtherMode(false);
      setOtherText('');
      onChange({ ...value, region });
    },
    [onChange, value],
  );

  const activateOther = useCallback(() => {
    setOtherMode(true);
    onChange({ ...value, region: otherText });
  }, [onChange, otherText, value]);

  const handleOtherTextChange = useCallback(
    (text) => {
      setOtherText(text);
      onChange({ ...value, region: text });
    },
    [onChange, value],
  );

  const closeCountryDropdown = useCallback(() => {
    setCountryOpen(false);
    setCountryQuery('');
    setHighlightIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCountryOpen(true);
    }
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCountryDropdown();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, flatOptions.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Enter' && highlightIndex >= 0 && flatOptions[highlightIndex]) {
      e.preventDefault();
      selectCountry(flatOptions[highlightIndex].name);
    }
  };

  const copy = {
    country: isFr ? 'Pays' : 'Country',
    countryPlaceholder: isFr ? 'Sélectionnez un pays' : 'Select a country',
    countrySearch: isFr ? 'Rechercher un pays…' : 'Search for a country…',
    region: isFr ? 'Région / Ville' : 'Region / City',
    other: isFr ? '+ Autre' : '+ Other',
    otherPlaceholder: isFr ? 'Précisez votre région…' : 'Enter your region…',
    diasporaPlaceholder: isFr
      ? 'Ex : Paris, London, New York, Toronto…'
      : 'e.g. New York, Paris, London, Toronto…',
    detected: isFr ? 'Localisation détectée :' : 'Location detected:',
    change: isFr ? 'Changer' : 'Change',
    clear: isFr ? 'Effacer' : 'Clear',
    noResults: isFr ? 'Aucun pays trouvé' : 'No countries found',
  };

  return (
    <div ref={rootRef} className={`location-selector space-y-3 ${className}`}>
      {showDetectedBanner &&
        detected &&
        detectedCountry &&
        showBanner &&
        value.country &&
        detectedAppCountry === value.country && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-emerald-800">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              <span className="truncate">
                {copy.detected} {value.country}
                {source === 'ip' && (
                  <span className="font-normal text-emerald-500"> (IP)</span>
                )}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowBanner(false);
                onChange({ country: '', region: '' });
              }}
              className="shrink-0 font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
            >
              {copy.change}
            </button>
          </div>
        )}

      <div className="relative">
        <label htmlFor={`${listboxId}-trigger`} className="location-selector-label mb-1.5 block text-sm font-medium text-gray-700">
          {copy.country}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        {required && (
          <input
            type="text"
            tabIndex={-1}
            aria-hidden
            value={value.country}
            required
            onChange={() => {}}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />
        )}

        <button
          id={`${listboxId}-trigger`}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={countryOpen}
          aria-haspopup="listbox"
          aria-controls={`${listboxId}-listbox`}
          aria-label={copy.country}
          onClick={() => setCountryOpen((o) => !o)}
          onKeyDown={onTriggerKeyDown}
          className="location-country-trigger flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#B5850A] focus-visible:ring-offset-1"
        >
          <span className={`flex min-w-0 flex-1 items-center gap-2 truncate ${value.country ? 'text-gray-900' : 'text-gray-400'}`}>
            {value.country ? (
              <>
                <span className="text-base leading-none" aria-hidden>
                  {flagFor(value.country)}
                </span>
                <span className="truncate">{value.country}</span>
              </>
            ) : (
              copy.countryPlaceholder
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {value.country && (
              <span
                role="button"
                tabIndex={0}
                aria-label={copy.clear}
                className="rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                onClick={clearCountry}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    clearCountry(e);
                  }
                }}
              >
                <X className="h-4 w-4" aria-hidden />
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </span>
        </button>

        {countryOpen && (
          <div
            className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
            onKeyDown={onSearchKeyDown}
          >
            <div className="border-b border-gray-100 p-2">
              <label htmlFor={searchId} className="sr-only">
                {copy.countrySearch}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  id={searchId}
                  ref={searchRef}
                  type="search"
                  value={countryQuery}
                  onChange={(e) => {
                    setCountryQuery(e.target.value);
                    setHighlightIndex(-1);
                  }}
                  placeholder={copy.countrySearch}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#B5850A] focus:ring-1 focus:ring-[#B5850A]/20"
                  autoComplete="off"
                />
              </div>
            </div>

            <ul
              id={`${listboxId}-listbox`}
              role="listbox"
              aria-label={copy.country}
              className="max-h-64 overflow-y-auto py-1"
            >
              {flatOptions.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">{copy.noResults}</li>
              ) : (
                groupedCountries.map((group) => (
                  <li key={group.key} role="presentation">
                    <div
                      className="sticky top-0 z-10 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                      aria-hidden
                    >
                      {group.label}
                    </div>
                    <ul role="group" aria-label={group.label}>
                      {group.countries.map((name) => {
                        const flatIdx = flatOptions.findIndex((o) => o.name === name);
                        const isHighlighted = highlightIndex === flatIdx;
                        const isSelected = value.country === name;

                        return (
                          <li
                            key={name}
                            role="option"
                            aria-selected={isSelected}
                            className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? 'bg-[#B5850A]/10 font-medium text-[#1a3c2e]'
                                : isHighlighted
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'text-gray-800 hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setHighlightIndex(flatIdx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectCountry(name)}
                          >
                            <span className="text-base leading-none" aria-hidden>
                              {flagFor(name)}
                            </span>
                            <span className="truncate">{name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {value.country && (
        <div>
          <span className="location-selector-label mb-2 block text-sm font-medium text-gray-700">
            {copy.region}
          </span>

          {diaspora ? (
            <input
              type="text"
              value={value.region}
              onChange={(e) => onChange({ ...value, region: e.target.value })}
              placeholder={copy.diasporaPlaceholder}
              required={required}
              className="location-region-input w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#B5850A] focus:ring-1 focus:ring-[#B5850A]/30"
            />
          ) : regions.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2" role="group" aria-label={copy.region}>
                {regions.map((r) => {
                  const isSelected = !otherMode && value.region === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectRegion(r)}
                      className={`location-region-pill rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5850A] focus-visible:ring-offset-1 ${
                        isSelected
                          ? 'border-[#B5850A] bg-[#B5850A]/15 font-medium text-[#1a3c2e]'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#B5850A]/50 hover:bg-[#B5850A]/5'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={otherMode}
                  onClick={activateOther}
                  className={`location-region-pill rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5850A] focus-visible:ring-offset-1 ${
                    otherMode
                      ? 'border-[#B5850A] bg-[#B5850A]/15 font-medium text-[#1a3c2e]'
                      : 'border-dashed border-gray-300 bg-white text-gray-600 hover:border-[#B5850A]/50 hover:text-[#1a3c2e]'
                  }`}
                >
                  {copy.other}
                </button>
              </div>
              {otherMode && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => handleOtherTextChange(e.target.value)}
                  placeholder={copy.otherPlaceholder}
                  required={required}
                  autoFocus
                  className="location-region-input w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#B5850A] focus:ring-1 focus:ring-[#B5850A]/30"
                />
              )}
            </div>
          ) : (
            <input
              type="text"
              value={value.region}
              onChange={(e) => onChange({ ...value, region: e.target.value })}
              placeholder={copy.diasporaPlaceholder}
              required={required}
              className="location-region-input w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#B5850A] focus:ring-1 focus:ring-[#B5850A]/30"
            />
          )}
        </div>
      )}
    </div>
  );
}
