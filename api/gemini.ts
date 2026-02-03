import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 验证方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // 在 Vercel 后台设置此变量

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  // 2. 构造请求 Google API 的 URL (使用 v1beta 版本的 JSON 模式)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
    });

    const data = await googleResponse.json();
    
    // 3. 提取并返回 AI 生成的 JSON 文本
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
      res.status(200).json(JSON.parse(content));
    } else {
      res.status(500).json({ error: 'AI output is empty' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to communicate with Gemini API' });
  }
}