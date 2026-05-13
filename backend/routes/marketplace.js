import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import QuoteRequest from '../models/QuoteRequest.js';
import Opportunity from '../models/Opportunity.js';
import ProduceListing from '../models/ProduceListing.js';
import CropPrice from '../models/CropPrice.js';
import { buildPilotListings } from '../lib/pilotMarketplaceListings.js';

const router = express.Router();

// GET /api/marketplace/listings — produce rows for marketplace cards (public)
router.get('/listings', async (req, res) => {
  try {
    const listings = await ProduceListing.find({
      status: 'active',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
    })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      listings: listings.map((l) => ({
        _id: l._id,
        commodity: l.commodity,
        commodityFr: l.commodityFr || '',
        cooperative: l.cooperativeName,
        country: l.country,
        region: l.region,
        quantityKg: l.quantityKg,
        pricePerKgUsd: l.pricePerKgUSD,
        certification: String(l.certificationLevel || 'Local').toLowerCase(),
        emoji: l.emoji || '🌾',
        qualityGrade: l.qualityGrade,
        farmerCount: l.farmerCount ?? 0,
        description: l.description,
        descriptionFr: l.descriptionFr || '',
        status: l.status,
        harvestDate: l.harvestDate,
        availableFrom: l.availableFrom,
        availableUntil: l.availableUntil,
      })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/marketplace/prices — weekly reference crop prices (public)
router.get('/prices', async (req, res) => {
  try {
    const prices = await CropPrice.find().sort({ commodity: 1 }).lean();
    if (prices.length === 0) {
      return res.json({
        success: true,
        prices: _defaultPrices(),
        updatedAt: new Date(),
      });
    }
    return res.json({
      success: true,
      prices,
      updatedAt: prices[0]?.updatedAt,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /api/marketplace/prices/:commodity — admin only
router.put('/prices/:commodity', authenticateToken, async (req, res) => {
  try {
    const { pricePerKgUsd, pricePerKgXof, weeklyChangePercent, trend, sourceMarket, commodityFr, emoji } =
      req.body || {};
    if (pricePerKgUsd == null || pricePerKgUsd === '' || Number.isNaN(Number(pricePerKgUsd))) {
      return res.status(400).json({ success: false, error: 'pricePerKgUsd required' });
    }
    const commodityName = decodeURIComponent(req.params.commodity);
    const set = {
      pricePerKgUsd: Number(pricePerKgUsd),
      weeklyChangePercent:
        weeklyChangePercent != null && weeklyChangePercent !== ''
          ? Number(weeklyChangePercent)
          : 0,
      trend: trend || 'stable',
      sourceMarket: sourceMarket || '',
      updatedAt: new Date(),
    };
    if (pricePerKgXof != null && pricePerKgXof !== '') set.pricePerKgXof = Number(pricePerKgXof);
    if (commodityFr != null) set.commodityFr = commodityFr;
    if (emoji != null) set.emoji = emoji;

    const price = await CropPrice.findOneAndUpdate(
      { commodity: commodityName },
      { $set: set, $setOnInsert: { commodity: commodityName } },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json({ success: true, price });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

function _defaultPrices() {
  return [
    {
      commodity: 'Shea Butter',
      commodityFr: 'Beurre de Karité',
      emoji: '🫙',
      pricePerKgUsd: 3.8,
      pricePerKgXof: 2356,
      weeklyChangePercent: 2.1,
      trend: 'up',
      sourceMarket: 'Bamako',
    },
    {
      commodity: 'Sesame',
      commodityFr: 'Sésame',
      emoji: '🌾',
      pricePerKgUsd: 1.45,
      pricePerKgXof: 898,
      weeklyChangePercent: -0.8,
      trend: 'down',
      sourceMarket: 'Ouagadougou',
    },
    {
      commodity: 'Cashew',
      commodityFr: 'Noix de Cajou',
      emoji: '🥜',
      pricePerKgUsd: 2.1,
      pricePerKgXof: 1302,
      weeklyChangePercent: 0,
      trend: 'stable',
      sourceMarket: 'Sikasso',
    },
    {
      commodity: 'Mango',
      commodityFr: 'Mangue',
      emoji: '🥭',
      pricePerKgUsd: 0.65,
      pricePerKgXof: 403,
      weeklyChangePercent: -1.2,
      trend: 'down',
      sourceMarket: 'Bobo-Dioulasso',
    },
    {
      commodity: 'Moringa',
      commodityFr: 'Moringa',
      emoji: '🌿',
      pricePerKgUsd: 6.2,
      pricePerKgXof: 3844,
      weeklyChangePercent: 3.5,
      trend: 'up',
      sourceMarket: 'Niamey',
    },
    {
      commodity: 'Cotton',
      commodityFr: 'Coton',
      emoji: '☁️',
      pricePerKgUsd: 0.88,
      pricePerKgXof: 546,
      weeklyChangePercent: 0.5,
      trend: 'up',
      sourceMarket: 'Bamako',
    },
  ];
}

// POST /api/marketplace/seed-pilot — one-time populate (header X-Seed-Key = MARKETPLACE_SEED_KEY)
router.post('/seed-pilot', async (req, res) => {
  try {
    const key = req.headers['x-seed-key'];
    if (!process.env.MARKETPLACE_SEED_KEY || key !== process.env.MARKETPLACE_SEED_KEY) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const existing = await ProduceListing.countDocuments({ pilotSeed: true });
    if (existing > 0) {
      return res.json({ success: true, skipped: true, message: 'Pilot listings already present' });
    }
    const now = new Date();
    const listings = buildPilotListings(now);
    await ProduceListing.insertMany(listings);
    return res.json({ success: true, inserted: listings.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// POST /api/marketplace/seed-pilot-admin — same as seed-pilot, requires admin JWT (dashboard)
router.post('/seed-pilot-admin', authenticateToken, async (req, res) => {
  try {
    const existing = await ProduceListing.countDocuments({ pilotSeed: true });
    if (existing > 0) {
      return res.json({ success: true, skipped: true, message: 'Pilot listings already present' });
    }
    const now = new Date();
    const listings = buildPilotListings(now);
    await ProduceListing.insertMany(listings);
    return res.json({ success: true, inserted: listings.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// POST /api/marketplace/quote-request (public)
// Body: { opportunityId, buyerName, companyName, email, phone, productWanted, quantityKg, deliveryCountry, message }
router.post('/quote-request', async (req, res) => {
  try {
    const {
      opportunityId,
      buyerName,
      companyName,
      email,
      phone,
      productWanted,
      quantityKg,
      deliveryCountry,
      message,
    } = req.body || {};

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    if (opportunityId && !String(opportunityId).match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid opportunityId' });
    }

    if (opportunityId) {
      const exists = await Opportunity.exists({ _id: opportunityId });
      if (!exists) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    await QuoteRequest.create({
      opportunityId: opportunityId || undefined,
      buyerName: buyerName || '',
      companyName: companyName || '',
      email: String(email).trim().toLowerCase(),
      phone: phone || '',
      productWanted: productWanted || '',
      quantityKg: quantityKg != null && quantityKg !== '' ? Number(quantityKg) : undefined,
      deliveryCountry: deliveryCountry || '',
      message: message || '',
    });

    return res.status(201).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/marketplace/quote-requests (protected)
router.get('/quote-requests', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const quoteRequests = await QuoteRequest.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, quoteRequests });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;

