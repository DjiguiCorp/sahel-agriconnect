import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import SupplyChainRecord from '../models/SupplyChainRecord.js';

const router = express.Router();

function genBatchNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `SAC-${year}-${rand}`;
}

async function genUniqueBatchNumber() {
  for (let i = 0; i < 5; i++) {
    const batchNumber = genBatchNumber();
    const exists = await SupplyChainRecord.exists({ batchNumber });
    if (!exists) return batchNumber;
  }
  return `SAC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

// POST /api/supplychain — create new batch record (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const batchNumber = await genUniqueBatchNumber();
    const doc = await SupplyChainRecord.create({
      batchNumber,
      commodity: req.body.commodity,
      farmerId: req.body.farmerId,
      farmerName: req.body.farmerName,
      farmerCountry: req.body.farmerCountry,
      farmerRegion: req.body.farmerRegion,
      cooperativeId: req.body.cooperativeId,
      cooperativeName: req.body.cooperativeName,
      processorId: req.body.processorId,
      processorName: req.body.processorName,
      harvestDate: req.body.harvestDate,
      processingDate: req.body.processingDate,
      quantityHarvestedKg: req.body.quantityHarvestedKg,
      quantityProcessedKg: req.body.quantityProcessedKg,
      certificationStatus: req.body.certificationStatus,
      qualityGrade: req.body.qualityGrade,
      buyerName: req.body.buyerName,
      buyerCountry: req.body.buyerCountry,
      exportDate: req.body.exportDate,
      exportValueUSD: req.body.exportValueUSD,
      status: req.body.status || 'harvest',
      documents: Array.isArray(req.body.documents) ? req.body.documents : [],
      adminNotes: req.body.adminNotes,
    });
    return res.status(201).json({ success: true, record: doc });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message || 'Create failed' });
  }
});

// GET /api/supplychain — return all records (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const records = await SupplyChainRecord.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, records });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/supplychain/batch/:batchNumber — public lookup for QR
router.get('/batch/:batchNumber', async (req, res) => {
  try {
    const batchNumber = String(req.params.batchNumber || '').trim();
    if (!batchNumber) return res.status(400).json({ success: false, error: 'batchNumber required' });
    const record = await SupplyChainRecord.findOne({ batchNumber }).lean();
    if (!record) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, record });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// PUT /api/supplychain/:id/status — update status (protected)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['harvest', 'processing', 'certified', 'sold', 'exported'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${allowed.join(', ')}` });
    }
    const updated = await SupplyChainRecord.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, record: updated });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message || 'Update failed' });
  }
});

// GET /api/supplychain/stats — count by status (protected)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const statuses = ['harvest', 'processing', 'certified', 'sold', 'exported'];
    const agg = await SupplyChainRecord.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = Object.fromEntries(statuses.map((s) => [s, 0]));
    for (const row of agg) byStatus[row._id] = row.count;
    return res.json({ success: true, byStatus });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;

