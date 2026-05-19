import { Loader2 } from 'lucide-react';
import { DIRECTIVE_TYPES } from './governmentConstants';
import { regionsByCountry } from '../../data/sahelRegions';

export function GovernmentTerritoryTab({ isFr, admin, loading, territory, territoryRegion, setTerritoryRegion }) {
  return (
    <div className="mt-2 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-xl font-bold text-[#1a3c2e]">
          {isFr ? `Intelligence territoriale — ${admin.country}` : `Territory intelligence — ${admin.country}`}
        </h2>
        <select
          value={territoryRegion}
          onChange={(e) => setTerritoryRegion(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">{isFr ? 'Toutes les régions' : 'All regions'}</option>
          {(regionsByCountry[admin.country] || []).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e] mx-auto" />
        </div>
      ) : territory ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: isFr ? 'Terres arables (ha)' : 'Arable land (ha)', v: territory.summary?.totalArableHa },
              { l: isFr ? 'Agriculteurs actifs' : 'Active farmers', v: territory.summary?.activeFarmers },
              { l: isFr ? 'Coopératives' : 'Cooperatives', v: territory.summary?.registeredCooperatives },
              { l: isFr ? 'Centres transformation' : 'Processing centers', v: territory.summary?.transformationCenters },
            ].map(({ l, v }) => (
              <div key={l} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold font-mono text-[#1a3c2e]">{v ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{l}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={isFr ? 'Découpage régional' : 'Regional breakdown'}>
              {(territory.regionalBreakdown || []).map((r) => (
                <Row key={r.region} left={r.region} right={`${r.farmers} · ${r.arableHa} ha`} />
              ))}
            </Panel>
            <Panel title={isFr ? 'Index production nationale' : 'National crop production index'}>
              {(territory.nationalCropProductionIndex || []).map((c) => (
                <Row key={c.crop} left={c.crop} right={`${c.hectares} ha (${c.shareOfHa}%)`} />
              ))}
            </Panel>
            <Panel title={isFr ? 'Priorités irrigation / eau' : 'Irrigation & water priorities'}>
              {(territory.irrigationAndWaterPriority || []).length === 0 ? (
                <p className="text-gray-500 text-sm">{isFr ? 'Enrichissement en cours.' : 'Enriching from registrations.'}</p>
              ) : (
                territory.irrigationAndWaterPriority.map((r) => (
                  <Row key={r.region} left={r.region} right={`${r.farmers} signals`} />
                ))
              )}
            </Panel>
            <Panel title={isFr ? 'Défis à résoudre' : 'Challenges to address'}>
              {(territory.platformChallengesToSolve || []).map((c) => (
                <Row key={c.topic} left={c.topic} right={String(c.reports)} />
              ))}
            </Panel>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {isFr
              ? 'Données live des coopératives et agriculteurs enregistrés — cloisonnement strict par pays.'
              : 'Live data from registered cooperatives and farmers — strict per-country isolation.'}
          </p>
        </>
      ) : null}
    </div>
  );
}

export function GovernmentDirectivesTab({ isFr, loading, directives, onNew }) {
  return (
    <div className="mt-2 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#1a3c2e]">{isFr ? 'Directives & mandats' : 'Directives & mandates'}</h2>
        <button type="button" onClick={() => onNew('policy_directive')} className="px-4 py-2.5 rounded-xl text-white text-sm font-bold bg-[#1a3c2e]">
          + {isFr ? 'Nouvelle directive' : 'New directive'}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DIRECTIVE_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onNew(t.key)}
            className="text-left p-4 rounded-xl border-2 border-dashed border-[#1a3c2e]/25 hover:border-[#1a3c2e] bg-white"
          >
            <span className="text-2xl">{t.emoji}</span>
            <p className="text-sm font-semibold text-[#1a3c2e] mt-2">{isFr ? t.fr : t.en}</p>
          </button>
        ))}
      </div>
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e] mx-auto" />
      ) : directives.length === 0 ? (
        <p className="text-center text-gray-500 py-8 bg-white rounded-xl border">
          {isFr ? 'Aucune directive. KYC officiel requis pour chaque transmission.' : 'No directives yet. Official KYC required per transmission.'}
        </p>
      ) : (
        <div className="space-y-3">
          {directives.map((dir) => {
            const t = DIRECTIVE_TYPES.find((x) => x.key === dir.directiveType);
            return (
              <div key={dir._id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-[#1a3c2e]">
                    {t?.emoji} {isFr && dir.titleFr ? dir.titleFr : dir.title}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{dir.status}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{dir.body}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {dir.officialKyc?.fullLegalName} · {dir.officialKyc?.officialTitle} · {dir.officialKyc?.authorizationReference}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="font-bold text-[#1a3c2e] mb-3">{title}</h3>
      <div className="max-h-72 overflow-y-auto space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ left, right }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="font-medium">{left}</span>
      <span className="text-gray-600">{right}</span>
    </div>
  );
}
