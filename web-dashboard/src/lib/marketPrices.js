import { API_BASE_URL } from '../config/api';

export const FEATURED_SMALLHOLDER = ['Shea Butter', 'Sesame', 'Maize/Corn', 'Cotton'];

export function trendArrow(trend) {
  if (trend === 'up') return { arrow: '↑', className: 'text-green-600' };
  if (trend === 'down') return { arrow: '↓', className: 'text-red-600' };
  return { arrow: '→', className: 'text-gray-400' };
}

export function cropDisplayName(p, isFr) {
  if (!p) return '';
  return isFr ? p.commodityFr || p.commodity : p.commodity;
}

export function formatXofPerKg(p) {
  const xof =
    p?.pricePerKgXof != null
      ? Number(p.pricePerKgXof)
      : p?.pricePerKgUsd != null
        ? Math.round(Number(p.pricePerKgUsd) * 600)
        : null;
  if (xof == null || !Number.isFinite(xof)) return '—';
  return `${xof.toLocaleString()} XOF/kg`;
}

export function formatUsdPerKg(p) {
  const usd = Number(p?.pricePerKgUsd);
  if (!Number.isFinite(usd)) return '—';
  return `$${usd.toFixed(2)}`;
}

export async function fetchMarketPrices() {
  const base = (API_BASE_URL || '').replace(/\/$/, '');
  const r = await fetch(`${base}/api/marketplace/prices`);
  const d = await r.json().catch(() => ({}));
  const prices = Array.isArray(d.prices) ? d.prices : [];
  return {
    prices,
    updatedAt: d.updatedAt || prices[0]?.updatedAt || null,
  };
}

export function pickFeaturedPrices(prices, names = FEATURED_SMALLHOLDER) {
  const byName = Object.fromEntries((prices || []).map((p) => [p.commodity, p]));
  return names.map((n) => byName[n]).filter(Boolean);
}
