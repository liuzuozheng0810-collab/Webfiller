import { FieldType } from "../types";

/**
 * 智能表单识别服务 - 前端转发版
 */
export const scanFormWithAI = async (targetUrl: string) => {
  const prompt = `你是一个资深的自动化测试工程师。请深度分析这个网页的表单结构：${targetUrl}。
  你的任务是识别出所有关键输入字段。
  
  特别要求：
  1. 识别常见的 UI 框架组件（如 Element UI 的 .el-select, .el-cascader 或 Ant Design 的对应组件）。
  2. 对于下拉框，请提供 optionSelector（如 .el-select-dropdown__item）。
  3. 对于级联选择器，请提供各层级的选择器（如 .el-cascader-node）。
  4. 识别输入框的 ID、Name、Placeholder 或 ARIA Label。

  请严格返回如下格式的 JSON 数组：
  [{
    "label": "字段显示名称",
    "selector": "CSS 选择器",
    "type": "text | textarea | select | ui-select | cascade",
    "required": true/false,
    "optionSelector": "如果是 ui-select 则必填",
    "cascadeSelectors": ["层级1", "层级2"]
  }]`;

  try {
    // 请求 Vercel 后端函数，路径为 /api/gemini
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI 识别请求失败:", error);
    return [];
  }
};