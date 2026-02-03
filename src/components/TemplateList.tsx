
import React from 'react';
import { AutomationTemplate } from '../types';

interface TemplateListProps {
  templates: AutomationTemplate[];
  onEdit: (template: AutomationTemplate) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onCreate: () => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onEdit, 
  onDelete, 
  onSelect, 
  selectedId, 
  onCreate 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">模版库</h3>
          <p className="text-slate-500 text-sm">管理您的录入流程模版</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 font-semibold"
        >
          <i className="fas fa-plus"></i>
          创建新模版
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div 
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`group cursor-pointer relative rounded-2xl p-6 transition-all border-2 ${selectedId === template.id ? 'border-blue-500 bg-white shadow-xl shadow-blue-500/5' : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-slate-200'}`}
          >
            {selectedId === template.id && (
              <div className="absolute top-4 right-4 text-blue-500">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
            )}
            
            <div className="mb-4 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              <i className="fas fa-file-invoice text-2xl"></i>
            </div>
            
            <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{template.name}</h4>
            <p className="text-[10px] text-slate-400 font-mono truncate mb-4">{template.targetUrl || '未配置网址'}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {template.fields.length} 个字段
              </span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <i className="fas fa-folder-open text-5xl mb-4 opacity-20"></i>
            <p className="text-lg font-medium">暂无模版</p>
            <p className="text-sm">点击上方按钮创建您的第一个自动化配置</p>
          </div>
        )}
      </div>
    </div>
  );
};
