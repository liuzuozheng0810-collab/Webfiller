
import React, { useState } from 'react';
import { AutomationTemplate, FormField, FieldType } from '../types';
import { scanFormWithAI } from '../services/geminiService';

interface TemplateEditorProps {
  template: AutomationTemplate;
  onSave: (template: AutomationTemplate) => void;
  onCancel: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AutomationTemplate>({ ...template });
  const [isAiScanning, setIsAiScanning] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      label: '新字段',
      selector: '',
      type: FieldType.TEXT,
      required: true
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const removeField = (id: string) => {
    setFormData({ ...formData, fields: formData.fields.filter(f => f.id !== id) });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormData({
      ...formData,
      fields: formData.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  const handleAiScan = async () => {
    if (!formData.targetUrl) {
      alert("请先输入目标网址");
      return;
    }

    setIsAiScanning(true);
    try {
      const detectedFields = await scanFormWithAI(formData.targetUrl);
      
      const mappedFields: FormField[] = detectedFields.map((f: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        label: f.label,
        selector: f.selector,
        type: f.type as FieldType,
        required: f.required,
        optionSelector: f.optionSelector,
        cascadeSelectors: f.cascadeSelectors
      }));

      setFormData(prev => ({ ...prev, fields: [...prev.fields, ...mappedFields] }));
      alert(`AI 扫描成功，识别到 ${mappedFields.length} 个字段。`);
    } catch (err) {
      console.error(err);
      alert("AI 扫描暂时不可用，请手动配置选择器。");
    } finally {
      setIsAiScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">表单逻辑架构师</h3>
            <p className="text-slate-500 text-sm">配置复杂的级联与 UI 组件映射关系</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold">取消</button>
            <button onClick={() => onSave(formData)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 font-semibold">保存模版</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">模版名称</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">目标网址</label>
            <div className="flex gap-2">
              <input type="text" value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              <button onClick={handleAiScan} disabled={isAiScanning} className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50">
                {isAiScanning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                AI 探测
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <h4 className="font-bold text-slate-800">字段映射逻辑</h4>
            <button onClick={addField} className="text-blue-600 text-sm font-bold">+ 新增字段</button>
          </div>

          <div className="space-y-4">
            {formData.fields.map((field) => (
              <div key={field.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">字段名称</label>
                    <input type="text" value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">类型</label>
                    <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                      <option value={FieldType.TEXT}>普通文本</option>
                      <option value={FieldType.TEXTAREA}>多行文本</option>
                      <option value={FieldType.UI_SELECT}>UI 下拉框 (El-Select)</option>
                      <option value={FieldType.CASCADE}>级联选择 (Cascader)</option>
                      <option value={FieldType.SELECT}>原生 Select</option>
                      <option value={FieldType.CHECKBOX}>复选框</option>
                      <option value={FieldType.RADIO}>单选框</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">主触发选择器</label>
                    <input type="text" value={field.selector} onChange={(e) => updateField(field.id, { selector: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono" />
                  </div>
                </div>

                {field.type === FieldType.UI_SELECT && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-500 uppercase">选项 CSS 选择器 (Li/Item 标签)</label>
                    <input type="text" value={field.optionSelector || ''} onChange={(e) => updateField(field.id, { optionSelector: e.target.value })} className="w-full px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm font-mono" placeholder=".el-select-dropdown__item" />
                  </div>
                )}

                {field.type === FieldType.CASCADE && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-500 uppercase">级联选择器 (逗号分隔各层级选择器)</label>
                    <input type="text" value={field.cascadeSelectors?.join(',') || ''} onChange={(e) => updateField(field.id, { cascadeSelectors: e.target.value.split(',') })} className="w-full px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-sm font-mono" placeholder=".level1, .level2, .level3" />
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button onClick={() => removeField(field.id)} className="text-red-400 text-xs hover:text-red-600 transition-colors">移除该字段</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
