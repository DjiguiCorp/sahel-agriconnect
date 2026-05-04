import { useMemo, useState } from 'react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'shea', label: 'Shea Butter' },
  { id: 'sesame', label: 'Sesame' },
  { id: 'trackA', label: 'Track A' },
  { id: 'trackB', label: 'Track B' },
  { id: 'certified', label: 'Certified' },
];

const OPPORTUNITIES = [
  {
    id: '1',
    name: 'Centre Karité Premium',
    location: 'Sikasso, Mali',
    commodities: ['shea'],
    tracks: ['A'],
    certLabel: 'Regional Certified',
    certTone: 'blue',
    certTier: 'regional',
    amount: 'Seeking $25,000 for cold storage equipment',
    description: '3 farmers cooperatives connected',
  },
  {
    id: '2',
    name: 'Coopérative Sésame Excellence',
    location: 'Kayes, Mali',
    commodities: ['sesame'],
    tracks: ['A'],
    certLabel: 'Local Certified',
    certTone: 'gray',
    certTier: 'local',
    amount: 'Seeking $15,000 for drying equipment',
    description: '47 member farmers',
  },
  {
    id: '3',
    name: 'AfriProcess Hub',
    location: 'Dakar, Senegal',
    commodities: ['shea', 'sesame'],
    tracks: ['B'],
    certLabel: 'USDA Certified',
    certTone: 'emerald',
    certTier: 'usda',
    amount: 'Seeking $50,000 for export branding',
    description: 'Export pipeline to France and USA',
  },
  {
    id: '4',
    name: 'Golden Shea Cooperative',
    location: "Korhogo, Côte d'Ivoire",
    commodities: ['shea'],
    tracks: ['A'],
    certLabel: 'Local Certified',
    certTone: 'gray',
    certTier: 'local',
    amount: 'Seeking $20,000 for processing machinery',
    description: '28 member farmers',
  },
  {
    id: '5',
    name: 'Sesame Valley Processors',
    location: 'Tamale, Ghana',
    commodities: ['sesame'],
    tracks: ['B'],
    certLabel: 'Regional Certified',
    certTone: 'blue',
    certTier: 'regional',
    amount: 'Seeking $35,000 for market development',
    description: 'Existing buyer in Japan',
  },
  {
    id: '6',
    name: 'West Africa Shea Alliance',
    location: 'Thiès, Senegal',
    commodities: ['shea'],
    tracks: ['A', 'B'],
    certLabel: 'International (USDA)',
    certTone: 'amber',
    certTier: 'international',
    amount: 'Seeking $75,000 for full supply chain upgrade',
    description: '120 member farmers',
  },
];

function matchesFilter(filterId, opp) {
  if (filterId === 'all') return true;
  if (filterId === 'shea') return opp.commodities.includes('shea');
  if (filterId === 'sesame') return opp.commodities.includes('sesame');
  if (filterId === 'trackA') return opp.tracks.includes('A');
  if (filterId === 'trackB') return opp.tracks.includes('B');
  if (filterId === 'certified') return opp.certTier !== 'local';
  return true;
}

function commodityBadge(opp) {
  if (opp.commodities.length > 1) return 'Shea + Sesame';
  return opp.commodities.includes('shea') ? 'Shea Butter' : 'Sesame';
}

function trackBadge(opp) {
  if (opp.tracks.includes('A') && opp.tracks.includes('B')) return 'Track A + B';
  return opp.tracks.includes('A') ? 'Track A' : 'Track B';
}

const certStyles = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  blue: 'bg-blue-50 text-blue-900 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
};

export default function InvestmentOpportunities() {
  const [activeFilter, setActiveFilter] = useState('all');

  const visible = useMemo(
    () => OPPORTUNITIES.filter((o) => matchesFilter(activeFilter, o)),
    [activeFilter]
  );

  return (
    <div className="bg-brand-cream min-h-[60vh]">
      <section className="bg-[#1a3c2e] py-14">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Investment Opportunities</h1>
          <p className="mt-3 text-lg text-white/85 max-w-2xl mx-auto">
            Browse verified transformation centers and cooperatives open for investment
          </p>
        </div>
      </section>

      <section className="section-container pb-20">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                activeFilter === f.id
                  ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]'
                  : 'bg-white text-brand-forest border-gray-200 hover:border-[#B5850A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {visible.map((opp) => (
            <article
              key={opp.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md flex flex-col"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="rounded-full bg-[#1a3c2e]/10 px-3 py-0.5 text-xs font-bold text-[#1a3c2e]">
                  {commodityBadge(opp)}
                </span>
                <span className="rounded-full bg-[#B5850A]/15 px-3 py-0.5 text-xs font-bold text-[#9a7109]">
                  {trackBadge(opp)}
                </span>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-bold ${certStyles[opp.certTone]}`}
                >
                  {opp.certLabel}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-brand-forest">{opp.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{opp.location}</p>
              <p className="mt-4 font-semibold text-gray-900">{opp.amount}</p>
              <p className="mt-2 text-gray-600 text-sm flex-1">{opp.description}</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-[#B5850A] px-4 py-3 text-sm font-bold text-white hover:bg-[#9a7109] transition"
                >
                  Schedule Meeting
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border-2 border-[#1a3c2e] px-4 py-3 text-sm font-bold text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
                >
                  Express Interest
                </button>
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-center text-gray-600 py-12">No opportunities match this filter.</p>
        ) : null}
      </section>
    </div>
  );
}
