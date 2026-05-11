import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const TRACK_COLORS = { 'Track A': '#1a3c2e', 'Track B': '#B5850A', 'Track C': '#3b82f6', All: '#6b7280' };
const CERT_COLORS = {
  'International (EU/USDA)': '#B5850A',
  'Regional (ECOWAS)': '#3b82f6',
  Local: '#059669',
  Pending: '#6b7280',
};

export default function InvestmentOpportunities() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState('all');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/opportunities`)
      .then((r) => r.json())
      .then((d) => setOpportunities(d.opportunities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = opportunities.filter((o) => {
      const matchTrack = trackFilter === 'all' || o.track === trackFilter;
      const matchCommodity =
        !commodityFilter || o.commodity?.toLowerCase().includes(commodityFilter.toLowerCase());
      const matchSearch =
        !searchQuery ||
        o.centerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTrack && matchCommodity && matchSearch;
    });
    if (sortBy === 'featured') list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    else if (sortBy === 'amount_asc') list = [...list].sort((a, b) => a.amountSought - b.amountSought);
    else if (sortBy === 'amount_desc') list = [...list].sort((a, b) => b.amountSought - a.amountSought);
    else if (sortBy === 'roi') list = [...list].sort((a, b) => (b.expectedROIMin || 0) - (a.expectedROIMin || 0));
    return list;
  }, [opportunities, trackFilter, commodityFilter, searchQuery, sortBy]);

  return (
    <div style={{ background: '#0d1f17', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3c2e, #0d1f17)' }} className="px-6 py-12">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isFr ? "Opportunités d'investissement" : 'Investment Opportunities'}
          </h1>
          <p className="text-white/40 text-sm mb-6">
            {isFr ? 'Toutes vérifiées, sous escrow, conformes OHADA' : 'All verified, under escrow, OHADA compliant'}
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {['all', 'Track A', 'Track B', 'Track C'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrackFilter(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: trackFilter === t ? TRACK_COLORS[t] || '#B5850A' : 'transparent',
                    color: trackFilter === t ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {t === 'all' ? (isFr ? 'Tous' : 'All') : t}
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-2 rounded-xl px-3 min-w-[120px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <input
                type="text"
                value={commodityFilter}
                onChange={(e) => setCommodityFilter(e.target.value)}
                placeholder={isFr ? 'Commodité' : 'Commodity'}
                className="flex-1 bg-transparent text-sm text-white outline-none py-2 placeholder-white/20 min-w-0"
              />
            </div>

            <div
              className="flex items-center gap-2 rounded-xl px-3 flex-1 min-w-[200px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFr ? 'Rechercher...' : 'Search...'}
                className="flex-1 bg-transparent text-sm text-white outline-none py-2 placeholder-white/20"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="featured">{isFr ? 'En vedette' : 'Featured'}</option>
              <option value="roi">{isFr ? 'Meilleur ROI' : 'Best ROI'}</option>
              <option value="amount_asc">{isFr ? 'Montant ↑' : 'Amount ↑'}</option>
              <option value="amount_desc">{isFr ? 'Montant ↓' : 'Amount ↓'}</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 60px' }}>
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-white/30 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-5xl mb-4">🌾</p>
            <h3 className="text-xl font-bold text-white mb-2">
              {isFr ? "Aucune opportunité pour l'instant" : 'No opportunities yet'}
            </h3>
            <p className="text-white/40 text-sm mb-6">
              {isFr
                ? 'Les premières opportunités vérifiées arrivent bientôt. Inscrivez-vous pour être notifié.'
                : 'First verified opportunities coming soon. Register to be notified.'}
            </p>
            <Link
              to="/afri-yield/register"
              className="inline-block px-6 py-3 rounded-xl font-bold text-sm text-[#1a3c2e]"
              style={{ background: '#B5850A' }}
            >
              {isFr ? "M'inscrire et être notifié" : 'Register and be notified'}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-white/30 text-xs mb-5">
              {filtered.length} {isFr ? 'opportunité(s) trouvée(s)' : 'opportunity(s) found'}
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map((opp) => {
                const fundingPct =
                  opp.amountSought > 0
                    ? Math.min(100, Math.round(((opp.amountRaised || 0) / opp.amountSought) * 100))
                    : 0;
                const trackColor = TRACK_COLORS[opp.track] || '#1a3c2e';
                const certColor = CERT_COLORS[opp.certificationStatus] || '#6b7280';
                return (
                  <Link
                    key={opp._id}
                    to={`/afri-yield/opportunities/${opp._id}`}
                    className="block rounded-2xl overflow-hidden transition hover:scale-[1.01]"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: opp.featured ? `1px solid ${trackColor}60` : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ background: trackColor }}
                            >
                              {opp.track}
                            </span>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ background: certColor + 'cc' }}
                            >
                              {opp.certificationStatus}
                            </span>
                            {opp.featured && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: '#B5850A20', color: '#B5850A' }}
                              >
                                ⭐ {isFr ? 'Vedette' : 'Featured'}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-white text-lg">{opp.centerName}</h3>
                          <p className="text-sm text-white/40">
                            🌍 {opp.location}, {opp.country}
                          </p>
                        </div>
                        {opp.afriyieldScore > 0 && (
                          <div className="text-center flex-shrink-0">
                            <p
                              className="text-xl font-bold"
                              style={{ color: opp.afriyieldScore >= 70 ? '#4ade80' : '#B5850A' }}
                            >
                              {opp.afriyieldScore}
                            </p>
                            <p className="text-xs text-white/30">AY Score</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-white/50 line-clamp-2 mb-4">{opp.description}</p>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-white/30 mb-1">{isFr ? 'Recherché' : 'Seeking'}</p>
                          <p className="text-sm font-bold text-white">${(opp.amountSought || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-white/30 mb-1">Min.</p>
                          <p className="text-sm font-bold text-white">${(opp.minInvestment || 1000).toLocaleString()}</p>
                        </div>
                        <div
                          className="rounded-lg p-2.5 text-center"
                          style={{
                            background: opp.expectedROIMin > 0 ? 'rgba(181,133,10,0.1)' : 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <p className="text-xs text-white/30 mb-1">{isFr ? 'ROI est.' : 'Est. ROI'}</p>
                          <p
                            className="text-sm font-bold"
                            style={{ color: opp.expectedROIMin > 0 ? '#B5850A' : '#fff' }}
                          >
                            {opp.expectedROIMin > 0
                              ? `${opp.expectedROIMin}–${opp.expectedROIMax}%`
                              : `${opp.cycledays}j`}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-white/30 mb-1">
                          <span>{isFr ? 'Financement' : 'Funding'}</span>
                          <span>{fundingPct}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${fundingPct}%`,
                              background: fundingPct >= 80 ? '#4ade80' : '#B5850A',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-5 py-3 flex justify-between items-center"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        {opp.insuranceCoverage && (
                          <span className="text-xs text-white/30">🛡 {isFr ? 'Assuré' : 'Insured'}</span>
                        )}
                        {opp.memberFarmers > 0 && (
                          <span className="text-xs text-white/30">👩‍🌾 {opp.memberFarmers}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#B5850A' }}>
                        {isFr ? 'Voir le deal →' : 'View deal →'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
