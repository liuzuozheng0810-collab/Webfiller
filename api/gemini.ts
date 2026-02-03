import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 设置允许跨域（防止本地开发干扰）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. 打印诊断信息（这些信息会在 Vercel Logs 中显示）
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Checking API Key exists:", !!apiKey);
  
  if (!apiKey) {
    return res.status(500).json({ error: "环境变量 GEMINI_API_KEY 未找到，请检查 Vercel 设置" });
  }

  try {
    const { prompt, htmlContent } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `分析以下HTML表单结构: \n${htmlContent} \n指令: ${prompt}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    const data = await googleResponse.json();

    // 3. 如果 Google API 报错（如 Key 无效、地区不支持），直接返回详细信息
    if (!googleResponse.ok) {
      console.error("Google API Error Payload:", JSON.stringify(data));
      return res.status(googleResponse.status).json({
        error: "Google API 拒绝了请求",
        status: googleResponse.status,
        detail: data
      });
    }

    // 4. 安全地检查返回结构，防止读取 undefined 导致 500
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content) {
      return res.status(200).json({ error: "AI 未能识别内容或被安全过滤", raw: data });
    }

    const resultText = candidate.content.parts?.[0]?.text || "[]";
    return res.status(200).json(JSON.parse(resultText));

  } catch (error: any) {
    console.error("Critical Function Error:", error.message);
    return res.status(500).json({ 
      error: '服务器执行崩溃', 
      message: error.message 
    });
  }
}