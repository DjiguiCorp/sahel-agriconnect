import express from 'express';

const router = express.Router();

function stripJsonFences(text) {
  if (!text || typeof text !== 'string') return '';
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  }
  return t;
}

/**
 * POST /api/disease/analyze
 * Body: { imageBase64, mediaType, lang? }
 * Gemini Vision plant disease analysis — bilingual FR/EN.
 */
router.post('/analyze', async (req, res) => {
  try {
    const imageBase64 = String(req.body?.imageBase64 || '').replace(/^data:[^;]+;base64,/, '');
    const mediaType = String(req.body?.mediaType || 'image/jpeg');
    const lang = String(req.body?.lang || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Missing imageBase64' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

    const langInstruction =
      lang === 'en'
        ? 'Write disease_name, symptoms, treatment, and prevention in English.'
        : 'Écris disease_name, symptoms, treatment et prevention en français.';

    const prompt = `You are an expert agronomist specializing in plant diseases across West Africa and globally.

Carefully analyze this plant image and identify:
1. The plant species or crop type
2. Any disease, pest damage, nutrient deficiency, or health issue
3. If healthy, say so clearly

${langInstruction}

Respond ONLY with this exact JSON:
{
  "disease_name": "Exact disease name or Healthy plant / Plante saine",
  "plant_type": "Crop/species visible",
  "confidence": 85,
  "symptoms": "Visible symptoms",
  "treatment": "Practical treatment for Sahel/West African farmers",
  "prevention": "Prevention tips",
  "is_healthy": false,
  "source": "gemini-vision"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType, data: imageBase64 } },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Gemini error: ${JSON.stringify(data)}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(stripJsonFences(text.match(/\{[\s\S]*\}/)?.[0] || text));

    return res.json({
      success: true,
      disease_name: parsed.disease_name || (lang === 'en' ? 'Unknown' : 'Inconnu'),
      plant_type: parsed.plant_type || '',
      confidence: Number(parsed.confidence) || 0,
      symptoms: parsed.symptoms || '',
      treatment: parsed.treatment || '',
      prevention: parsed.prevention || '',
      is_healthy: Boolean(parsed.is_healthy),
      source: 'gemini-vision',
      lang,
    });
  } catch (e) {
    console.error('disease/analyze:', e.message);
    return res.status(500).json({ success: false, error: e.message || 'Analysis failed' });
  }
});

export default router;
