import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { prompt, htmlContent } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '服务器未配置 API Key' });
  }

  // 组合最终发送给 AI 的指令
  const finalPrompt = `
    你是一个资深的自动化测试工程师。
    我会给你一段网页的 HTML 源码，请分析其表单结构并识别关键输入字段。
    
    待分析 HTML:
    ${htmlContent}

    用户额外指令:
    ${prompt}

    请识别：输入框、下拉框、级联选择、文本域等。
  `;

  // 使用 Gemini 1.5 Flash (速度快且对 HTML 解析极佳)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          // 强制要求模型输出和你代码逻辑一致的 JSON 结构
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                selector: { type: "string" },
                type: { type: "string", enum: ["text", "textarea", "select", "ui-select", "cascade"] },
                required: { type: "boolean" },
                optionSelector: { type: "string" },
                cascadeSelectors: { type: "array", items: { type: "string" } }
              },
              required: ["label", "selector", "type", "required"]
            }
          }
        }
      }),
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (resultText) {
      res.status(200).json(JSON.parse(resultText));
    } else {
      res.status(500).json({ error: 'AI 未返回有效内容', raw: data });
    }
  } catch (error) {
    res.status(500).json({ error: '调用 Gemini API 失败' });
  }
}