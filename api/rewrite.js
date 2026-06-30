export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://toolnest-steel.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, mode } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided' });
  }

  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text too long. Max 5000 characters.' });
  }

  const prompts = {
    paraphrase: `Paraphrase the following text. Keep the same meaning but use different words and sentence structures. Return only the rewritten text, nothing else:\n\n${text}`,
    formal: `Rewrite the following text in a formal, professional tone. Return only the rewritten text, nothing else:\n\n${text}`,
    casual: `Rewrite the following text in a casual, friendly, conversational tone. Return only the rewritten text, nothing else:\n\n${text}`,
    shorter: `Rewrite the following text in a shorter, more concise way while keeping the main points. Return only the rewritten text, nothing else:\n\n${text}`,
    longer: `Expand and elaborate the following text to make it longer and more detailed. Return only the rewritten text, nothing else:\n\n${text}`,
    grammar: `Fix all grammar, spelling, and punctuation errors in the following text. Keep the original meaning and style. Return only the corrected text, nothing else:\n\n${text}`,
  };

  const prompt = prompts[mode] || prompts.paraphrase;

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) throw new Error('No response from AI');

    return res.status(200).json({ result });

  } catch (err) {
    console.error('Gemini error:', err.message);
    return res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
