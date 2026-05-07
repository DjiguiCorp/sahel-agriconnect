import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import DiasporaProducer from '../models/DiasporaProducer.js';
import DiasporaBuyer from '../models/DiasporaBuyer.js';
import DiasporaContactInquiry from '../models/DiasporaContactInquiry.js';

const router = express.Router();

// POST /api/diaspora/producers — public
router.post('/producers', async (req, res) => {
  try {
    const payload = {
      fullName: req.body.fullName,
      cooperativeName: req.body.cooperativeName,
      country: req.body.country,
      region: req.body.region,
      products: req.body.products,
      monthlyVolumeKg: req.body.monthlyVolumeKg,
      certification: req.body.certification,
      email: req.body.email,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      exportExperience: req.body.exportExperience
    };

    const producer = new DiasporaProducer(payload);
    await producer.save();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur création producteur diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement' });
  }
});

// GET /api/diaspora/producers — public, only active
router.get('/producers', async (req, res) => {
  try {
    const producers = await DiasporaProducer.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, producers });
  } catch (error) {
    console.error('Erreur liste producteurs diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/diaspora/producers/all — protected
router.get('/producers/all', authenticateToken, async (req, res) => {
  try {
    const producers = await DiasporaProducer.find({}).sort({ createdAt: -1 });
    res.json({ success: true, producers });
  } catch (error) {
    console.error('Erreur liste tous producteurs diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// PUT /api/diaspora/producers/:id/status — protected
router.put('/producers/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'verified', 'active', 'inactive'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const producer = await DiasporaProducer.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!producer) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    res.json({ success: true, producer });
  } catch (error) {
    console.error('Erreur update statut producteur diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// POST /api/diaspora/buyers — public
router.post('/buyers', async (req, res) => {
  try {
    const payload = {
      fullName: req.body.fullName,
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      cityState: req.body.cityState,
      country: req.body.country,
      productsSought: req.body.productsSought,
      monthlyVolumeNeededKg: req.body.monthlyVolumeNeededKg,
      email: req.body.email,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      importExperience: req.body.importExperience,
      certificationRequired: req.body.certificationRequired
    };

    const buyer = new DiasporaBuyer(payload);
    await buyer.save();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur création acheteur diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement' });
  }
});

// GET /api/diaspora/buyers — protected
router.get('/buyers', authenticateToken, async (req, res) => {
  try {
    const buyers = await DiasporaBuyer.find({}).sort({ createdAt: -1 });
    res.json({ success: true, buyers });
  } catch (error) {
    console.error('Erreur liste acheteurs diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// POST /api/diaspora/contact/:producerId — public
router.post('/contact/:producerId', async (req, res) => {
  try {
    const { producerId } = req.params;
    const { contactName, contactEmail, contactPhone, message } = req.body || {};

    if (!contactName?.trim() || !contactPhone?.trim()) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }

    const producerExists = await DiasporaProducer.exists({ _id: producerId });
    if (!producerExists) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    const inquiry = new DiasporaContactInquiry({
      contactName: contactName.trim(),
      contactEmail: contactEmail?.trim() || undefined,
      contactPhone: contactPhone.trim(),
      message: message?.trim() || undefined,
      producerId
    });

    await inquiry.save();
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur création contact inquiry diaspora:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'envoi' });
  }
});

export default router;

