import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProduceListing from '../models/ProduceListing.js';

dotenv.config();

function buildPilotListings(now) {
  return [
    {
      cooperativeName: 'Coopérative Féminine de Sikasso',
      country: 'Mali',
      region: 'Sikasso',
      commodity: 'Shea Butter',
      commodityFr: 'Beurre de Karité',
      quantityKg: 5000,
      pricePerKgUSD: 3.8,
      certificationLevel: 'Local',
      harvestDate: new Date('2025-11-01'),
      availableFrom: now,
      status: 'active',
      qualityGrade: 'A',
      emoji: '🫙',
      farmerCount: 42,
      description:
        'Cold-pressed unrefined shea butter. Fair trade certified. Packed in food-grade drums.',
      descriptionFr:
        'Beurre de karité non raffiné pressé à froid. Certifié commerce équitable.',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
      cooperativeApprovedAt: now,
      promotedAt: now,
      pilotSeed: true,
    },
    {
      cooperativeName: 'Coopérative Agricole du Sahel',
      country: 'Burkina Faso',
      region: 'Centre-Nord',
      commodity: 'Sesame',
      commodityFr: 'Sésame',
      quantityKg: 12000,
      pricePerKgUSD: 1.45,
      certificationLevel: 'Regional',
      harvestDate: new Date('2025-10-15'),
      availableFrom: now,
      status: 'active',
      qualityGrade: 'A',
      emoji: '🌾',
      farmerCount: 87,
      description:
        'White sesame seeds, natural. ECOWAS quality standard certified. Ready for export.',
      descriptionFr:
        'Graines de sésame blanc naturel. Certifié normes qualité CEDEAO.',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
      cooperativeApprovedAt: now,
      promotedAt: now,
      pilotSeed: true,
    },
    {
      cooperativeName: 'Union des Producteurs de Cajou',
      country: 'Mali',
      region: 'Kayes',
      commodity: 'Cashew',
      commodityFr: 'Noix de Cajou',
      quantityKg: 8500,
      pricePerKgUSD: 2.1,
      certificationLevel: 'Local',
      harvestDate: new Date('2025-04-01'),
      availableFrom: now,
      status: 'active',
      qualityGrade: 'B',
      emoji: '🥜',
      farmerCount: 63,
      description:
        'Raw cashew nuts W240 grade. Traceability lot QR available. Packed in jute bags.',
      descriptionFr:
        'Noix de cajou brutes grade W240. Lot traçabilité QR disponible.',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
      cooperativeApprovedAt: now,
      promotedAt: now,
      pilotSeed: true,
    },
    {
      cooperativeName: 'Centre de Transformation de Bobo',
      country: 'Burkina Faso',
      region: 'Hauts-Bassins',
      commodity: 'Mango',
      commodityFr: 'Mangue Séchée',
      quantityKg: 2200,
      pricePerKgUSD: 4.5,
      certificationLevel: 'International',
      harvestDate: new Date('2025-05-01'),
      availableFrom: now,
      status: 'active',
      qualityGrade: 'A',
      emoji: '🥭',
      farmerCount: 28,
      description:
        'Dried mango slices, no sugar added. EU organic certification pending. Cold chain maintained.',
      descriptionFr:
        'Tranches de mangue séchée, sans sucre ajouté. Certification bio UE en cours.',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
      cooperativeApprovedAt: now,
      promotedAt: now,
      pilotSeed: true,
    },
    {
      cooperativeName: 'Coopérative Verte du Niger',
      country: 'Niger',
      region: 'Dosso',
      commodity: 'Moringa',
      commodityFr: 'Feuilles de Moringa',
      quantityKg: 800,
      pricePerKgUSD: 6.2,
      certificationLevel: 'Local',
      harvestDate: new Date('2025-09-01'),
      availableFrom: now,
      status: 'active',
      qualityGrade: 'A',
      emoji: '🌿',
      farmerCount: 19,
      description:
        'Dried moringa leaf powder. High protein, micronutrient dense. Food and supplement markets.',
      descriptionFr:
        'Poudre de feuilles de moringa séchées. Riche en protéines et micronutriments.',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
      cooperativeApprovedAt: now,
      promotedAt: now,
      pilotSeed: true,
    },
  ];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
