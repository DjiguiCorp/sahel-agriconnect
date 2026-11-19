/** Shared demo / risk UI for AfriYield opportunity cards and detail pages */

export function isDemoOpportunity(opp) {
  return Boolean(opp?.isDemoOpportunity);
}

export function riskDisclosureText(opp, isFr) {
  const rd = opp?.riskDisclosure;
  if (!rd) return '';
  if (typeof rd === 'string') return rd;
  return isFr ? rd.fr || rd.en || '' : rd.en || rd.fr || '';
}

export function DemoOpportunityBanner({ isFr, className = '' }) {
  return (
    <div
      className={`rounded-full px-3 py-1 text-[11px] font-semibold text-amber-950 bg-amber-300/90 inline-flex items-center gap-1 ${className}`}
      role="status"
    >
      {isFr
        ? '🔔 Démonstration — non disponible à l’investissement'
        : '🔔 Demo — not open for investment'}
    </div>
  );
}

export function ComingSoonInvestButton({ isFr, className = '' }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={`rounded-xl px-6 py-3 text-sm font-bold cursor-not-allowed opacity-60 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.45)',
      }}
    >
      {isFr ? 'Bientôt disponible' : 'Coming Soon'}
    </button>
  );
}

export function RiskDisclosureBlock({ opp, isFr, className = '' }) {
  const text = riskDisclosureText(opp, isFr);
  if (!text) return null;
  return (
    <div className={`mt-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-1">
        {isFr ? 'Avertissement' : 'Risk Disclosure'}
      </p>
      <p className="text-[11px] italic leading-relaxed text-white/40">{text}</p>
    </div>
  );
}
