import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProduceListing from '../models/ProduceListing.js';
import { buildPilotListings } from '../lib/pilotMarketplaceListings.js';

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGO_URI or MONGODB_URI');
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  const existing = await ProduceListing.countDocuments({ pilotSeed: true });
  if (existing > 0) {
    console.log(`Skipping — ${existing} pilot listing(s) already exist`);
    await mongoose.disconnect();
    process.exit(0);
  }
  const now = new Date();
  const listings = buildPilotListings(now);
  await ProduceListing.insertMany(listings);
  console.log(`✅ Seeded ${listings.length} marketplace listings`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
