import express from 'express';
import { createRequire } from 'module';
import Certification from '../models/Certification.js';
import CertificationProgramApplication from '../models/CertificationProgramApplication.js';
import Farmer from '../models/Farmer.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCertification } from '../middleware/validation.js';
import { queueNotification, messageTemplates } from '../services/notificationService.js';

const require = createRequire(import.meta.url);
const router = express.Router();

async function notifyAdminCertificationApplication(app) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  await resend.emails.send({
    from,
    to: 'info@djiguicorporation.org',
    subject: `Certification application — ${app.name} (${app.crop})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:20px;">
          <h1 style="color:#B5850A;margin:0;font-size:18px;">New certification application</h1>
        </div>
        <div style="padding:20px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:14px;">
          <p><strong>Type:</strong> ${app.applicantType}</p>
          <p><strong>Name:</strong> ${app.name}</p>
          <p><strong>Email:</strong> ${app.email}</p>
          <p><strong>Phone:</strong> ${app.phone || '—'}</p>
          <p><strong>Location:</strong> ${app.country} / ${app.region}</p>
          <p><strong>Crop:</strong> ${app.crop}</p>
          <p><strong>Hectares:</strong> ${app.totalHectares ?? '—'}</p>
          <p><strong>ID:</strong> ${app.farmerOrCooperativeId}</p>
          <p><strong>Transformation center:</strong> ${app.transformationCenterName || '—'}</p>
        </div>
      </div>
    `,
  });
}

router.post('/apply', async (req, res) => {
  try {
    const rawType = String(req.body.applicantType || '');
    const applicantType =
      rawType.includes('Cooperative') && !rawType.includes('Individual')
        ? 'Cooperative'
        : 'Individual';
    const transformationCenterName =
      req.body.transformationCenterName ||
      req.body.transformationCenterPartnerName ||
      '';
    if (applicantType === 'Individual' && !transformationCenterName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Transformation center name is required for individual applicants.',
      });
    }
    const totalHectares = Number(req.body.totalHectares);
    if (Number.isFinite(totalHectares) && totalHectares < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum 10 hectares required / Le minimum requis est de 10 hectares',
      });
    }
    const application = await CertificationProgramApplication.create({
      applicantType,
      name: req.body.name,
      country: req.body.country,
      region: req.body.region,
      crop: req.body.crop || req.body.cropType,
      totalHectares: Number.isFinite(totalHectares) ? totalHectares : undefined,
      farmerOrCooperativeId: req.body.farmerOrCooperativeId || req.body.applicantId,
      transformationCenterName: transformationCenterName.trim(),
      email: req.body.email,
      phone: req.body.phone || '',
    });
    queueNotification({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      message: messageTemplates.certificationReceived(req.body.name),
      source: 'certification_apply',
    }).catch(console.error);
    notifyAdminCertificationApplication(application).catch((err) =>
      console.error('[certifications/apply] admin email failed:', err.message)
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur candidature certification export:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de l enregistrement',
    });
  }
});

// POST /api/certifications - Demande de certification (protégée admin)
router.post('/', authenticateToken, validateCertification, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.body.farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Agriculteur non trouvé' });
    }

    const certificationData = {
      ...req.body,
      producteur: farmer.nom
    };

    const certification = new Certification(certificationData);
    await certification.save();

    res.status(201).json({
      success: true,
      message: 'Demande de certification créée avec succès',
      certification
    });
  } catch (error) {
    console.error('Erreur création certification:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la création',
      details: error.message
    });
  }
});

// GET /api/certifications - Liste des certifications (protégée admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { niveau, statut } = req.query;
    const query = {};

    if (niveau) query.niveau = niveau;
    if (statut) query.statut = statut;

    const certifications = await Certification.find(query)
      .populate('farmerId', 'nom telephone region')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      certifications
    });
  } catch (error) {
    console.error('Erreur récupération certifications:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

router.get('/stats/by-level', authenticateToken, async (req, res) => {
  try {
    const stats = await Certification.aggregate([
      {
        $group: {
          _id: '$niveau',
          total: { $sum: 1 },
          conformes: {
            $sum: { $cond: [{ $eq: ['$statut', 'Conforme'] }, 1, 0] },
          },
          enInspection: {
            $sum: { $cond: [{ $eq: ['$statut', 'En inspection'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Erreur statistiques certifications:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id)
      .populate('farmerId');

    if (!certification) {
      return res.status(404).json({ error: 'Certification non trouvée' });
    }

    res.json({
      success: true,
      certification
    });
  } catch (error) {
    console.error('Erreur récupération certification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { statut, conformite, notes, inspecteur } = req.body;

    const updateData = {};
    if (statut) updateData.statut = statut;
    if (conformite) updateData.conformite = conformite;
    if (notes !== undefined) updateData.notes = notes;
    if (inspecteur) updateData.inspecteur = inspecteur;
    if (statut === 'En inspection') {
      updateData.dateInspection = new Date();
    }

    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!certification) {
      return res.status(404).json({ error: 'Certification non trouvée' });
    }

    res.json({
      success: true,
      message: 'Certification mise à jour avec succès',
      certification
    });
  } catch (error) {
    console.error('Erreur mise à jour certification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

export default router;
