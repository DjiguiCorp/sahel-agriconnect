import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Opportunity from '../models/Opportunity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGO_URI or MONGODB_URI in backend/.env');
  process.exit(1);
}

const TRACK_MAP = {
  A: 'Track A',
  B: 'Track B',
  C: 'Track C',
};

function parseRegion(region) {
  const parts = String(region || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      location: parts.slice(0, -1).join(', '),
      country: parts[parts.length - 1],
    };
  }
  return { location: region || 'Mali', country: 'Mali' };
}

/** Source records (user field names) → Opportunity schema */
const SAMPLE_OPPORTUNITIES = [
  {
    centerName: 'Ségou Shea Collective',
    commodity: 'Shea Butter',
    track: 'A',
    expectedROIPercent: 15,
    expectedROIMin: 12,
    expectedROIMax: 18,
    minimumInvestmentUSD: 500,
    amountTarget: 100000,
    amountFunded: 45000,
    status: 'active',
    region: 'Ségou, Mali',
    description:
      'Premium shea butter cooperative serving 145 women farmers in the Ségou region.',
  },
  {
    centerName: 'Sikasso Sesame Alliance',
    commodity: 'Sesame',
    track: 'B',
    expectedROIPercent: 12,
    expectedROIMin: 10,
    expectedROIMax: 15,
    minimumInvestmentUSD: 500,
    amountTarget: 75000,
    amountFunded: 28000,
    status: 'active',
    region: 'Sikasso, Mali',
    description:
      'Organic sesame export cooperative with EU buyer contracts secured.',
  },
  {
    centerName: 'Mopti Cashew Network',
    commodity: 'Cashew',
    track: 'A',
    expectedROIPercent: 18,
    expectedROIMin: 15,
    expectedROIMax: 22,
    minimumInvestmentUSD: 1000,
    amountTarget: 150000,
    amountFunded: 12000,
    status: 'active',
    region: 'Mopti, Mali',
    description:
      'Raw cashew processing collective supplying Asian markets directly.',
  },
];

function toOpportunityDoc(row) {
  const { location, country } = parseRegion(row.region);
  return {
    centerName: row.centerName,
    location,
    country,
    region: row.region,
    commodity: row.commodity,
    commodities: [row.commodity],
    track: TRACK_MAP[row.track] || row.track,
    expectedROIMin: row.expectedROIMin,
    expectedROIMax: row.expectedROIMax,
    minInvestment: row.minimumInvestmentUSD,
    amountSought: row.amountTarget,
    amountRaised: row.amountFunded,
    status: row.status,
    description: row.description,
    featured: true,
    verified: true,
    certificationStatus: 'Regional (ECOWAS)',
    currency: 'USD',
  };
}

async function main() {
  await mongoose.connect(uri);

  let inserted = 0;
  let updated = 0;

  for (const row of SAMPLE_OPPORTUNITIES) {
    const doc = toOpportunityDoc(row);
    const result = await Opportunity.updateOne(
      { centerName: row.centerName },
      { $set: doc },
      { upsert: true, runValidators: true }
    );
    if (result.upsertedCount) inserted += 1;
    else if (result.modifiedCount) updated += 1;
  }

  const count = await Opportunity.countDocuments({
    centerName: { $in: SAMPLE_OPPORTUNITIES.map((o) => o.centerName) },
  });

  console.log(`✅ AfriYield opportunities seeded (${count} records: ${inserted} new, ${updated} updated)`);
  SAMPLE_OPPORTUNITIES.forEach((o) => {
    console.log(`   • ${o.centerName} — ${o.commodity}, Track ${o.track}, ${o.expectedROIPercent}% ROI`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('Seed failed:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
