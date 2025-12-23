import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Upload, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Database,
  Edit2,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  Archive,
  Tag as TagIcon,
  Filter,
  Ban,
  Copy,
  Download,
  FileJson,
  Smartphone
} from 'lucide-react';
import { Tool, CategoryId } from '../types';

interface AdminDashboardProps {
  tools: Tool[];
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
  onExit: () => void;
  onSelectTag?: (tag: string) => void;
}

type Tab = 'tools' | 'import' | 'tags';

// Helper to normalize URLs for comparison (trim, lowercase, remove trailing slash)
const normalizeUrl = (url: string) => url.trim().toLowerCase().replace(/\/+$/, '');

// Helper to normalize Names for loose comparison (remove spaces, lowercase)
const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '');

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tools, setTools, onExit, onSelectTag }) => {
  const [activeTab, setActiveTab] = useState<Tab>('tools');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Batch Import State
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Tool[]>([]);
  
  // Tag Management State
  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ai-tags-data');
      const savedTags = saved ? JSON.parse(saved) : [];
      const combinedTags = new Set<string>(savedTags);
      tools.forEach(t => t.tags?.forEach(tag => combinedTags.add(tag)));
      return Array.from(combinedTags);
    } catch (e) {
      return [];
    }
  });

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  // Tool Editing State
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  
  // Filter State
  const [filterNoTags, setFilterNoTags] = useState(false);

  // --- Duplicate Management State ---
  const [showDedupModal, setShowDedupModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<{key: string, items: Tool[]}[]>([]);

  // --- Custom Confirmation State ---
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    confirmText?: string;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
    confirmText: '确定',
    isDangerous: false
  });

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  // --- Effect: Persist Tags & Sync with Tools ---
  useEffect(() => {
    localStorage.setItem('ai-tags-data', JSON.stringify(globalTags));
  }, [globalTags]);

  useEffect(() => {
    setGlobalTags(prev => {
      const currentSet = new Set(prev);
      let hasChanges = false;
      tools.forEach(t => t.tags?.forEach(tag => {
        if (!currentSet.has(tag)) {
          currentSet.add(tag);
          hasChanges = true;
        }
      }));
      return hasChanges ? Array.from(currentSet) : prev;
    });
  }, [tools]);

  // --- Logic: Tool Management ---
  const filteredTools = tools.filter(t => {
    if (filterNoTags) {
       if (t.tags && t.tags.length > 0) return false;
    }
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      t.name.toLowerCase().includes(term) || 
      t.url.toLowerCase().includes(term) ||
      t.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  });

  const handleEditClick = (e: React.MouseEvent, tool: Tool) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTool({ ...tool }); 
  };

  const saveEditedTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;
    setTools(prev => prev.map(t => t.id === editingTool.id ? editingTool : t));
    setEditingTool(null);
  };

  // --- DELETE FUNCTION (Custom Modal) ---
  const handleDeleteFromModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editingTool) return;
    const targetId = editingTool.id;
    
    setConfirmation({
      isOpen: true,
      title: '删除网站',
      message: `确定要永久删除 "${editingTool.name}" 吗？`,
      isDangerous: true,
      confirmText: '确认删除',
      action: () => {
        setTools(prev => prev.filter(t => t.id !== targetId));
        setEditingTool(null);
        closeConfirmation();
      }
    });
  };

  // --- NEW: Manual Deduplication Logic ---
  const handleScanDuplicates = () => {
    const groups: Record<string, Tool[]> = {};
    
    // Group by normalized name
    tools.forEach(tool => {
      const key = normalizeName(tool.name);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tool);
    });

    // Filter only groups with > 1 item
    const results = Object.entries(groups)
      .filter(([_, items]) => items.length > 1)
      .map(([key, items]) => ({ key, items }));

    if (results.length === 0) {
      alert("🎉 太棒了！未发现重复的网站标题。");
      return;
    }

    setDuplicateGroups(results);
    setShowDedupModal(true);
  };

  const handleDeleteDuplicateItem = (toolId: string, groupKey: string) => {
    // 1. Remove from main Tools list
    setTools(prev => prev.filter(t => t.id !== toolId));
    
    // 2. Update local Duplicate Groups UI
    setDuplicateGroups(prev => {
      return prev.map(group => {
        if (group.key === groupKey) {
          return {
            ...group,
            items: group.items.filter(t => t.id !== toolId)
          };
        }
        return group;
      }).filter(group => group.items.length > 1); // Remove group if only 1 item left (no longer duplicate)
    });
  };

  // --- Logic: Batch Import Analysis ---
  
  const parseImportText = () => {
    const trimmed = importText.trim();
    
    // 1. Try parsing as JSON first (for Backup Restoration)
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed);
            // Support both raw array or object with data property
            const dataArray = Array.isArray(parsed) ? parsed : (parsed.data || []);
            
            if (Array.isArray(dataArray)) {
                const validTools: Tool[] = dataArray.map((t: any) => ({
                    id: t.id || `import-json-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: t.name || 'Unknown',
                    url: t.url || '',
                    description: t.description || '',
                    categoryId: t.categoryId || 'chat',
                    tags: Array.isArray(t.tags) ? t.tags : [],
                    isHot: !!t.isHot,
                    iconUrl: t.iconUrl
                })).filter(t => t.name && t.url);

                if (validTools.length > 0) {
                    setImportPreview(validTools);
                    return; // Successfully parsed as JSON, stop here
                }
            }
        } catch (e) {
            console.log("JSON parse failed, trying line parser...");
        }
    }

    // 2. Fallback to Line Parsing (Legacy format)
    const lines = importText.split('\n').filter(line => line.trim());
    const parsed: Tool[] = [];
    const seenInBatch = new Set<string>();
    
    // Helper to map category input
    const parseCategory = (input: string): CategoryId => {
       const s = input.toLowerCase().trim();
       if (s.includes('chat') || s.includes('对话')) return 'chat';
       if (s.includes('study') || s.includes('学习') || s.includes('教育')) return 'study';
       if (s.includes('work') || s.includes('办公') || s.includes('code') || s.includes('编程') || s.includes('write') || s.includes('写作') || s.includes('search') || s.includes('搜索') || s.includes('translate') || s.includes('翻译')) return 'work';
       if (s.includes('life') || s.includes('生活') || s.includes('daily')) return 'life';
       if (s.includes('media') || s.includes('多媒体') || s.includes('image') || s.includes('绘图') || s.includes('video') || s.includes('视频') || s.includes('audio') || s.includes('音频')) return 'media';
       if (s.includes('agent') || s.includes('智能体') || s.includes('bot')) return 'agent';
       
       return 'chat'; // Default fallback
    };
    
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const url = parts[1];
        const description = parts[2] || '暂无描述';
        
        const normalized = normalizeUrl(url);
        if (seenInBatch.has(normalized)) return;
        seenInBatch.add(normalized);

        let categoryId: CategoryId = 'chat';
        let tags: string[] = [];

        // Parse format: Name | URL | Description | Category | Tags
        if (parts.length >= 4) {
             const potentialCat = parts[3];
             // Heuristic: If part 3 matches category keywords and doesn't look like a tag list
             const isTagList = potentialCat.includes(',') || potentialCat.includes('，');
             const s = potentialCat.toLowerCase();
             const knownKeywords = ['chat', '对话', 'study', '学习', 'work', '办公', 'life', '生活', 'media', '多媒体', 'agent', '智能体', 'image', 'video', 'code'];
             const isCatKeyword = knownKeywords.some(k => s.includes(k));
             
             if (parts.length >= 5) {
                 categoryId = parseCategory(parts[3]);
                 tags = parts[4].split(/[,，、\s]+/).map(t => t.trim()).filter(t => t.length > 0);
             } else if (isCatKeyword && !isTagList) {
                 categoryId = parseCategory(parts[3]);
             } else {
                 tags = parts[3].split(/[,，、\s]+/).map(t => t.trim()).filter(t => t.length > 0);
             }
        }

        parsed.push({
          id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name,
          url: url,
          description: description,
          categoryId: categoryId,
          tags: tags,
          isHot: false
        });
      }
    });
    setImportPreview(parsed);
  };

  const { uniqueImports, duplicateImports } = useMemo(() => {
    if (importPreview.length === 0) return { uniqueImports: [], duplicateImports: [] };

    const existingUrls = new Set(tools.map(t => normalizeUrl(t.url)));
    const unique: Tool[] = [];
    const dups: Tool[] = [];

    importPreview.forEach(item => {
      if (existingUrls.has(normalizeUrl(item.url))) {
        dups.push(item);
      } else {
        unique.push(item);
      }
    });

    return { uniqueImports: unique, duplicateImports: dups };
  }, [importPreview, tools]);

  const confirmImport = () => {
    if (uniqueImports.length === 0) return;
    setTools(prev => [...uniqueImports, ...prev]);
    setImportText('');
    setImportPreview([]);
    const dupMsg = duplicateImports.length > 0 ? `\n(已自动忽略 ${duplicateImports.length} 个重复网址)` : '';
    alert(`成功导入 ${uniqueImports.length} 个新网站！${dupMsg}`);
    setActiveTab('tools');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tools, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
        alert('✅ 数据代码已复制到剪贴板！\n\n请在其他设备（如手机）的后台打开此页面，粘贴到下方的输入框中即可同步。');
    }).catch(() => {
        alert('❌ 复制失败，请手动复制屏幕下方导出的内容。');
    });
  };

  // --- Logic: Tag Management ---
  const { activeTags, unusedTags } = useMemo(() => {
    const stats: Record<string, number> = {};
    globalTags.forEach(tag => stats[tag] = 0);
    tools.forEach(tool => {
      tool.tags?.forEach(tag => {
        if (stats.hasOwnProperty(tag)) {
           stats[tag] = (stats[tag] || 0) + 1;
        } else {
           stats[tag] = 1;
        }
      });
    });

    const active: [string, number][] = [];
    const unused: [string, number][] = [];

    Object.entries(stats).forEach(([tag, count]) => {
      if (count > 0) active.push([tag, count]);
      else unused.push([tag, count]);
    });

    return {
      activeTags: active.sort((a, b) => b[1] - a[1]),
      unusedTags: unused.sort((a, b) => a[0].localeCompare(b[0]))
    };
  }, [tools, globalTags]);

  const handleRenameTag = (oldTag: string) => {
    if (!newTagName.trim() || newTagName === oldTag) {
      setEditingTag(null);
      return;
    }
    setConfirmation({
      isOpen: true,
      title: '重命名标签',
      message: `确定将所有 "${oldTag}" 标签重命名为 "${newTagName}" 吗？`,
      isDangerous: false,
      confirmText: '保存更改',
      action: () => {
        setGlobalTags(prev => prev.map(t => t === oldTag ? newTagName : t));
        setTools(prev => prev.map(tool => {
          if (tool.tags?.includes(oldTag)) {
            return {
              ...tool,
              tags: tool.tags.map(t => t === oldTag ? newTagName : t)
            };
          }
          return tool;
        }));
        setEditingTag(null);
        setNewTagName('');
        closeConfirmation();
      }
    });
  };

  const handleDeleteTag = (e: React.MouseEvent, tagToDelete: string, isUnused: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    const usedByCount = isUnused ? 0 : tools.filter(t => t.tags?.includes(tagToDelete)).length;
    setConfirmation({
      isOpen: true,
      title: '彻底删除标签',
      message: isUnused 
        ? `标签 "${tagToDelete}" 当前未被使用。\n确定要将其从标签库中彻底移除吗？`
        : `⚠️ 标签 "${tagToDelete}" 正在被 ${usedByCount} 个网站使用。\n删除后，它将从所有网站和标签库中消失。`,
      isDangerous: true,
      confirmText: '彻底删除',
      action: () => {
        setGlobalTags(prev => prev.filter(t => t !== tagToDelete));
        if (!isUnused) {
          setTools(prev => prev.map(tool => {
              if (tool.tags && tool.tags.includes(tagToDelete)) {
                  return {
                      ...tool,
                      tags: tool.tags.filter(t => t !== tagToDelete)
                  };
              }
              return tool;
          }));
        }
        closeConfirmation();
      }
    });
  };

  // --- Render Helpers ---
  const renderTagCard = (tagName: string, count: number, isUnused: boolean) => (
    <div key={tagName} className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all group ${
      isUnused ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isUnused ? 'text-slate-400' : 'text-blue-500'}`}>
           <TagIcon size={10} />
           {isUnused ? 'Idle' : 'Active'}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          isUnused ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'
        }`}>
          {count} 引用
        </span>
      </div>
      
      {editingTag === tagName ? (
        <div className="flex items-center gap-2 mt-2">
          <input 
            autoFocus
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            className="flex-1 min-w-0 bg-white border border-blue-500 rounded px-2 py-1 text-sm focus:outline-none shadow-sm"
          />
          <button onClick={() => handleRenameTag(tagName)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Save size={16} /></button>
          <button onClick={() => setEditingTag(null)} className="text-slate-400 p-1 hover:bg-slate-50 rounded"><X size={16} /></button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
           <h3 
            onClick={() => !isUnused && onSelectTag && onSelectTag(tagName)}
            className={`font-bold text-lg flex items-center gap-1 transition-colors ${
              isUnused 
                ? 'text-slate-500 cursor-default' 
                : 'text-slate-800 cursor-pointer hover:text-blue-600'
            }`}
           >
             {tagName}
             {!isUnused && <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />}
           </h3>
          <div className="flex gap-1">
            <button 
              onClick={() => { setEditingTag(tagName); setNewTagName(tagName); }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button 
              type="button"
              onClick={(e) => handleDeleteTag(e, tagName, isUnused)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20 relative">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Database className="text-blue-400" /> 管理系统
              </h1>
              <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                 <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                 本地数据模式 · Local Storage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tools' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            网站列表
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'import' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            备份/同步
          </button>
          <button 
            onClick={() => setActiveTab('tags')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tags' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            标签管理
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* VIEW: TOOL LIST */}
        {activeTab === 'tools' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索名称、链接或标签..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm"
                />
              </div>

              <button 
                onClick={() => setFilterNoTags(!filterNoTags)}
                className={`flex items-center gap-1.5 px-3 py-3 border rounded-xl transition-colors font-bold text-sm shadow-sm whitespace-nowrap ${
                  filterNoTags 
                    ? 'bg-blue-100 border-blue-200 text-blue-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="只显示无标签的网站"
              >
                {filterNoTags ? <Filter size={16} className="fill-current"/> : <TagIcon size={16} className="text-slate-400" />}
                <span className="hidden sm:inline">无标签</span>
              </button>

              <button 
                onClick={handleScanDuplicates}
                className="flex items-center gap-1.5 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors font-bold text-sm shadow-sm whitespace-nowrap"
                title="检查标题重复的网站"
              >
                <Layers size={16} />
                <span className="hidden sm:inline">检查</span>重复
              </button>
            </div>
            
            {filterNoTags && (
               <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                  <AlertCircle size={16} />
                  正在显示未分配标签的网站 ({filteredTools.length})
                  <button onClick={() => setFilterNoTags(false)} className="ml-auto text-blue-800 underline">清除筛选</button>
               </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {filteredTools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors relative group">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-slate-800 truncate">{tool.name}</h3>
                      {tool.isHot && <Sparkles size={12} className="text-red-500 fill-current" />}
                    </div>
                    <p className="text-xs text-slate-400 truncate font-mono">{tool.url}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        tool.categoryId === 'chat' ? 'bg-blue-50 text-blue-500 border-blue-100' :
                        tool.categoryId === 'media' ? 'bg-purple-50 text-purple-500 border-purple-100' :
                        tool.categoryId === 'work' ? 'bg-sky-50 text-sky-500 border-sky-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {tool.categoryId.toUpperCase()}
                      </span>
                      {tool.tags?.map(t => (
                        <span key={t} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">{t}</span>
                      ))}
                      {(!tool.tags || tool.tags.length === 0) && (
                         <span className="text-[9px] bg-red-50 px-1.5 py-0.5 rounded text-red-400 border border-red-100 italic">No Tags</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 z-20">
                    <button 
                      type="button"
                      onClick={(e) => handleEditClick(e, tool)}
                      className="px-3 py-2 text-sm bg-slate-50 text-slate-600 border border-slate-200 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold flex items-center gap-1"
                    >
                      <Edit2 size={16} /> 编辑
                    </button>
                  </div>
                </div>
              ))}
              {filteredTools.length === 0 && (
                <div className="p-8 text-center text-slate-400">没有找到相关网站</div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: BATCH IMPORT / BACKUP */}
        {activeTab === 'import' && (
          <div className="animate-fade-in-up max-w-3xl mx-auto">
            
            {/* Export Section */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-indigo-500/20">
                <div className="flex items-start justify-between mb-4">
                   <div>
                       <h2 className="text-xl font-bold flex items-center gap-2">
                           <Smartphone size={24} /> 多端同步 / 数据备份
                       </h2>
                       <p className="text-indigo-100 text-sm mt-1 opacity-90 max-w-md">
                           由于是纯静态网站，数据仅保存在当前浏览器中。若需同步到手机或其他设备，请先在此处点击“导出”，然后在另一台设备的此页面“导入”。
                       </p>
                   </div>
                   <div className="bg-white/20 p-2 rounded-lg">
                       <FileJson size={24} />
                   </div>
                </div>
                <button 
                   onClick={handleExport}
                   className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                   <Copy size={18} /> 复制当前数据代码 (导出)
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                    <Upload size={20} className="text-blue-500" />
                    <h3>导入数据 / 批量添加</h3>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-xs text-slate-500">
                    <p className="font-bold mb-1 text-slate-700">支持两种格式：</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><span className="text-blue-600 font-medium">JSON 格式</span>：直接粘贴上方导出的数据代码，用于恢复备份或同步。</li>
                        <li><span className="text-green-600 font-medium">文本格式</span>：一行一个，格式为 <code className="bg-white px-1 border rounded">名称 | 链接 | 描述 | 分类 | 标签</code></li>
                    </ul>
                </div>

                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="w-full h-48 p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs sm:text-sm shadow-inner bg-slate-50 focus:bg-white transition-colors"
                  placeholder={`粘贴导出的 JSON 代码，或者输入新网站：\n\nChatGPT | https://chat.openai.com | 全球最强综合 AI | 对话 | 外网,智能\nMidjourney | https://www.midjourney.com | 顶级绘图工具 | 绘图 | 付费`}
                />

                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={parseImportText}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Search size={18} /> 解析预览
                  </button>
                  <button 
                    disabled={uniqueImports.length === 0}
                    onClick={confirmImport}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Download size={18} /> 确认导入 ({uniqueImports.length})
                  </button>
                </div>
            </div>

            {duplicateImports.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
                <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                  <Ban size={18} />
                  <span>发现 {duplicateImports.length} 个已存在的重复网站</span>
                </div>
                <p className="text-xs text-red-400 mb-3">系统已自动将它们标记为灰色，导入时会自动跳过，无需手动删除。</p>
                <div className="bg-white/50 rounded-lg border border-red-100 overflow-hidden divide-y divide-red-50 max-h-40 overflow-y-auto no-scrollbar">
                  {duplicateImports.map((item, idx) => (
                    <div key={idx} className="p-2.5 text-sm flex gap-3 opacity-60">
                      <span className="font-bold text-slate-600 w-1/4 truncate line-through decoration-red-400">{item.name}</span>
                      <span className="text-slate-400 w-1/4 truncate line-through">{item.url}</span>
                      <span className="text-red-400 text-xs italic flex-1 text-right">已存在</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uniqueImports.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" /> 准备导入的新网站 ({uniqueImports.length})
                </h3>
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden divide-y divide-slate-100 shadow-sm ring-1 ring-green-100">
                  {uniqueImports.map((item, idx) => (
                    <div key={idx} className="p-3 text-sm flex gap-4 bg-green-50/10 items-center">
                      <span className="font-bold text-slate-800 w-1/5 truncate">{item.name}</span>
                      <span className="text-blue-500 w-1/5 truncate">{item.url}</span>
                      
                      {/* Category Badge */}
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-500 whitespace-nowrap hidden sm:inline-block">
                        {item.categoryId === 'chat' ? '对话' :
                         item.categoryId === 'media' ? '多媒体' :
                         item.categoryId === 'study' ? '学习' :
                         item.categoryId === 'work' ? '办公' :
                         item.categoryId === 'life' ? '生活' :
                         item.categoryId === 'agent' ? '智能体' : '其他'}
                      </span>

                      <span className="text-slate-500 w-1/5 truncate">{item.description}</span>
                       <div className="flex-1 flex flex-wrap gap-1 justify-end">
                         {item.tags?.map(t => (
                           <span key={t} className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 whitespace-nowrap">{t}</span>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: TAG MANAGER */}
        {activeTab === 'tags' && (
          <div className="animate-fade-in-up space-y-8">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                使用中 ({activeTags.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeTags.map(([tagName, count]) => renderTagCard(tagName, count, false))}
                {activeTags.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
                    暂无活跃标签
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Archive size={16} />
                闲置中 / 零引用 ({unusedTags.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {unusedTags.map(([tagName, count]) => renderTagCard(tagName, count, true))}
                {unusedTags.length === 0 && (
                   <div className="col-span-full py-6 text-center text-slate-300 text-sm">
                     没有闲置标签
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- DUPLICATE RESOLUTION MODAL --- */}
      {showDedupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-yellow-50/50">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                   <Layers size={20} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-800">重复网站检测</h3>
                   <p className="text-xs text-slate-500">检测到 {duplicateGroups.length} 组标题相似的条目，请手动清理</p>
                 </div>
               </div>
               <button onClick={() => setShowDedupModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                 <X size={24} />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {duplicateGroups.length === 0 && (
                  <div className="text-center py-10">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <p className="text-slate-600 font-bold">所有重复项已处理完毕！</p>
                    <button onClick={() => setShowDedupModal(false)} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">关闭</button>
                  </div>
                )}

                {duplicateGroups.map((group, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                      <span>检测关键字: "{group.items[0].name}"</span>
                      <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px]">{group.items.length} 个重复</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {group.items.map(tool => (
                        <div key={tool.id} className="p-4 flex items-center justify-between gap-4 group hover:bg-slate-50">
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <h4 className="font-bold text-slate-800 truncate">{tool.name}</h4>
                               {tool.isHot && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">HOT</span>}
                             </div>
                             <a href={tool.url} target="_blank" className="text-xs text-blue-500 truncate block hover:underline flex items-center gap-1">
                               {tool.url} <ExternalLink size={10} />
                             </a>
                             <p className="text-xs text-slate-400 truncate mt-1">{tool.description}</p>
                           </div>
                           <button 
                             onClick={() => handleDeleteDuplicateItem(tool.id, group.key)}
                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                             title="删除此条目"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRMATION MODAL --- */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in ring-1 ring-white/50">
             <div className="p-6 text-center">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmation.isDangerous ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                 <AlertTriangle size={28} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmation.title}</h3>
               <p className="text-sm text-slate-500 mb-6 leading-relaxed whitespace-pre-wrap">{confirmation.message}</p>
               
               <div className="flex gap-3">
                 <button 
                   onClick={closeConfirmation}
                   className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={confirmation.action}
                   className={`flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${
                     confirmation.isDangerous 
                       ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                       : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                   }`}
                 >
                   {confirmation.confirmText || '确定'}
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* --- EDIT MODAL OVERLAY --- */}
      {editingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingTool(null)}>
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 size={18} className="text-blue-500" /> 编辑网站
              </h3>
              <button onClick={() => setEditingTool(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={saveEditedTool} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">名称</label>
                <input 
                  required
                  value={editingTool.name}
                  onChange={e => setEditingTool({...editingTool, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">链接</label>
                <input 
                  required
                  value={editingTool.url}
                  onChange={e => setEditingTool({...editingTool, url: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono text-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">分类</label>
                  <select 
                    value={editingTool.categoryId}
                    onChange={e => setEditingTool({...editingTool, categoryId: e.target.value as CategoryId})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  >
                    <option value="chat">对话</option>
                    <option value="study">学习</option>
                    <option value="work">办公</option>
                    <option value="life">生活</option>
                    <option value="media">多媒体</option>
                    <option value="agent">智能体</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">热门推荐</label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingTool.isHot || false}
                      onChange={e => setEditingTool({...editingTool, isHot: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-sm font-medium text-slate-700">设为 HOT</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">描述</label>
                <textarea 
                  rows={2}
                  value={editingTool.description}
                  onChange={e => setEditingTool({...editingTool, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">标签 (逗号分隔)</label>
                <input 
                  value={editingTool.tags ? (typeof editingTool.tags === 'string' ? editingTool.tags : editingTool.tags.join(', ')) : ''}
                  onChange={e => setEditingTool({
                    ...editingTool, 
                    tags: e.target.value.split(/[,，\s]+/).filter(t => t.trim().length > 0)
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="例如: 免费, 开源"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={handleDeleteFromModal}
                  className="p-3 rounded-xl bg-red-50 text-red-500 font-bold border border-red-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="删除此网站"
                >
                  <Trash2 size={20} />
                </button>
                <div className="flex-1 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setEditingTool(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors"
                    >
                      保存修改
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};