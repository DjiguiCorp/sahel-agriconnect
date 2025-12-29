import express from 'express';
import Certification from '../models/Certification.js';
import Farmer from '../models/Farmer.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCertification } from '../middleware/validation.js';

const router = express.Router();

// POST /api/certifications - Demande de certification (protégée admin)
router.post('/', authenticateToken, validateCertification, async (req, res) => {
  try {
    // Vérifier que l'agriculteur existe
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

// GET /api/certifications/:id - Détails d'une certification (protégée admin)
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

// PUT /api/certifications/:id - Mise à jour d'une certification (protégée admin)
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

// GET /api/certifications/stats/by-level - Statistiques par niveau (protégée admin)
router.get('/stats/by-level', authenticateToken, async (req, res) => {
  try {
    const stats = await Certification.aggregate([
      {
        $group: {
          _id: '$niveau',
          total: { $sum: 1 },
          conformes: {
            $sum: { $cond: [{ $eq: ['$statut', 'Conforme'] }, 1, 0] }
          },
          enInspection: {
            $sum: { $cond: [{ $eq: ['$statut', 'En inspection'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erreur statistiques certifications:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

export default router;

