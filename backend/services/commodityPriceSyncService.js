/**
 * Sync live commodity reference prices into CropPrice.
 * 1) World Bank Indicators API (short timeout)
 * 2) Pink Sheet Excel fallback (short timeout)
 * 3) Static West African reference prices if feeds fail
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
const FETCH_TIMEOUT_MS = 10_000;

/** Live-feed crops with static fallbacks if World Bank / Pink Sheet fails. */
const FEED_MAP = [
  {
    commodity: 'Cotton',
    commodityFr: 'Coton',
    emoji: '☁️',
    indicators: ['PCOTTIND'],
    pinkSheet: { match: /^cotton/i, unit: 'kg' },
    fallback: { pricePerKgUsd: 0.95, pricePerKgXof: 570 },
  },
  {
    commodity: 'Maize/Corn',
    commodityFr: 'Maïs',
    emoji: '🌽',
    indicators: ['PMAIZMMT', 'PMAIZMT'],
    pinkSheet: { match: /^maize/i, unit: 'mt' },
    fallback: { pricePerKgUsd: 0.22, pricePerKgXof: 132 },
  },
  {
    commodity: 'Rice',
    commodityFr: 'Riz',
    emoji: '🌾',
    indicators: ['PRICENPQ'],
    pinkSheet: { match: /^rice,\s*thai\s*5%/i, unit: 'mt' },
    fallback: { pricePerKgUsd: 0.42, pricePerKgXof: 252 },
  },
  {
    commodity: 'Groundnut/Peanut',
    commodityFr: 'Arachide',
    emoji: '🥜',
    indicators: ['PGNUTOIL', 'PGNUTS'],
    pinkSheet: { match: /^groundnuts?\b/i, unit: 'mt' },
    fallback: { pricePerKgUsd: 1.1, pricePerKgXof: 660 },
  },
  {
    commodity: 'Sorghum',
    commodityFr: 'Sorgho',
    emoji: '🌾',
    indicators: ['PSORGHMMT', 'PSORUM'],
    pinkSheet: { match: /^sorghum/i, unit: 'mt' },
    fallback: { pricePerKgUsd: 0.19, pricePerKgXof: 114 },
  },
];

/** Reference crops with no live feed — seed only if missing. */
const REFERENCE_SEEDS = [
  {
    commodity: 'Shea Butter',
    commodityFr: 'Karité',
    emoji: '🫙',
    pricePerKgUsd: 1.8,
    pricePerKgXof: 1080,
  },
  {
    commodity: 'Sesame',
    commodityFr: 'Sésame',
    emoji: '🌾',
    pricePerKgUsd: 1.4,
    pricePerKgXof: 840,
  },
  {
    commodity: 'Millet',
    commodityFr: 'Mil',
    emoji: '🌾',
    pricePerKgUsd: 0.18,
    pricePerKgXof: 108,
  },
  {
    commodity: 'Cowpea',
    commodityFr: 'Niébé',
    emoji: '🌱',
    pricePerKgUsd: 0.85,
    pricePerKgXof: 510,
  },
  {
    commodity: 'Cashew',
    commodityFr: 'Anacarde',
    emoji: '🥜',
    pricePerKgUsd: 2.2,
    pricePerKgXof: 1320,
  },
  {
    commodity: 'Mango',
    commodityFr: 'Mangue',
    emoji: '🥭',
    pricePerKgUsd: 0.35,
    pricePerKgXof: 210,
  },
  {
    commodity: 'Moringa',
    commodityFr: 'Moringa',
    emoji: '🌿',
    pricePerKgUsd: 3.5,
    pricePerKgXof: 2100,
  },
  {
    commodity: 'Fonio',
    commodityFr: 'Fonio',
    emoji: '🌾',
    pricePerKgUsd: 1.2,
    pricePerKgXof: 720,
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

async function fetchJson(url, timeoutMs = FETCH_TIMEOUT_MS) {
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
    const wbData = await fetchJson(wbDataUrl, FETCH_TIMEOUT_MS);
    const series = parseWorldBankSeries(wbData);
    if (series.length >= 1) return { series, source: 'World Bank', unit: 'mt' };
  } catch {
    /* next */
  }

  try {
    const wbIndUrl = `${WB_INDICATOR_BASE}${encodeURIComponent(code)}?format=json&mrnev=24`;
    const wbInd = await fetchJson(wbIndUrl, FETCH_TIMEOUT_MS);
    const series = parseWorldBankSeries(wbInd);
    if (series.length >= 1) return { series, source: 'World Bank', unit: 'mt' };
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
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
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

async function upsertLivePrice(entry, latestRaw, previousRaw, unit, sourceLabel) {
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
        sourceMarket: sourceLabel || 'World Bank',
        commodityFr: entry.commodityFr,
        emoji: entry.emoji,
      },
      $setOnInsert: { commodity: entry.commodity },
    },
    { upsert: true, new: true, runValidators: true }
  );

  return { commodity: entry.commodity, pricePerKgUsd, weeklyChangePercent, trend };
}

async function upsertStaticPrice(entry, sourceMarket) {
  const pricePerKgUsd = Number(entry.fallback?.pricePerKgUsd ?? entry.pricePerKgUsd);
  const pricePerKgXof =
    entry.fallback?.pricePerKgXof ??
    entry.pricePerKgXof ??
    Math.round(pricePerKgUsd * XOF_PER_USD);

  await CropPrice.findOneAndUpdate(
    { commodity: entry.commodity },
    {
      $set: {
        pricePerKgUsd,
        pricePerKgXof,
        weeklyChangePercent: 0,
        trend: 'stable',
        sourceMarket,
        commodityFr: entry.commodityFr,
        emoji: entry.emoji,
      },
      $setOnInsert: { commodity: entry.commodity },
    },
    { upsert: true, new: true, runValidators: true }
  );

  return {
    commodity: entry.commodity,
    pricePerKgUsd,
    pricePerKgXof,
    weeklyChangePercent: 0,
    trend: 'stable',
  };
}

/** Seed reference + feed fallbacks only when a CropPrice row is missing. */
export async function seedMissingCropPrices() {
  let seeded = 0;
  const catalog = [
    ...FEED_MAP.map((e) => ({
      commodity: e.commodity,
      commodityFr: e.commodityFr,
      emoji: e.emoji,
      pricePerKgUsd: e.fallback.pricePerKgUsd,
      pricePerKgXof: e.fallback.pricePerKgXof,
      sourceMarket: 'Référence',
    })),
    ...REFERENCE_SEEDS.map((e) => ({ ...e, sourceMarket: 'Référence' })),
  ];

  for (const entry of catalog) {
    const existing = await CropPrice.findOne({ commodity: entry.commodity }).lean();
    if (existing && num(existing.pricePerKgUsd) != null) continue;

    await CropPrice.findOneAndUpdate(
      { commodity: entry.commodity },
      {
        $set: {
          pricePerKgUsd: entry.pricePerKgUsd,
          pricePerKgXof: entry.pricePerKgXof,
          weeklyChangePercent: existing?.weeklyChangePercent ?? 0,
          trend: existing?.trend || 'stable',
          sourceMarket: existing?.sourceMarket || entry.sourceMarket,
          commodityFr: entry.commodityFr,
          emoji: entry.emoji,
        },
        $setOnInsert: { commodity: entry.commodity },
      },
      { upsert: true, new: true, runValidators: true }
    );
    seeded += 1;
  }

  return { seeded };
}

/**
 * Sync mapped commodities from live feeds into CropPrice.
 * Uses static fallbacks when feeds fail. Seeds missing reference crops.
 * @param {{ force?: boolean }} [opts]
 */
export async function syncCommodityPrices(opts = {}) {
  const force = Boolean(opts.force);

  if (!force && lastSyncAt && Date.now() - lastSyncAt.getTime() < CACHE_MS) {
    await seedMissingCropPrices();
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
    const seed = await seedMissingCropPrices();
    let synced = 0;
    let skipped = 0;
    const results = [];

    for (const entry of FEED_MAP) {
      try {
        const pair = await fetchLatestPair(entry);
        if (pair && pair.latest?.value != null) {
          const updated = await upsertLivePrice(
            entry,
            pair.latest.value,
            pair.previous?.value ?? null,
            pair.unit,
            pair.source
          );
          synced += 1;
          results.push({ ...updated, status: 'synced', feed: pair.code });
        } else {
          const updated = await upsertStaticPrice(entry, 'Référence');
          synced += 1;
          results.push({ ...updated, status: 'fallback', reason: 'no_live_data' });
        }
      } catch (err) {
        try {
          const updated = await upsertStaticPrice(entry, 'Référence');
          synced += 1;
          results.push({
            ...updated,
            status: 'fallback',
            reason: err?.message || 'error',
          });
        } catch (inner) {
          skipped += 1;
          results.push({
            commodity: entry.commodity,
            status: 'skipped',
            reason: inner?.message || err?.message || 'error',
          });
        }
      }
    }

    lastSyncAt = new Date();
    return {
      synced,
      skipped,
      seeded: seed.seeded,
      lastSyncAt,
      cached: false,
      results,
    };
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

/**
 * Kick off sync in the background and return immediately (for HTTP handlers).
 */
export function startCommodityPriceSync(opts = {}) {
  const startedAt = new Date();
  const promise = syncCommodityPrices({ force: Boolean(opts.force) })
    .then((r) => {
      console.log(
        `📈 Commodity prices sync done: synced=${r.synced} skipped=${r.skipped}${r.cached ? ' (cached)' : ''}`
      );
      return r;
    })
    .catch((e) => {
      console.warn('📈 Commodity price sync failed:', e.message);
      throw e;
    });

  return {
    status: 'sync started',
    lastSyncAt: lastSyncAt || startedAt,
    promise,
  };
}

export function getLastCommodityPriceSyncAt() {
  return lastSyncAt;
}

/** Normalize a CropPrice lean doc for API clients. */
export function serializeCropPrice(p) {
  if (!p) return null;
  const usd = num(p.pricePerKgUsd);
  const xof =
    num(p.pricePerKgXof) ?? (usd != null ? Math.round(usd * XOF_PER_USD) : null);
  return {
    _id: p._id,
    commodity: p.commodity,
    commodityFr: p.commodityFr || p.commodity,
    emoji: p.emoji || '🌾',
    pricePerKgUsd: usd,
    pricePerKgXof: xof,
    weeklyChangePercent: num(p.weeklyChangePercent) ?? 0,
    trend: p.trend || 'stable',
    sourceMarket: p.sourceMarket || 'Référence',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export default syncCommodityPrices;
