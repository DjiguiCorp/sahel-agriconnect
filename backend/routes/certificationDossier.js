import express from 'express';
import { authCoop } from './cooperatives.js';
import { generateDossierPDF } from '../services/certificationDossierService.js';

const router = express.Router();

/**
 * GET /api/certification-dossier/generate?lang=fr|en
 * Growth cooperatives only — streams a certification dossier PDF.
 */
router.get('/generate', authCoop, async (req, res) => {
  try {
    if (req.coop.tier !== 'growth') {
      return res.status(403).json({
        error:
          'Certification dossier is available on the Growth plan only / Dossier disponible avec le plan Croissance uniquement',
      });
    }

    const lang = String(req.query.lang || 'fr').toLowerCase() === 'en' ? 'en' : 'fr';
    const { doc, filename } = await generateDossierPDF(req.coop._id, lang);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.on('error', (err) => {
      console.error('certification-dossier pdf stream:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'PDF generation failed' });
      } else {
        res.end();
      }
    });

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error('certification-dossier/generate:', err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || 'Failed to generate certification dossier',
      });
    }
  }
});

export default router;
