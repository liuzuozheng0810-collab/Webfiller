/**
 * 智能表单识别服务 - 增强版
 */
export const scanFormWithAI = async (targetUrl: string) => {
  // 1. 获取当前页面的部分关键 HTML (防止过长超过 Token 限制)
  // 提示：如果在本地测试，可以手动获取 document.body.innerHTML
  const htmlContent = document.body.innerHTML.substring(0, 20000); 

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `目标网址: ${targetUrl}`,
        htmlContent: htmlContent // 将真实的 HTML 传给 AI
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API 报错:", errorData);
      return [];
    }

    const data = await response.json();
    console.log("AI 识别结果:", data);
    return data;
  } catch (error) {
    console.error("请求失败:", error);
    return [];
  }
};