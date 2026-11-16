import express from 'express';
import HarvestLog, { generateHarvestBatchId } from '../models/HarvestLog.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import { authFarmer } from '../middleware/auth.js';
import { authCoop } from './cooperatives.js';

const router = express.Router();

const INPUT_TYPES = new Set(['fertilizer', 'pesticide', 'organic', 'none']);
const GRADES = new Set(['A', 'B', 'C', 'ungraded']);

function normalizeInputs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const type = INPUT_TYPES.has(row?.type) ? row.type : 'none';
      const quantity =
        row?.quantity != null && row.quantity !== '' ? Number(row.quantity) : null;
      return {
        name: String(row?.name || '').trim(),
        type,
        quantity: Number.isFinite(quantity) ? quantity : null,
        unit: String(row?.unit || '').trim(),
      };
    })
    .filter((row) => row.name || row.type !== 'none' || row.quantity != null);
}

function normalizeGrade(g) {
  const s = String(g || 'ungraded').trim();
  if (GRADES.has(s)) return s;
  if (s === 'Non classé' || s.toLowerCase() === 'non classe') return 'ungraded';
  return 'ungraded';
}

async function uniqueBatchId() {
  for (let i = 0; i < 8; i++) {
    const batchId = generateHarvestBatchId();
    const exists = await HarvestLog.exists({ batchId });
    if (!exists) return batchId;
  }
  return `SAC-${new Date().getFullYear()}-${Date.now().toString(36).slice(-6)}`;
}

// POST /api/harvest-logs — farmer logs a harvest
router.post('/', authFarmer, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmerId).lean();
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });

    const cropType = String(req.body?.cropType || '').trim();
    const harvestDate = req.body?.harvestDate ? new Date(req.body.harvestDate) : null;
    const quantityKg = Number(req.body?.quantityKg);

    if (!cropType) {
      return res.status(400).json({ success: false, error: 'cropType required' });
    }
    if (!harvestDate || Number.isNaN(harvestDate.getTime())) {
      return res.status(400).json({ success: false, error: 'harvestDate required' });
    }
    if (!Number.isFinite(quantityKg) || quantityKg < 0) {
      return res.status(400).json({ success: false, error: 'quantityKg required' });
    }

    const cooperativeId =
      req.body?.cooperativeId || farmer.cooperativeId || undefined;

    const plotGps =
      req.body?.plotGps?.lat != null && req.body?.plotGps?.lng != null
        ? { lat: Number(req.body.plotGps.lat), lng: Number(req.body.plotGps.lng) }
        : farmer.latitude != null && farmer.longitude != null
          ? { lat: Number(farmer.latitude), lng: Number(farmer.longitude) }
          : undefined;

    const plotSizeHectares =
      req.body?.plotSizeHectares != null && req.body.plotSizeHectares !== ''
        ? Number(req.body.plotSizeHectares)
        : undefined;

    const batchId = await uniqueBatchId();
    const doc = await HarvestLog.create({
      farmerId: farmer._id,
      cooperativeId,
      cropType,
      plotGps,
      plotSizeHectares: Number.isFinite(plotSizeHectares) ? plotSizeHectares : undefined,
      harvestDate,
      quantityKg,
      inputs: normalizeInputs(req.body?.inputs),
      storageLocation: String(req.body?.storageLocation || '').trim(),
      qualityGrade: normalizeGrade(req.body?.qualityGrade),
      notes: String(req.body?.notes || '').trim(),
      batchId,
    });

    return res.status(201).json({ success: true, harvestLog: doc });
  } catch (e) {
    console.error('[harvest-logs] create error:', e.message);
    return res.status(400).json({ success: false, error: e.message || 'Create failed' });
  }
});

// GET /api/harvest-logs/my — farmer's own logs
router.get('/my', authFarmer, async (req, res) => {
  try {
    const logs = await HarvestLog.find({ farmerId: req.farmerId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, harvestLogs: logs });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/harvest-logs/cooperative/:cooperativeId — coop member logs
router.get('/cooperative/:cooperativeId', authCoop, async (req, res) => {
  try {
    const cooperativeId = String(req.params.cooperativeId || '').trim();
    if (String(req.coop._id) !== cooperativeId) {
      return res.status(403).json({ success: false, error: 'Not your cooperative' });
    }
    const logs = await HarvestLog.find({ cooperativeId })
      .populate('farmerId', 'nom telephone region country email')
      .sort({ createdAt: -1 })
      .lean();

    const harvestLogs = logs.map((l) => ({
      ...l,
      farmerName: l.farmerId?.nom || '',
      farmerRegion: l.farmerId?.region || '',
      farmer: l.farmerId
        ? {
            _id: l.farmerId._id,
            nom: l.farmerId.nom,
            region: l.farmerId.region,
          }
        : null,
    }));

    return res.json({ success: true, harvestLogs });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/harvest-logs/public/:batchId — public QR-safe payload
router.get('/public/:batchId', async (req, res) => {
  try {
    const batchId = String(req.params.batchId || '').trim();
    if (!batchId) {
      return res.status(400).json({ success: false, error: 'batchId required' });
    }
    const log = await HarvestLog.findOne({ batchId }).lean();
    if (!log) return res.status(404).json({ success: false, error: 'Not found' });

    let cooperativeName = '';
    let region = '';
    if (log.cooperativeId) {
      const coop = await CooperativePlatformRegistration.findById(log.cooperativeId)
        .select('cooperativeName regionCity country')
        .lean();
      cooperativeName = coop?.cooperativeName || '';
      region = coop?.regionCity || coop?.country || '';
    }
    if (!region && log.farmerId) {
      const farmer = await Farmer.findById(log.farmerId).select('region country').lean();
      region = farmer?.region || farmer?.country || '';
    }

    return res.json({
      success: true,
      batch: {
        batchId: log.batchId,
        cropType: log.cropType,
        cooperativeName,
        region,
        harvestDate: log.harvestDate,
        quantityKg: log.quantityKg,
        qualityGrade: log.qualityGrade,
        verifiedByCoop: Boolean(log.verifiedByCoop),
        verifiedAt: log.verifiedAt || null,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// PATCH /api/harvest-logs/:id/verify — coop verifies a batch
router.patch('/:id/verify', authCoop, async (req, res) => {
  try {
    const log = await HarvestLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Not found' });
    if (!log.cooperativeId || String(log.cooperativeId) !== String(req.coop._id)) {
      return res.status(403).json({ success: false, error: 'Not your cooperative batch' });
    }
    log.verifiedByCoop = true;
    log.verifiedAt = new Date();
    log.verifiedBy = req.coop.email || '';
    await log.save();
    return res.json({ success: true, harvestLog: log });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message || 'Verify failed' });
  }
});

export default router;
