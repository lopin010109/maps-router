export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: '文字過長，請限制在 5000 字以內' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const prompt = `從以下文字中抽取所有台灣地址，以 JSON 陣列格式回傳，每個元素是一個完整地址字串（不含編號、項目符號等非地址文字）。只回傳 JSON 陣列，不要其他說明文字。\n\n文字：\n${text}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.json();
    return res.status(geminiRes.status).json({ error: err.error?.message || 'Gemini API error' });
  }

  const data = await geminiRes.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    return res.status(422).json({ error: 'AI 無法抽取地址，請確認文字中含有地址' });
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return res.status(422).json({ error: 'AI 回傳格式錯誤' });
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return res.status(422).json({ error: '找不到任何地址' });
  }

  return res.status(200).json({ addresses: parsed });
}
