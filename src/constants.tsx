
import { AutomationTemplate, FieldType, FormField } from './types';

export const mockTemplates: AutomationTemplate[] = [
  {
    id: 't1',
    name: '企业政务录入系统',
    targetUrl: 'https://example-gov.com/form',
    createdAt: Date.now(),
    fields: [
      { id: 'f1', label: '企业名称', selector: 'input[placeholder="请输入企业全称"]', type: FieldType.TEXT, required: true },
      { id: 'f2', label: '所属行业', selector: '.el-select', optionSelector: '.el-select-dropdown__item', type: FieldType.UI_SELECT, required: true },
      { id: 'f3', label: '行政区域', selector: '.el-cascader', cascadeSelectors: ['.el-cascader-node', '.el-cascader-node', '.el-cascader-node'], type: FieldType.CASCADE, required: true },
      { id: 'f4', label: '详细地址', selector: 'textarea#address', type: FieldType.TEXTAREA, required: false }
    ]
  }
];

export const generateFieldMapJson = (template: AutomationTemplate) => {
  const map: Record<string, any> = {};
  template.fields.forEach(f => {
    map[f.label] = {
      type: f.type,
      selector: f.selector,
      optionSelector: f.optionSelector || null,
      cascadeSelectors: f.cascadeSelectors || null,
      required: f.required
    };
  });
  return JSON.stringify(map, null, 2);
};

export const generateFormDataJson = (template: AutomationTemplate, data: any[]) => {
  const exportData = data.length > 0 ? data.map(({id, ...rest}) => rest) : [
    template.fields.reduce((acc, f) => {
      if (f.type === FieldType.CASCADE) {
        acc[f.label] = "浙江省,杭州市,西湖区";
      } else {
        acc[f.label] = `示例${f.label}`;
      }
      return acc;
    }, {} as any)
  ];
  return JSON.stringify(exportData, null, 2);
};

/**
 * 生成油猴脚本 (Userscript)
 */
export const generateUserscript = (template: AutomationTemplate, data: any[]) => {
  const dataJson = generateFormDataJson(template, data);
  const mapJson = generateFieldMapJson(template);

  return `// ==UserScript==
// @name         女娲录入助手 - ${template.name}
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动填充 ${template.name} 表单数据
// @author       WebAutoFill Architect
// @match        ${template.targetUrl}*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const DATASET = ${dataJson};
    const FIELD_MAP = ${mapJson};

    // 样式注入
    const style = document.createElement('style');
    style.innerHTML = \`
        #nvwa-panel {
            position: fixed; top: 20px; right: 20px; width: 220px;
            background: #09090b; border: 1px solid #27272a; border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); z-index: 999999;
            font-family: system-ui, -apple-system, sans-serif; color: #f4f4f5; padding: 16px;
        }
        .nvwa-title { font-size: 12px; font-weight: 900; color: #3b82f6; margin-bottom: 12px; letter-spacing: 1px; }
        .nvwa-btn {
            width: 100%; padding: 10px; background: #3b82f6; border: none; border-radius: 8px;
            color: white; font-weight: bold; cursor: pointer; margin-bottom: 8px; font-size: 13px;
        }
        .nvwa-btn:hover { background: #2563eb; }
        .nvwa-info { font-size: 11px; color: #71717a; text-align: center; }
        .nvwa-row { font-size: 12px; padding: 6px; border-bottom: 1px solid #18181b; cursor: pointer; display: flex; justify-content: space-between; }
        .nvwa-row:hover { background: #18181b; }
    \`;
    document.head.appendChild(style);

    // 构建界面
    const panel = document.createElement('div');
    panel.id = 'nvwa-panel';
    panel.innerHTML = \`
        <div class="nvwa-title">女娲 · 自动录入助手</div>
        <div id="nvwa-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 12px;"></div>
        <div class="nvwa-info">点击上方记录开始录入</div>
    \`;
    document.body.appendChild(panel);

    const listContainer = panel.querySelector('#nvwa-list');
    DATASET.forEach((row, index) => {
        const item = document.createElement('div');
        item.className = 'nvwa-row';
        item.innerHTML = \`<span>记录 #\${index + 1}</span> <span style="color: #3b82f6">→ 填充</span>\`;
        item.onclick = () => fillForm(row);
        listContainer.appendChild(item);
    });

    // 核心填充逻辑 (兼容 Element UI / AntD)
    async function fillForm(data) {
        console.log('[女娲] 开始填充...', data);
        for (const [label, value] of Object.entries(data)) {
            const config = FIELD_MAP[label];
            if (!config) continue;

            try {
                const el = document.querySelector(config.selector);
                if (!el) {
                    console.warn(\`未找到选择器: \${config.selector}\`);
                    continue;
                }

                el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (config.type === 'ui-select') {
                    el.click();
                    await new Promise(r => setTimeout(r, 500));
                    const options = document.querySelectorAll(config.optionSelector || '.el-select-dropdown__item');
                    for (let opt of options) {
                        if (opt.textContent.trim() === String(value)) {
                            opt.click();
                            break;
                        }
                    }
                } else if (config.type === 'cascade') {
                    const levels = String(value).split(/[,，>]/).map(s => s.trim());
                    el.click();
                    await new Promise(r => setTimeout(r, 500));
                    for (let level = 0; level < levels.length; level++) {
                        const cascadeItems = document.querySelectorAll('.el-cascader-node, .ant-cascader-menu-item');
                        for (let item of cascadeItems) {
                            if (item.textContent.trim() === levels[level]) {
                                item.click();
                                await new Promise(r => setTimeout(r, 400));
                                break;
                            }
                        }
                    }
                } else {
                    // 普通输入
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.value = value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            } catch (e) {
                console.error(\`填充 \${label} 失败:\`, e);
            }
        }
        alert('填充完成，请检查后提交！');
    }
})();`;
};

export const generateNodeScript = (template: AutomationTemplate) => {
  return `
/**
 * web-auto-input/scripts/autoFill.js
 * 核心驱动程序 - 支持 Element UI / AntD 级联与下拉
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 颜色日志工具
const log = {
  info: (m) => console.log(\`\\x1b[36m[信息]\\x1b[0m \${m}\`),
  success: (m) => console.log(\`\\x1b[32m[成功]\\x1b[0m \${m}\`),
  warn: (m) => console.log(\`\\x1b[33m[警告]\\x1b[0m \${m}\`),
  error: (m) => console.log(\`\\x1b[31m[错误]\\x1b[0m \${m}\`)
};

async function autoFill() {
  const configDir = path.join(__dirname, '../config');
  
  // 1. 读取配置文件
  let formData, fieldMap;
  try {
    formData = JSON.parse(fs.readFileSync(path.join(configDir, 'formData.json'), 'utf8'));
    fieldMap = JSON.parse(fs.readFileSync(path.join(configDir, 'fieldMap.json'), 'utf8'));
    log.success('配置文件加载成功');
  } catch (err) {
    log.error('加载 JSON 配置失败，请检查 config/ 目录下的文件。');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  for (let i = 0; i < formData.length; i++) {
    const record = formData[i];
    log.info(\`--- 开始录入第 \${i + 1} 条记录 ---\`);

    try {
      await page.goto('${template.targetUrl}', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');

      for (const [fieldName, value] of Object.entries(record)) {
        const config = fieldMap[fieldName];
        if (!config) {
          log.warn(\`字段 [\${fieldName}] 在 fieldMap 中未定义，跳过\`);
          continue;
        }

        log.info(\`正在处理: \${fieldName} -> \${value}\`);
        
        try {
          const locator = page.locator(config.selector).first();
          await locator.scrollIntoViewIfNeeded();
          
          // 根据类型执行不同操作
          switch (config.type) {
            case 'text':
            case 'textarea':
              await locator.fill(String(value));
              break;

            case 'select':
              await locator.selectOption({ label: String(value) });
              break;

            case 'ui-select':
              await locator.click({ force: true });
              const optionSelector = config.optionSelector || '.el-select-dropdown__item, .ant-select-item-option';
              await page.locator(optionSelector).filter({ hasText: String(value) }).first().click();
              break;

            case 'cascade':
              const levels = String(value).split(/[,，>]/).map(s => s.trim());
              await locator.click({ force: true });
              for (let level = 0; level < levels.length; level++) {
                const stepSelector = config.cascadeSelectors?.[level] || '.el-cascader-node, .ant-cascader-menu-item';
                const targetOption = page.locator(stepSelector).filter({ hasText: levels[level] }).first();
                await targetOption.waitFor({ state: 'visible' });
                await targetOption.click();
              }
              break;

            case 'checkbox':
            case 'radio':
              if (['true', '1', '是', 'yes'].includes(String(value).toLowerCase())) {
                await locator.check();
              }
              break;
              
            default:
              log.warn(\`未知字段类型: \${config.type}\`);
          }
          log.success(\`字段 [\${fieldName}] 录入成功\`);
        } catch (fieldErr) {
          log.error(\`字段 [\${fieldName}] 录入失败: \${fieldErr.message}\`);
        }
      }

      log.info('本条记录录入完毕。请在浏览器检查。');
      log.info('在终端按 [回车/ENTER] 继续录入下一条，或按 Ctrl+C 退出...');
      await new Promise(res => process.stdin.once('data', res));

    } catch (recordErr) {
      log.error(\`记录执行发生严重异常: \${recordErr.message}\`);
    }
  }

  log.success('全部自动化录入任务完成！');
}

autoFill();
`;
};
