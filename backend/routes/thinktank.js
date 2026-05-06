import express from 'express';

const router = express.Router();

function parseGeminiJson(text) {
  if (!text || typeof text !== 'string') throw new Error('Empty model response');
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  }
  const obj = JSON.parse(t);
  return obj;
}

async function callGeminiForThinkTank(prompt) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY not configured');
    err.status = 503;
    throw err;
  }

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('No text in Gemini response');
  return parseGeminiJson(raw);
}

// POST /api/thinktank/solve
router.post('/solve', async (req, res) => {
  try {
    const { problem, category, cropType, region, cooperativeMember } = req.body || {};
    const cooperativeMemberBool = Boolean(cooperativeMember);

    if (!problem || typeof problem !== 'string' || !problem.trim()) {
      return res.status(400).json({ error: 'problem is required' });
    }

    const safeCategory = String(category || 'general');
    const safeCrop = String(cropType || 'Non précisé');
    const safeRegion = String(region || 'Non précisée');

    const prompt = `You are an expert agronomist specializing in West African and pan-African agriculture, with deep knowledge of shea butter, sesame, and staple crops. A farmer has a problem.

Problem category: ${safeCategory}
Specific problem: ${problem.trim()}
Crop type: ${safeCrop}
Region: ${safeRegion}
Cooperative member: ${cooperativeMemberBool}

Provide a practical, actionable solution in the same language the problem was described in (French or English). Structure your response as JSON:
{
  "summary": "One sentence diagnosis",
  "urgency": "immediate|within_week|seasonal",
  "solution": "Detailed explanation of the solution",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "inputs": ["Required input 1", "Required input 2"],
  "cooperativeBenefit": "How being part of a cooperative makes this easier to solve — access to shared equipment, collective purchasing of inputs, technician visits, etc.",
  "additionalSupport": {
    "available": true,
    "description": "What additional expert support is available through the platform",
    "cooperativeOnly": true
  }
}
Respond ONLY with JSON.

If cooperativeMember is false, always include a note in cooperativeBenefit explaining that joining a cooperative gives faster access to solutions`;

    const parsed = await callGeminiForThinkTank(prompt);

    let cooperativeBenefit = String(parsed.cooperativeBenefit || '').trim();
    if (!cooperativeMemberBool) {
      const note =
        ' Note : rejoindre une coopérative permet souvent un accès plus rapide aux solutions, à des intrants mutualisés et aux visites de techniciens.';
      const low = cooperativeBenefit.toLowerCase();
      if (!/(rejoindre|joining).*coop/.test(low) && !/acc[eè]s plus rapide/.test(low)) {
        cooperativeBenefit = cooperativeBenefit ? `${cooperativeBenefit}${note}` : note.trim();
      } else if (!cooperativeBenefit) {
        cooperativeBenefit = note.trim();
      }
    }

    const followUpOptions = [
      { id: 'technician', label: 'Demander une visite de technicien', cooperativeOnly: true, action: 'contact' },
      { id: 'expert', label: 'Contacter un expert', cooperativeOnly: false, action: 'contact' },
    ];

    return res.json({
      success: true,
      summary: parsed.summary || '',
      solution: parsed.solution || '',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      inputs: Array.isArray(parsed.inputs) ? parsed.inputs : [],
      cooperativeBenefit,
      urgency: parsed.urgency === 'immediate' || parsed.urgency === 'within_week' || parsed.urgency === 'seasonal'
        ? parsed.urgency
        : 'seasonal',
      additionalSupport: parsed.additionalSupport && typeof parsed.additionalSupport === 'object'
        ? parsed.additionalSupport
        : { available: true, description: '', cooperativeOnly: cooperativeMemberBool },
      followUpOptions,
    });
  } catch (e) {
    console.error('thinktank/solve:', e);
    const status = e.status || (e.message?.includes('JSON') ? 502 : 500);
    res.status(status).json({
      success: false,
      error: e.message || 'Could not generate solution',
    });
  }
});

export default router;
