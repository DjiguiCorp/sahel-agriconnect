import express from 'express';
import ProduceListing from '../models/ProduceListing.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function farmerProduceFilter(identifier) {
  const key = String(decodeURIComponent(identifier || '')).trim();
  const emailLower = key.toLowerCase();
  return { $or: [{ farmerPhone: key }, { farmerEmail: emailLower }] };
}

router.get('/stats/farmer/:phone', async (req, res) => {
  try {
    const listings = await ProduceListing.find(farmerProduceFilter(req.params.phone));
    const totalListings = listings.length;
    const activeListings = listings.filter((l) => l.status === 'active').length;
    const totalEarnings = listings.reduce((s, l) => s + (l.totalEarningsUSD || 0), 0);
    const totalKgListed = listings.reduce((s, l) => s + (l.quantityKg || 0), 0);
    const totalViews = listings.reduce((s, l) => s + (l.viewCount || 0), 0);
    const totalInquiries = listings.reduce((s, l) => s + (l.inquiryCount || 0), 0);
    res.json({ totalListings, activeListings, totalEarnings, totalKgListed, totalViews, totalInquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/farmer/:phone', async (req, res) => {
  try {
    const listings = await ProduceListing.find(farmerProduceFilter(req.params.phone)).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cooperative/:name', authenticateToken, async (req, res) => {
  try {
    const listings = await ProduceListing.find({
      cooperativeName: new RegExp(escapeRegex(req.params.name), 'i'),
      listingType: 'cooperative_supply',
    }).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const listings = await ProduceListing.find({}).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { country, commodity, certLevel, minQty } = req.query;
    const filter = {
      status: 'active',
      visibility: 'marketplace',
      cooperativeApproved: true,
      promotedToMarketplace: true,
    };
    if (country) filter.country = country;
    if (commodity) filter.commodity = new RegExp(escapeRegex(commodity), 'i');
    if (certLevel) filter.certificationLevel = certLevel;
    if (minQty) filter.quantityKg = { $gte: Number(minQty) };
    const listings = await ProduceListing.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const listing = await ProduceListing.create(req.body);
    res.status(201).json({ success: true, listing });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/promote', authenticateToken, async (req, res) => {
  try {
    const listing = await ProduceListing.findByIdAndUpdate(
      req.params.id,
      {
        cooperativeApproved: true,
        cooperativeApprovedAt: new Date(),
        promotedToMarketplace: true,
        promotedAt: new Date(),
        visibility: 'marketplace',
      },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const listing = await ProduceListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
