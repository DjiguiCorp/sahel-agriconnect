import { useEffect, useState } from 'react';
import {
  cropDisplayName,
  fetchMarketPrices,
  formatXofPerKg,
  pickFeaturedPrices,
  trendArrow,
} from '../lib/marketPrices';

function SkeletonRow({ count = 4 }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-w-[140px] h-[96px] rounded-2xl bg-gray-100 animate-pulse shrink-0"
        />
      ))}
    </div>
  );
}

/**
 * Horizontal market price cards.
 * @param {{ isFr: boolean, featuredOnly?: boolean, title?: string }} props
 */
export default function MarketPricesStrip({ isFr, featuredOnly = false, title }) {
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMarketPrices()
      .then(({ prices: list, updatedAt: ts }) => {
        if (cancelled) return;
        setPrices(featuredOnly ? pickFeaturedPrices(list) : list);
        setUpdatedAt(ts);
      })
      .catch(() => {
        if (!cancelled) setPrices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [featuredOnly]);

  const heading =
    title || (isFr ? 'Prix du marché' : 'Market prices');

  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-[#1a3c2e] text-lg">{heading}</h3>
        {dateLabel ? (
          <p className="text-xs text-gray-400">
            {isFr ? 'Dernière mise à jour' : 'Last updated'}: {dateLabel}
          </p>
        ) : null}
      </div>

      {loading ? (
        <SkeletonRow count={featuredOnly ? 4 : 6} />
      ) : prices.length === 0 ? (
        <p className="text-sm text-gray-500">
          {isFr ? 'Prix indisponibles pour le moment.' : 'Prices unavailable right now.'}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {prices.map((p) => {
            const t = trendArrow(p.trend);
            const change = Math.abs(Number(p.weeklyChangePercent) || 0).toFixed(1);
            return (
              <div
                key={p.commodity}
                className="min-w-[148px] snap-start shrink-0 rounded-2xl border border-gray-100 bg-gray-50/80 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl leading-none">{p.emoji || '🌾'}</span>
                  <span className="text-xs font-semibold text-[#1a3c2e] leading-snug line-clamp-2">
                    {cropDisplayName(p, isFr)}
                  </span>
                </div>
                <p className="font-bold text-sm text-[#1a3c2e] tabular-nums">{formatXofPerKg(p)}</p>
                <p className={`text-xs font-semibold mt-1 ${t.className}`}>
                  {t.arrow} {change}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
