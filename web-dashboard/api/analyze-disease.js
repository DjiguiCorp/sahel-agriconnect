export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mediaType } = req.body;
  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: 'Missing image data' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mediaType,
                  data: imageBase64
                }
              },
              {
                text: `You are an expert agronomist specializing in plant diseases across Africa and globally.

Carefully analyze this plant image and identify:
1. The exact plant species or crop type you see
2. Any disease, pest damage, nutrient deficiency, or health issue visible
3. If the plant is healthy, say so clearly

Respond ONLY with this exact JSON, no other text:
{
  "disease_name": "Exact disease name or 'Healthy plant' if no disease found",
  "plant_type": "The actual plant species visible in the image",
  "confidence": 85,
  "symptoms": "Specific visible symptoms described from what you see",
  "treatment": "Practical treatment recommendation appropriate for West African farmers",
  "prevention": "Prevention measures",
  "is_healthy": false,
  "source": "gemini-vision"
}`
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Gemini error: ${JSON.stringify(data)}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse Gemini response');

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Disease analysis error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
