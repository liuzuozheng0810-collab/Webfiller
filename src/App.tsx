
import React, { useState } from 'react';
import { TemplateList } from './components/TemplateList';
import { TemplateEditor } from './components/TemplateEditor';
import { DataManager } from './components/DataManager';
import { ScriptViewer } from './components/ScriptViewer';
import { AutomationTemplate, DataRow } from './types';
import { mockTemplates } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'data' | 'script'>('templates');
  const [templates, setTemplates] = useState<AutomationTemplate[]>(mockTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templates[0]?.id || null);
  const [editingTemplate, setEditingTemplate] = useState<AutomationTemplate | null>(null);
  const [taskData, setTaskData] = useState<DataRow[]>([]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;

  const handleSaveTemplate = (template: AutomationTemplate) => {
    setTemplates(prev => {
      const exists = prev.find(t => t.id === template.id);
      if (exists) {
        return prev.map(t => t.id === template.id ? template : t);
      }
      return [...prev, template];
    });
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  };

  const tabNames = {
    templates: '模版中心',
    data: '数据录入',
    script: '导出脚本'
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fas fa-robot text-xl"></i>
            </div>
            <div>
              <h1 className="text-white font-bold leading-none">AutoFill</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">网页自动化架构师</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'templates' ? 'bg-slate-800 text-white shadow-inner' : 'hover:bg-slate-800/50 hover:text-white'}`}
          >
            <i className="fas fa-layer-group"></i>
            <span className="font-medium">模版管理</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'data' ? 'bg-slate-800 text-white shadow-inner' : 'hover:bg-slate-800/50 hover:text-white'}`}
          >
            <i className="fas fa-table"></i>
            <span className="font-medium">批量数据</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'script' ? 'bg-slate-800 text-white shadow-inner' : 'hover:bg-slate-800/50 hover:text-white'}`}
          >
            <i className="fas fa-code"></i>
            <span className="font-medium">生成 Playwright</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] flex flex-col gap-2">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">当前模版:</p>
            <p className="text-blue-400 font-medium truncate">{selectedTemplate?.name || '未选择'}</p>
          </div>
          <div className="text-slate-500 text-center py-2">
            版本 v1.2.0 (AI 增强版)
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* 页眉 */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-800 font-semibold text-lg">{tabNames[activeTab]}</h2>
            {selectedTemplate && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">
                {selectedTemplate.fields.length} 个字段
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-sm font-medium">
              <i className="fas fa-cog"></i>
              系统设置
            </button>
          </div>
        </header>

        {/* 内容视图 */}
        <div className="p-8 max-w-6xl mx-auto w-full flex-1">
          {activeTab === 'templates' && (
            <div className="space-y-6">
              {editingTemplate ? (
                <TemplateEditor 
                  template={editingTemplate} 
                  onSave={handleSaveTemplate} 
                  onCancel={() => setEditingTemplate(null)} 
                />
              ) : (
                <TemplateList 
                  templates={templates} 
                  onEdit={setEditingTemplate} 
                  onDelete={handleDeleteTemplate} 
                  onSelect={setSelectedTemplateId}
                  selectedId={selectedTemplateId}
                  onCreate={() => setEditingTemplate({
                    id: Math.random().toString(36).substr(2, 9),
                    name: '新自动化模版',
                    targetUrl: '',
                    fields: [],
                    createdAt: Date.now()
                  })}
                />
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <DataManager 
              template={selectedTemplate} 
              data={taskData}
              setData={setTaskData}
            />
          )}

          {activeTab === 'script' && (
            <ScriptViewer 
              template={selectedTemplate} 
              data={taskData}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
