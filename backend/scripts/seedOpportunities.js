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

const RISK_EN =
  'Agricultural investments carry inherent risks including weather events, price volatility, and logistical challenges. Returns are projected and not guaranteed. Minimum holding period 12 months.';
const RISK_FR =
  'Les investissements agricoles comportent des risques inhérents incluant les aléas climatiques, la volatilité des prix et les défis logistiques. Les rendements sont prévisionnels et non garantis. Période de détention minimale 12 mois.';

const RISK = { en: RISK_EN, fr: RISK_FR };

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

/** Source records → Opportunity schema fields */
const SAMPLE_OPPORTUNITIES = [
  {
    centerName: 'Ségou Shea Collective',
    commodity: 'Shea Butter',
    track: 'Track A',
    expectedROIMin: 12,
    expectedROIMax: 18,
    minInvestment: 500,
    amountSought: 100000,
    amountRaised: 45000,
    status: 'active',
    region: 'Ségou, Mali',
    description:
      'Premium shea butter cooperative serving 145 women farmers in the Ségou region.',
    isDemoOpportunity: true,
    riskDisclosure: RISK,
    cooperativeId: null,
  },
  {
    centerName: 'Sikasso Sesame Alliance',
    commodity: 'Sesame',
    track: 'Track B',
    expectedROIMin: 10,
    expectedROIMax: 15,
    minInvestment: 500,
    amountSought: 75000,
    amountRaised: 28000,
    status: 'active',
    region: 'Sikasso, Mali',
    description:
      'Organic sesame export cooperative with EU buyer contracts secured.',
    isDemoOpportunity: true,
    riskDisclosure: RISK,
    cooperativeId: null,
  },
  {
    centerName: 'Mopti Cashew Network',
    commodity: 'Cashew',
    track: 'Track A',
    expectedROIMin: 15,
    expectedROIMax: 22,
    minInvestment: 1000,
    amountSought: 150000,
    amountRaised: 12000,
    status: 'active',
    region: 'Mopti, Mali',
    description:
      'Raw cashew processing collective supplying Asian markets directly.',
    isDemoOpportunity: true,
    riskDisclosure: RISK,
    cooperativeId: null,
  },
  {
    centerName: 'Kayes Millet Producers',
    commodity: 'Millet',
    track: 'Track B',
    expectedROIMin: 8,
    expectedROIMax: 13,
    minInvestment: 300,
    amountSought: 50000,
    amountRaised: 0,
    status: 'active',
    region: 'Kayes, Mali',
    description:
      'A network of smallholder millet farmers in the Kayes region organized under a certified cooperative structure. Millet is the primary food security crop of the Sahel and commands growing demand in regional food processing markets.',
    descriptionFr:
      'Un réseau de petits producteurs de mil dans la région de Kayes organisés sous une structure coopérative certifiée. Le mil est la principale culture de sécurité alimentaire du Sahel et bénéficie d’une demande croissante sur les marchés régionaux.',
    isDemoOpportunity: true,
    riskDisclosure: RISK,
    cooperativeId: null,
  },
  {
    centerName: 'Sikasso Sorghum Collective',
    commodity: 'Sorghum',
    track: 'Track A',
    expectedROIMin: 11,
    expectedROIMax: 16,
    minInvestment: 500,
    amountSought: 75000,
    amountRaised: 0,
    status: 'active',
    region: 'Sikasso, Mali',
    description:
      'An asset-backed sorghum cooperative in the fertile Sikasso corridor. Sorghum production is fully traceable on Sahel AgriConnect with harvest logs and ICS-verified supply chain documentation.',
    descriptionFr:
      'Une coopérative de sorgho adossée à des actifs dans le couloir fertile de Sikasso. La production de sorgho est entièrement traçable sur Sahel AgriConnect avec journaux de récolte et documentation de chaîne d’approvisionnement vérifiée ICS.',
    isDemoOpportunity: true,
    riskDisclosure: RISK,
    cooperativeId: null,
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
    track: row.track,
    expectedROIMin: row.expectedROIMin,
    expectedROIMax: row.expectedROIMax,
    minInvestment: row.minInvestment,
    amountSought: row.amountSought,
    amountRaised: row.amountRaised ?? 0,
    status: row.status,
    description: row.description,
    ...(row.descriptionFr ? { descriptionFr: row.descriptionFr } : {}),
    featured: true,
    verified: true,
    certificationStatus: 'Regional (ECOWAS)',
    currency: 'USD',
    isDemoOpportunity: true,
    riskDisclosure: row.riskDisclosure || RISK,
    cooperativeId: row.cooperativeId ?? null,
  };
}

async function main() {
  await mongoose.connect(uri);

  let inserted = 0;
  let updated = 0;

  for (const row of SAMPLE_OPPORTUNITIES) {
    const doc = toOpportunityDoc(row);
    const result = await Opportunity.findOneAndUpdate(
      { centerName: row.centerName },
      { $set: doc },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    // Detect insert vs update via prior existence is awkward with findOneAndUpdate;
    // use a second check on createdAt ≈ updatedAt for logging only.
    if (result) {
      const created = new Date(result.createdAt).getTime();
      const updatedAt = new Date(result.updatedAt).getTime();
      if (Math.abs(updatedAt - created) < 2000) inserted += 1;
      else updated += 1;
    }
  }

  const count = await Opportunity.countDocuments({
    centerName: { $in: SAMPLE_OPPORTUNITIES.map((o) => o.centerName) },
  });

  console.log(
    `✅ AfriYield opportunities seeded (${count} records; ~${inserted} new / ~${updated} updated)`
  );
  SAMPLE_OPPORTUNITIES.forEach((o) => {
    console.log(
      `   • ${o.centerName} — ${o.commodity}, ${o.track}, demo=${o.isDemoOpportunity}`
    );
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('Seed failed:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
