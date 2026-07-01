export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  const { text, mode } = req.body || {};
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'No text provided' });

  const prompts = {
    paraphrase: `Paraphrase the following text. Return only the rewritten text, nothing else:\n\n${text}`,
    formal: `Rewrite in a formal professional tone. Return only the rewritten text, nothing else:\n\n${text}`,
    casual: `Rewrite in a casual friendly tone. Return only the rewritten text, nothing else:\n\n${text}`,
    shorter: `Make this text shorter and concise. Return only the rewritten text, nothing else:\n\n${text}`,
    longer: `Expand this text with more detail. Return only the rewritten text, nothing else:\n\n${text}`,
    grammar: `Fix all grammar and spelling errors. Return only the corrected text, nothing else:\n\n${text}`,
  };

  const prompt = prompts[mode] || prompts.paraphrase;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || 'Groq API error' });
    }

    const result = data?.choices?.[0]?.message?.content?.trim();
    if (!result) return res.status(500).json({ error: 'Empty response from AI' });

    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: 'Request failed: ' + err.message });
  }
}
