/**
 * Analyse maladies — ordre : API Vercel (Anthropic) → Plant.id → simulation locale.
 */

/**
 * @param {string} base64Data - sans préfixe data:
 * @param {string} mediaType ex: image/jpeg
 * @returns {Promise<{disease_name:string,confidence:number,symptoms:string,treatment:string,prevention:string,source:string}>}
 */
export async function analyzeDiseaseImage(file) {
  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(',')[1];
  const mediaType = file.type || 'image/jpeg';

  // 1) Route serveur Vercel (Anthropic côté serveur — pas d’exposition de clé)
  try {
    const r = await fetch('/api/analyze-disease', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j?.disease_name) {
        return { ...j, source: j.source || 'anthropic' };
      }
    }
  } catch {
    /* dev local sans fonction serverless */
  }

  // 2) Plant.id — identification (clé gratuite limitée)
  const plantKey = import.meta.env.VITE_PLANT_ID_API_KEY;
  if (plantKey) {
    try {
      const res = await fetch('https://api.plant.id/v3/identification', {
        method: 'POST',
        headers: {
          'Api-Key': plantKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [base64],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return mapPlantIdIdentification(data);
      }
    } catch {
      /* continue */
    }
  }

  // 3) Anthropic direct (peut échouer CORS en navigateur — documenté)
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const out = await callAnthropicDirect(base64, mediaType, anthropicKey);
      if (out) return { ...out, source: 'anthropic-direct' };
    } catch {
      /* CORS ou erreur */
    }
  }

  return { ...mockSahelAnalysis(file), source: 'simulation' };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function callAnthropicDirect(base64, mediaType, apiKey) {
  const system = `Tu es un agronome expert des maladies des cultures en Afrique de l'Ouest et au-delà. Réponds UNIQUEMENT en JSON valide: {"disease_name":"","confidence":0-100,"symptoms":"","treatment":"","prevention":""} en français.`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: "Diagnostique la maladie visible sur cette image de culture en Afrique de l'Ouest ou contexte tropical sec.",
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) return null;
  const parsed = parseJsonLoose(text);
  if (!parsed?.disease_name) return null;
  return normalizeResult(parsed);
}

function mapPlantIdIdentification(data) {
  const top =
    data?.result?.classification?.suggestions?.[0] ||
    data?.suggestions?.[0] ||
    data?.results?.[0]?.classification?.suggestions?.[0];
  if (!top) {
    return {
      disease_name: 'Plante non identifiée',
      confidence: 45,
      symptoms: 'Image floue ou espèce hors base ; refaire une photo nette du feuillage.',
      treatment: 'Consulter un agronome avec échantillons.',
      prevention: 'Bonnes pratiques de désinfection des outils entre parcelles.',
      source: 'plant.id',
    };
  }
  const name = top.name || top.plant_name || 'Espèce';
  const rawProb = top.probability ?? top.confidence ?? 0.55;
  const prob01 = rawProb > 1 ? rawProb / 100 : rawProb;
  return {
    disease_name: `Identification Plant.id : ${typeof name === 'string' ? name : name.name || 'Plante'}`,
    confidence: Math.round(Math.min(99, Math.max(35, prob01 * 100))),
    symptoms:
      'Analyse fournie par identification automatique ; croiser avec observations au champ (taches, moisissures, insectes).',
    treatment:
      'Si symptômes de maladie : traitement ciblé après diagnostic terrain. Sinon entretenir irrigation et nutrition.',
    prevention: 'Rotation, variétés adaptées à votre zone climatique, éviter l’excès d’humidité sur le feuillage.',
    source: 'plant.id',
  };
}

function parseJsonLoose(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function normalizeResult(p) {
  return {
    disease_name: String(p.disease_name || 'Maladie'),
    confidence: Math.min(100, Math.max(0, Number(p.confidence) || 70)),
    symptoms: String(p.symptoms || ''),
    treatment: String(p.treatment || ''),
    prevention: String(p.prevention || ''),
  };
}

function mockSahelAnalysis(file) {
  const hash = (file.name + file.size).split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
  const pool = [
    {
      disease_name: 'Rouille du sorgho (Puccinia)',
      confidence: 68 + (Math.abs(hash) % 25),
      symptoms: 'Pustules orangées sur le limbe, dessèchement progressif des feuilles.',
      treatment: 'Fongicide à base de triazole si seuil dépassé ; retirer les résidus infectés.',
      prevention: 'Variétés résistantes et rotation avec légumineuses.',
    },
    {
      disease_name: 'Mildiou foliaire (céréale / légumineuse)',
      confidence: 62 + (Math.abs(hash) % 28),
      symptoms: 'Taches chlorotiques puis nécroses, humidité sur le feuillage.',
      treatment: 'Réduire l’humidité du couvert ; traitement fongique préventif si conditions favorables.',
      prevention: 'Bon drainage, semis espacés, éviter l’arrosage sur feuillage en soirée.',
    },
    {
      disease_name: 'Carence en azote (symptômes foliaires)',
      confidence: 55 + (Math.abs(hash) % 30),
      symptoms: 'Jaunissement uniforme des feuilles basales, croissance ralentie.',
      treatment: 'Apport d’azote organique (compost) ou engrais adapté au sol.',
      prevention: 'Rotation avec niébé, fumure organique régulière.',
    },
  ];
  const pick = pool[Math.abs(hash) % pool.length];
  return { ...pick, confidence: Math.min(95, Math.max(45, pick.confidence)) };
}
