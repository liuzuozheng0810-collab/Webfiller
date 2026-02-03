
import React, { useState } from 'react';
import { AutomationTemplate, DataRow } from '../types';
import { generateNodeScript, generateFieldMapJson, generateFormDataJson, generateUserscript } from '../constants';

interface ScriptViewerProps {
  template: AutomationTemplate | null;
  data: DataRow[];
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ template, data }) => {
  const [exportType, setExportType] = useState<'node' | 'tampermonkey'>('node');
  const [activeFile, setActiveFile] = useState<'js' | 'data' | 'map'>('js');
  const [copied, setCopied] = useState(false);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800">请先配置录入模版</h3>
      </div>
    );
  }

  const nodeFiles = {
    js: { path: 'scripts/autoFill.js', content: generateNodeScript(template), lang: 'JavaScript' },
    data: { path: 'config/formData.json', content: generateFormDataJson(template, data), lang: 'JSON' },
    map: { path: 'config/fieldMap.json', content: generateFieldMapJson(template), lang: 'JSON' }
  };

  const userscriptContent = generateUserscript(template, data);

  const handleCopy = () => {
    const content = exportType === 'node' ? nodeFiles[activeFile].content : userscriptContent;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in zoom-in duration-300">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">生成自动化程序</h3>
            <p className="text-slate-500 text-sm">选择适合您的执行引擎导出代码</p>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setExportType('node')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${exportType === 'node' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-server mr-2"></i> Node.js 项目
            </button>
            <button 
              onClick={() => setExportType('tampermonkey')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${exportType === 'tampermonkey' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-plug mr-2"></i> 油猴脚本 (Tampermonkey)
            </button>
          </div>
        </div>

        {exportType === 'node' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 min-w-[240px]">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">项目目录结构</h4>
              <div className="font-mono text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2"><i className="fas fa-folder text-blue-400"></i> web-auto-input/</div>
                <div className="flex items-center gap-2 pl-4"><i className="fas fa-folder text-blue-400"></i> scripts/</div>
                <div className={`flex items-center gap-2 pl-8 cursor-pointer p-1 rounded transition-colors ${activeFile === 'js' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50'}`} onClick={() => setActiveFile('js')}>
                  <i className="fas fa-file-code"></i> autoFill.js
                </div>
                <div className="flex items-center gap-2 pl-4"><i className="fas fa-folder text-blue-400"></i> config/</div>
                <div className={`flex items-center gap-2 pl-8 cursor-pointer p-1 rounded transition-colors ${activeFile === 'data' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50'}`} onClick={() => setActiveFile('data')}>
                  <i className="fas fa-file-alt"></i> formData.json
                </div>
                <div className={`flex items-center gap-2 pl-8 cursor-pointer p-1 rounded transition-colors ${activeFile === 'map' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50'}`} onClick={() => setActiveFile('map')}>
                  <i className="fas fa-file-signature"></i> fieldMap.json
                </div>
              </div>
              <button 
                onClick={handleCopy}
                className={`w-full mt-6 py-2.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-800 text-white'}`}
              >
                复制当前文件内容
              </button>
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl p-6 relative group">
              <div className="absolute top-4 right-6 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                {nodeFiles[activeFile].path}
              </div>
              <pre className="text-slate-300 font-mono text-xs md:text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar">
                {nodeFiles[activeFile].content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fas fa-info-circle text-orange-500"></i>
                <span className="text-sm text-orange-700 font-medium">油猴脚本适合在浏览器内直接手动触发填充，数据已自动内嵌。</span>
              </div>
              <button 
                onClick={handleCopy}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-orange-600 text-white'}`}
              >
                {copied ? '已复制脚本' : '复制油猴源码'}
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 relative">
              <pre className="text-slate-300 font-mono text-xs md:text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar">
                {userscriptContent}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
        <div className="text-blue-500 text-xl mt-1"><i className="fas fa-lightbulb"></i></div>
        <div>
          <h4 className="font-bold text-blue-800">使用提示</h4>
          <p className="text-sm text-blue-700 mt-1 leading-relaxed">
            {exportType === 'node' 
              ? 'Node.js 引擎适合通过服务器或本地命令行进行多数据、跨页面的自动化处理。' 
              : '油猴引擎会在目标网页右侧显示一个蓝色面板，您可以随时点击任一记录进行即时填充，非常适合半自动办公场景。'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
