export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: 'HF_TOKEN not set in environment variables' });

  const { text, mode } = req.body || {};
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'No text provided' });

  const prompts = {
    paraphrase: `Paraphrase this text, return only the rewritten text:\n\n${text}`,
    formal: `Rewrite in formal tone, return only the rewritten text:\n\n${text}`,
    casual: `Rewrite in casual tone, return only the rewritten text:\n\n${text}`,
    shorter: `Make this text shorter, return only the rewritten text:\n\n${text}`,
    longer: `Expand this text, return only the rewritten text:\n\n${text}`,
    grammar: `Fix grammar errors, return only the corrected text:\n\n${text}`,
  };

  const prompt = prompts[mode] || prompts.paraphrase;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(500).json({ error: `HF Error ${response.status}: ${responseText}` });
    }

    let data;
    try { data = JSON.parse(responseText); }
    catch(e) { return res.status(500).json({ error: 'Invalid JSON from HF: ' + responseText }); }

    const raw = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!raw) return res.status(500).json({ error: 'Empty response. Raw: ' + responseText });

    const result = raw.replace(/<s>|<\/s>|\[INST\]|\[\/INST\]/g, '').trim();
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: 'Fetch failed: ' + err.message });
  }
}
