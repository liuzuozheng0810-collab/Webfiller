
import React, { useState, useEffect } from 'react';
import { AutomationTemplate, DataRow } from '../types';

interface SavedSequence {
  id: string;
  name: string;
  templateId: string;
  data: DataRow[];
  timestamp: number;
}

interface DataManagerProps {
  template: AutomationTemplate | null;
  data: DataRow[];
  setData: (data: DataRow[]) => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ template, data, setData }) => {
  const [viewMode, setViewMode] = useState<'table' | 'sequence'>('sequence');
  const [copyingStatus, setCopyingStatus] = useState<{ current: number; total: number; label: string } | null>(null);
  const [savedSequences, setSavedSequences] = useState<SavedSequence[]>([]);
  const [currentSeqName, setCurrentSeqName] = useState<string>('默认录入序列');

  // 初始化加载序列库
  useEffect(() => {
    const stored = localStorage.getItem('autofill_architect_v3_compact');
    if (stored) {
      try {
        setSavedSequences(JSON.parse(stored));
      } catch (e) {
        console.error('Library parse error', e);
      }
    }
  }, []);

  const persistLibrary = (newList: SavedSequence[]) => {
    setSavedSequences(newList);
    localStorage.setItem('autofill_architect_v3_compact', JSON.stringify(newList));
  };

  const handleFieldChange = (rowId: string, fieldLabel: string, value: string) => {
    const updated = data.map(row => 
      row.id === rowId ? { ...row, [fieldLabel]: value } : row
    );
    setData(updated);
  };

  const clearField = (rowId: string, fieldLabel: string) => {
    handleFieldChange(rowId, fieldLabel, '');
  };

  const removeRecord = (rowId: string) => {
    setData(data.filter(row => row.id !== rowId));
  };

  const handleSaveToLibrary = () => {
    if (data.length === 0) return alert('当前没有可供保存的数据记录');
    if (!template) return;
    
    const newSeq: SavedSequence = {
      id: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: currentSeqName || '未命名序列',
      templateId: template.id,
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now()
    };

    persistLibrary([newSeq, ...savedSequences]);
    alert(`✅ 已保存到库: ${newSeq.name}`);
  };

  const invokeSequence = (seq: SavedSequence) => {
    setData([...seq.data]);
    setCurrentSeqName(seq.name);
  };

  // 导出 CSV 文本功能
  const handleExportData = () => {
    if (!template || data.length === 0) {
      alert("没有可导出的数据");
      return;
    }

    const headers = template.fields.map(f => f.label);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentSeqName.replace(/\s+/g, '_')}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1)
          .filter(line => line.trim())
          .map((line, idx) => {
            // 简单的正则处理带引号的 CSV
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            const row: DataRow = { id: `csv-${Date.now()}-${idx}` };
            headers.forEach((h, i) => { 
              let val = values[i]?.trim() || '';
              if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"');
              row[h] = val; 
            });
            return row;
          });
        setData([...data, ...rows]);
        setCurrentSeqName(`导入_${new Date().toLocaleDateString()}`);
      } catch (err) {
        alert('解析 CSV 失败，请检查格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addNewRecord = () => {
    if (!template) return;
    const newRow: DataRow = { id: `row-${Date.now()}-${Math.random()}` };
    template.fields.forEach(f => { newRow[f.label] = ''; });
    setData([...data, newRow]);
  };

  const startBatchCopy = async () => {
    if (data.length === 0 || !template) return;
    const flat: { text: string; label: string }[] = [];
    data.forEach((row, rIdx) => {
      template.fields.forEach(f => {
        const v = row[f.label];
        if (v && String(v).trim()) flat.push({ text: String(v), label: `R${rIdx+1}-${f.label}` });
      });
    });
    if (flat.length === 0) return alert('当前没有有效录入数据');
    setCopyingStatus({ current: 0, total: flat.length, label: '初始化队列...' });
    try {
      for (let i = 0; i < flat.length; i++) {
        setCopyingStatus({ current: i + 1, total: flat.length, label: flat[i].label });
        await navigator.clipboard.writeText(flat[i].text);
        await new Promise(r => setTimeout(r, 600));
      }
      alert('🎉 录入同步完成！请使用 Win+V 进行批量粘贴。');
    } catch (e) {
      alert('同步失败，请保持窗口激活状态');
    } finally {
      setCopyingStatus(null);
    }
  };

  if (!template) return <div className="p-10 text-center text-slate-400 font-bold">请先在左侧模版中心选择一个激活模版</div>;

  const currentTemplateLibrary = savedSequences.filter(s => s.templateId === template.id);

  return (
    <div className="space-y-3 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 1. 序列库 - 顶部栏 */}
      {currentTemplateLibrary.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-3 shadow-lg border border-white/5 overflow-hidden">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SAVED LIBRARY / 点击调用存档</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {currentTemplateLibrary.map(seq => (
              <div 
                key={seq.id}
                className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg cursor-pointer transition-all shrink-0"
              >
                <div onClick={() => invokeSequence(seq)} className="flex flex-col pr-1 min-w-[80px]">
                  <span className="text-[11px] font-bold text-slate-200 truncate max-w-[120px]">{seq.name}</span>
                  <span className="text-[7px] text-slate-500 font-mono">{seq.data.length} 条记录</span>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(confirm('删除此序列？')) persistLibrary(savedSequences.filter(s => s.id !== seq.id)); 
                  }}
                  className="w-4 h-4 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <i className="fas fa-times text-[8px]"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 主编辑器面板 */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
        {copyingStatus && (
          <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 mb-3 relative">
              <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                <circle cx="32" cy="32" r="28" stroke="#3b82f6" strokeWidth="6" fill="transparent" strokeDasharray={176} strokeDashoffset={176 * (1 - copyingStatus.current / copyingStatus.total)} className="transition-all duration-300" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-slate-800">{Math.round((copyingStatus.current / copyingStatus.total) * 100)}%</div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">正在处理字段</p>
            <p className="text-sm font-black text-blue-600">{copyingStatus.label}</p>
          </div>
        )}

        {/* 控制层 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 pb-4 border-b border-slate-50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">当前序列编辑器</span>
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-bold rounded">SEQUENCE A</span>
            </div>
            <input 
              type="text"
              value={currentSeqName}
              onChange={(e) => setCurrentSeqName(e.target.value)}
              className="w-full text-lg font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-slate-200"
              placeholder="点击输入录入任务名称..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-0.5 rounded-lg flex gap-0.5 shadow-inner">
              <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <i className="fas fa-table mr-1"></i> 表格
              </button>
              <button onClick={() => setViewMode('sequence')} className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${viewMode === 'sequence' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <i className="fas fa-th-large mr-1"></i> 卡片
              </button>
            </div>
            <button onClick={handleSaveToLibrary} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[9px] flex items-center gap-1.5 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10">
              <i className="fas fa-save"></i> 存库
            </button>
            <div className="flex bg-slate-800 rounded-lg overflow-hidden shadow-md">
              <button onClick={handleExportData} className="px-3 py-1.5 text-white hover:bg-slate-700 border-r border-slate-700 font-bold text-[9px] flex items-center gap-1.5 transition-all">
                <i className="fas fa-file-export"></i> 导出
              </button>
              <label className="cursor-pointer px-3 py-1.5 text-white hover:bg-slate-700 font-bold text-[9px] flex items-center gap-1.5 transition-all">
                <i className="fas fa-file-import"></i> 导入
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {data.length > 0 ? (
          viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase border-b border-slate-100 w-10">序号</th>
                    {template.fields.map(f => <th key={f.id} className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase border-b border-slate-100">{f.label}</th>)}
                    <th className="px-3 py-2.5 border-b border-slate-100 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-3 py-2.5 text-[10px] font-mono text-slate-300 group-hover:text-blue-400 transition-colors">{idx + 1}</td>
                      {template.fields.map(f => (
                        <td key={f.id} className="px-3 py-2.5">
                          <input 
                            type="text" 
                            value={row[f.label] || ''} 
                            onChange={(e) => handleFieldChange(row.id, f.label, e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-[11px] text-slate-600 focus:text-blue-600 p-0 focus:font-bold"
                            placeholder="待输入..."
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => removeRecord(row.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fas fa-trash-alt text-[9px]"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 操作横栏 */}
              <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xs backdrop-blur-md shadow-inner"><i className="fas fa-bolt"></i></div>
                  <div>
                    <h4 className="text-[11px] font-black leading-none uppercase tracking-tighter">批量录入引擎</h4>
                    <p className="text-[8px] text-blue-100 opacity-70 mt-1 uppercase font-bold tracking-widest">{data.length} 条记录已装载</p>
                  </div>
                </div>
                <button onClick={startBatchCopy} className="px-5 py-2 bg-white text-blue-700 rounded-lg font-black text-[9px] hover:shadow-xl transition-all active:scale-95 border-b-2 border-blue-100">
                  一键推送剪贴板
                </button>
              </div>

              {/* 紧凑编辑器卡片网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.map((row, rIdx) => (
                  <div key={row.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:shadow-lg hover:border-blue-400/30 transition-all group relative">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-sm">REC-{rIdx + 1}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">可编辑工作卡</span>
                      </div>
                      <button onClick={() => removeRecord(row.id)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times text-[10px]"></i></button>
                    </div>
                    
                    <div className="space-y-1.5">
                      {template.fields.map(f => (
                        <div key={f.id} className="bg-white p-2 rounded-lg border border-slate-100 hover:border-blue-200 transition-all shadow-sm group/field">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{f.label}</label>
                            <div className="flex gap-1.5 opacity-0 group-hover/field:opacity-100 transition-opacity">
                              <button onClick={() => clearField(row.id, f.label)} className="text-slate-200 hover:text-red-500 transition-all" title="清空"><i className="fas fa-eraser text-[7px]"></i></button>
                              <button onClick={() => { navigator.clipboard.writeText(row[f.label] || ''); alert('已复制该字段'); }} className="text-slate-200 hover:text-blue-500 transition-all"><i className="fas fa-clone text-[7px]"></i></button>
                            </div>
                          </div>
                          <input 
                            type="text" 
                            value={row[f.label] || ''}
                            onChange={(e) => handleFieldChange(row.id, f.label, e.target.value)}
                            placeholder={`输入${f.label}...`}
                            className="w-full text-[11px] font-bold text-slate-800 bg-transparent border-none outline-none p-0 focus:ring-0 placeholder:font-normal placeholder:text-slate-200 cursor-text"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* 追加按钮 */}
                <div 
                  onClick={addNewRecord}
                  className="bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-200 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer min-h-[140px]"
                >
                  <i className="fas fa-plus-circle text-2xl mb-1"></i>
                  <span className="font-black text-[10px] uppercase tracking-widest">追加记录</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm border border-slate-100">
              <i className="fas fa-inbox text-xl"></i>
            </div>
            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-widest">队列当前为空</h4>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => { addNewRecord(); addNewRecord(); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">创建演示数据</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
