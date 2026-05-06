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

function clampScore(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

async function callGeminiAPI(prompt) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data.candidates[0].content.parts[0].text;
}

async function callGeminiJson(prompt) {
  const raw = await callGeminiAPI(prompt);
  return JSON.parse(stripJsonFences(raw));
}

// POST /api/soil/diagnose
// Body: { soilColor, texture, humidity, country, region, season, lastCrop }
// Returns: { score, rating, recommendedCrops, fertilizers, amendments, warnings, cooperativeBenefit }
router.post('/diagnose', async (req, res) => {
  try {
    const { soilColor, texture, humidity, country, region, season, lastCrop } = req.body || {};

    if (!soilColor || !texture || !humidity || !country || !region || !season || !lastCrop) {
      return res.status(400).json({
        error:
          'Missing required fields: soilColor, texture, humidity, country, region, season, lastCrop',
      });
    }

    const prompt = `You are an expert agronomist for West and pan-African agriculture. Analyze this soil profile:
- Color: ${soilColor}
- Texture: ${texture}
- Humidity: ${humidity}
- Country/Region: ${country}, ${region}
- Season: ${season}
- Last crop grown: ${lastCrop}

Respond ONLY with JSON:
{
  "score": 0-100,
  "rating": "Excellent|Bon|Moyen|Faible",
  "summary": "One sentence soil health summary",
  "recommendedCrops": ["crop1", "crop2", "crop3"],
  "sheaCompatible": true/false,
  "sesameCompatible": true/false,
  "fertilizers": ["recommendation 1", "recommendation 2"],
  "amendments": ["amendment 1", "amendment 2"],
  "warnings": ["warning if any"],
  "cooperativeBenefit": "How cooperative membership helps with soil improvement — group purchasing of fertilizers, shared irrigation, technician access"
}`;

    const out = await callGeminiJson(prompt);

    const score = clampScore(Number(out?.score));
    const rating = ['Excellent', 'Bon', 'Moyen', 'Faible'].includes(out?.rating)
      ? out.rating
      : 'Moyen';

    res.json({
      success: true,
      score,
      rating,
      summary: typeof out?.summary === 'string' ? out.summary : '',
      recommendedCrops: Array.isArray(out?.recommendedCrops) ? out.recommendedCrops : [],
      sheaCompatible: Boolean(out?.sheaCompatible),
      sesameCompatible: Boolean(out?.sesameCompatible),
      fertilizers: Array.isArray(out?.fertilizers) ? out.fertilizers : [],
      amendments: Array.isArray(out?.amendments) ? out.amendments : [],
      warnings: Array.isArray(out?.warnings) ? out.warnings : [],
      cooperativeBenefit: typeof out?.cooperativeBenefit === 'string' ? out.cooperativeBenefit : '',
    });
  } catch (e) {
    console.error('soil/diagnose:', e);
    const status = e.status || (String(e.message || '').includes('JSON') ? 502 : 500);
    res.status(status).json({ success: false, error: e.message || 'Could not diagnose soil' });
  }
});

export default router;

