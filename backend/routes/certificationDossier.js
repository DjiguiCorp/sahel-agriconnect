import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authCoop } from './cooperatives.js';
import { generateDossierPDF } from '../services/certificationDossierService.js';

const router = express.Router();

function streamPdf(res, doc, filename) {
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
}

/**
 * GET /api/certification-dossier/admin/generate/:cooperativeId?lang=fr|en
 * Admin: any cooperative, no Growth plan check. Does not auto-compute missing ICS.
 */
router.get('/admin/generate/:cooperativeId', authenticateToken, async (req, res) => {
  try {
    const lang = String(req.query.lang || 'fr').toLowerCase() === 'en' ? 'en' : 'fr';
    const { doc, filename } = await generateDossierPDF(req.params.cooperativeId, lang, {
      computeIcsIfMissing: false,
      filenamePrefix: 'dossier',
    });
    streamPdf(res, doc, filename);
  } catch (err) {
    console.error('certification-dossier/admin/generate:', err);
    if (!res.headersSent) {
      const status = err.status || 500;
      res.status(status).json({
        error:
          status === 404
            ? 'Cooperative not found'
            : err.message || 'Failed to generate certification dossier',
      });
    }
  }
});

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
    streamPdf(res, doc, filename);
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
