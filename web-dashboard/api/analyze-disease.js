/**
 * Vercel Serverless — Anthropic Claude (clé serveur ANTHROPIC_API_KEY, jamais VITE_*).
 * En local (`vite`), cette route n’existe pas : le front retombe sur Plant.id ou simulation.
 */

const SYSTEM = `Tu es un agronome expert des maladies des cultures en Afrique de l'Ouest et au-delà.
Réponds UNIQUEMENT en JSON valide, sans markdown, avec:
{"disease_name":"string","confidence":nombre 0-100,"symptoms":"string","treatment":"string","prevention":"string"}
Texte en français, concis.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY manquant côté serveur' });
  }

  const { imageBase64, mediaType = 'image/jpeg' } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 requis' });
  }

  try {
    const out = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: "Diagnostique la maladie ou le problème visible sur cette plante cultivée en Afrique de l'Ouest ou climat tropical sec.",
              },
            ],
          },
        ],
      }),
    });

    if (!out.ok) {
      const errText = await out.text();
      return res.status(502).json({ error: 'Anthropic', detail: errText.slice(0, 200) });
    }

    const data = await out.json();
    const text = data?.content?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: 'Réponse vide' });
    }

    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return res.status(502).json({ error: 'JSON introuvable dans la réponse' });
    }

    const parsed = JSON.parse(m[0]);
    return res.status(200).json({
      disease_name: String(parsed.disease_name || 'Non identifié'),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 70)),
      symptoms: String(parsed.symptoms || ''),
      treatment: String(parsed.treatment || ''),
      prevention: String(parsed.prevention || ''),
      source: 'anthropic',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
}
