/**
 * Sync live commodity reference prices into CropPrice.
 * 1) World Bank Indicators API (requested indicator codes)
 * 2) Fallback: World Bank Pink Sheet monthly Excel (CMO Historical Data)
 */
import * as XLSX from 'xlsx';
import CropPrice from '../models/CropPrice.js';

const WB_INDICATOR_BASE = 'https://api.worldbank.org/v2/en/indicator/';
const WB_DATA_BASE = 'https://api.worldbank.org/v2/country/WLD/indicator/';
const PINK_SHEET_URL =
  process.env.PINK_SHEET_XLSX_URL ||
  'https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/related/CMO-Historical-Data-Monthly.xlsx';

const XOF_PER_USD = 600;
const CACHE_MS = 23 * 60 * 60 * 1000;

/**
 * Live-feed crops. `indicators` = World Bank/IMF-style codes.
 * `pinkSheet` = Pink Sheet column matchers + unit.
 */
const FEED_MAP = [
  {
    commodity: 'Cotton',
    commodityFr: 'Coton',
    emoji: '☁️',
    indicators: ['PCOTTIND'],
    pinkSheet: { match: /^cotton/i, unit: 'kg' },
  },
  {
    commodity: 'Maize/Corn',
    commodityFr: 'Maïs',
    emoji: '🌽',
    indicators: ['PMAIZMMT', 'PMAIZMT'],
    pinkSheet: { match: /^maize/i, unit: 'mt' },
  },
  {
    commodity: 'Rice',
    commodityFr: 'Riz',
    emoji: '🌾',
    indicators: ['PRICENPQ'],
    pinkSheet: { match: /^rice,\s*thai\s*5%/i, unit: 'mt' },
  },
  {
    commodity: 'Groundnut/Peanut',
    commodityFr: 'Arachide',
    emoji: '🥜',
    indicators: ['PGNUTOIL', 'PGNUTS'],
    pinkSheet: { match: /^groundnuts?\b/i, unit: 'mt' },
  },
  {
    commodity: 'Sorghum',
    commodityFr: 'Sorgho',
    emoji: '🌾',
    indicators: ['PSORGHMMT', 'PSORUM'],
    pinkSheet: { match: /^sorghum/i, unit: 'mt' },
  },
];

let lastSyncAt = null;
let syncInFlight = null;
let pinkSheetCache = null;
let pinkSheetCacheAt = 0;

function trendFromChange(pct) {
  if (pct > 1) return 'up';
  if (pct < -1) return 'down';
  return 'stable';
}

function num(v) {
  if (v == null || v === '' || v === '…' || v === '...') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseWorldBankSeries(payload) {
  if (!Array.isArray(payload) || payload.length < 2 || !Array.isArray(payload[1])) return [];
  return payload[1]
    .map((row) => ({
      date: String(row?.date || ''),
      value: num(row?.value),
    }))
    .filter((r) => r.value != null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

async function fetchJson(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SahelAgriConnect/1.0 (+https://sahelagriconnect.com)',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchSeriesForIndicator(code) {
  try {
    const wbDataUrl = `${WB_DATA_BASE}${encodeURIComponent(code)}?format=json&mrnev=24&per_page=60`;
    const wbData = await fetchJson(wbDataUrl);
    const series = parseWorldBankSeries(wbData);
    if (series.length >= 1) return { series, source: 'World Bank API', unit: 'mt' };
  } catch {
    /* next */
  }

  try {
    const wbIndUrl = `${WB_INDICATOR_BASE}${encodeURIComponent(code)}?format=json&mrnev=24`;
    const wbInd = await fetchJson(wbIndUrl);
    const series = parseWorldBankSeries(wbInd);
    if (series.length >= 1) return { series, source: 'World Bank API', unit: 'mt' };
  } catch {
    /* next */
  }

  return { series: [], source: null, unit: 'mt' };
}

async function loadPinkSheetRows() {
  if (pinkSheetCache && Date.now() - pinkSheetCacheAt < CACHE_MS) {
    return pinkSheetCache;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(PINK_SHEET_URL, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'SahelAgriConnect/1.0 (+https://sahelagriconnect.com)',
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      },
    });
    if (!res.ok) throw new Error(`Pink Sheet HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName =
      wb.SheetNames.find((n) => /monthly prices/i.test(n)) || wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
      defval: null,
      raw: true,
    });
    pinkSheetCache = rows;
    pinkSheetCacheAt = Date.now();
    return rows;
  } finally {
    clearTimeout(t);
  }
}

function seriesFromPinkSheet(rows, matcher) {
  if (!Array.isArray(rows) || rows.length < 7) return [];
  const header = rows[4] || [];
  const col = header.findIndex((h) => h != null && matcher.test(String(h).trim()));
  if (col < 0) return [];

  const out = [];
  for (let i = 6; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row[0] == null) continue;
    const value = num(row[col]);
    if (value == null) continue;
    out.push({ date: String(row[0]), value });
  }
  return out;
}

async function fetchLatestPair(entry) {
  for (const code of entry.indicators) {
    const { series, source, unit } = await fetchSeriesForIndicator(code);
    if (series.length >= 1) {
      return {
        latest: series[series.length - 1],
        previous: series.length >= 2 ? series[series.length - 2] : null,
        source,
        code,
        unit: unit || 'mt',
      };
    }
  }

  // Pink Sheet Excel fallback (authoritative for these commodities)
  try {
    const rows = await loadPinkSheetRows();
    const series = seriesFromPinkSheet(rows, entry.pinkSheet.match);
    if (series.length >= 1) {
      return {
        latest: series[series.length - 1],
        previous: series.length >= 2 ? series[series.length - 2] : null,
        source: 'World Bank Pink Sheet',
        code: 'PINK_SHEET',
        unit: entry.pinkSheet.unit || 'mt',
      };
    }
  } catch (err) {
    console.warn(`Pink Sheet fetch failed for ${entry.commodity}:`, err.message);
  }

  return null;
}

function toUsdPerKg(value, unit) {
  if (unit === 'kg') return value;
  return value / 1000;
}

async function upsertCropPrice(entry, latestRaw, previousRaw, unit, sourceLabel) {
  const latestUsdKg = toUsdPerKg(latestRaw, unit);
  const previousUsdKg = previousRaw != null ? toUsdPerKg(previousRaw, unit) : null;
  const pricePerKgUsd = Number(latestUsdKg.toFixed(4));
  const pricePerKgXof = Math.round(pricePerKgUsd * XOF_PER_USD);

  let weeklyChangePercent = 0;
  if (previousUsdKg != null && previousUsdKg !== 0) {
    weeklyChangePercent = Number(
      (((latestUsdKg - previousUsdKg) / previousUsdKg) * 100).toFixed(2)
    );
  }
  const trend = trendFromChange(weeklyChangePercent);

  await CropPrice.findOneAndUpdate(
    { commodity: entry.commodity },
    {
      $set: {
        pricePerKgUsd,
        pricePerKgXof,
        weeklyChangePercent,
        trend,
        sourceMarket: sourceLabel || 'World Bank Pink Sheet',
        commodityFr: entry.commodityFr,
        emoji: entry.emoji,
        updatedAt: new Date(),
      },
      $setOnInsert: { commodity: entry.commodity },
    },
    { upsert: true, new: true, runValidators: true }
  );

  return { commodity: entry.commodity, pricePerKgUsd, weeklyChangePercent, trend };
}

/**
 * Sync mapped commodities from live feeds into CropPrice.
 * Unmapped crops (Shea, Sesame, etc.) are left untouched.
 * @param {{ force?: boolean }} [opts]
 */
export async function syncCommodityPrices(opts = {}) {
  const force = Boolean(opts.force);

  if (!force && lastSyncAt && Date.now() - lastSyncAt.getTime() < CACHE_MS) {
    return {
      synced: 0,
      skipped: FEED_MAP.length,
      lastSyncAt,
      cached: true,
      results: [],
    };
  }

  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    let synced = 0;
    let skipped = 0;
    const results = [];

    for (const entry of FEED_MAP) {
      try {
        const pair = await fetchLatestPair(entry);
        if (!pair || pair.latest?.value == null) {
          skipped += 1;
          results.push({ commodity: entry.commodity, status: 'skipped', reason: 'no_data' });
          continue;
        }
        const updated = await upsertCropPrice(
          entry,
          pair.latest.value,
          pair.previous?.value ?? null,
          pair.unit,
          pair.source
        );
        synced += 1;
        results.push({ ...updated, status: 'synced', feed: pair.code });
      } catch (err) {
        skipped += 1;
        results.push({
          commodity: entry.commodity,
          status: 'skipped',
          reason: err?.message || 'error',
        });
      }
    }

    lastSyncAt = new Date();
    return { synced, skipped, lastSyncAt, cached: false, results };
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

export function getLastCommodityPriceSyncAt() {
  return lastSyncAt;
}

export default syncCommodityPrices;
