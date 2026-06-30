export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://toolnest-steel.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, mode } = req.body;

  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'No text provided' });
  if (text.length > 5000) return res.status(400).json({ error: 'Text too long. Max 5000 characters.' });

  const prompts = {
    paraphrase: `Paraphrase the following text. Keep the same meaning but use different words and sentence structures. Return only the rewritten text, no explanations:\n\n${text}`,
    formal: `Rewrite the following text in a formal, professional tone. Return only the rewritten text, no explanations:\n\n${text}`,
    casual: `Rewrite the following text in a casual, friendly, conversational tone. Return only the rewritten text, no explanations:\n\n${text}`,
    shorter: `Rewrite the following text in a shorter, more concise way while keeping the main points. Return only the rewritten text, no explanations:\n\n${text}`,
    longer: `Expand and elaborate the following text to make it longer and more detailed. Return only the rewritten text, no explanations:\n\n${text}`,
    grammar: `Fix all grammar, spelling, and punctuation errors in the following text. Keep the original meaning and style. Return only the corrected text, no explanations:\n\n${text}`,
  };

  const prompt = prompts[mode] || prompts.paraphrase;

  try {
    const HF_TOKEN = process.env.HF_TOKEN;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (response.status === 503) {
      return res.status(503).json({ error: 'AI model is loading, please try again in 20 seconds.' });
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error('HuggingFace API error: ' + err);
    }

    const data = await response.json();
    const raw = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!raw) throw new Error('No response from AI');

    const result = raw.replace(/<s>|<\/s>|\[INST\]|\[\/INST\]/g, '').trim();

    return res.status(200).json({ result });

  } catch (err) {
    console.error('HF error:', err.message);
    return res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}
