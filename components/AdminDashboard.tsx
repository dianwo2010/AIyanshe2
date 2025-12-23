import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Upload, 
  CloudLightning, 
  Database,
  Edit2,
  X,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Globe,
  Settings,
  RefreshCw,
  Rocket
} from 'lucide-react';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { Tool, CategoryId } from '../types';
import { supabaseConfig } from '../config';

interface AdminDashboardProps {
  tools: Tool[];
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
  onExit: () => void;
  onSelectTag?: (tag: string) => void;
}

type Tab = 'publish' | 'manage' | 'import';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tools, setTools, onExit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('publish');
  
  // --- Config State ---
  const [dbConfig, setDbConfig] = useState({
    url: supabaseConfig.url || '',
    anonKey: supabaseConfig.anonKey || '',
    serviceKey: '' // Private key for writing
  });
  const [showKeys, setShowKeys] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // --- Publish State ---
  const [status, setStatus] = useState<'idle' | 'testing' | 'publishing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  // --- Management State ---
  const [searchTerm, setSearchTerm] = useState('');

  // --- Import State ---
  const [importText, setImportText] = useState('');

  // Load saved config on mount
  useEffect(() => {
    const savedPublic = localStorage.getItem('ai-db-config-public');
    const savedService = localStorage.getItem('ai-db-config-service');
    
    if (savedPublic) {
      const parsed = JSON.parse(savedPublic);
      setDbConfig(prev => ({ ...prev, url: parsed.url, anonKey: parsed.anonKey }));
    }
    if (savedService) {
      setDbConfig(prev => ({ ...prev, serviceKey: savedService }));
    }
  }, []);

  // Save Config Locally
  const handleSaveConfig = () => {
    localStorage.setItem('ai-db-config-public', JSON.stringify({ url: dbConfig.url, anonKey: dbConfig.anonKey }));
    if (dbConfig.serviceKey) {
      localStorage.setItem('ai-db-config-service', dbConfig.serviceKey);
    }
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  // Test Connection (Read Only)
  const testConnection = async () => {
    if (!dbConfig.url || !dbConfig.anonKey) {
      setStatus('error');
      setStatusMsg('请先填写 URL 和 Anon Key');
      return;
    }
    setStatus('testing');
    try {
      // Use createClient for read-only test with Anon Key (this is safe in browser)
      const supabase = createClient(dbConfig.url, dbConfig.anonKey);
      const { count, error } = await supabase.from('tools').select('*', { count: 'exact', head: true });
      if (error) throw error;
      setStatus('success');
      setStatusMsg(`连接成功！云端现有 ${count} 条数据`);
    } catch (e: any) {
      setStatus('error');
      setStatusMsg(`连接失败: ${e.message}`);
    }
  };

  // Publish to Cloud (Write)
  const handlePublish = async () => {
    // We need URL and Anon Key minimally. Service Key is needed for writing if RLS is on.
    if (!dbConfig.url || !dbConfig.anonKey) {
      alert("错误：必须填写 Project URL 和 Anon Key (Public Key)。");
      return;
    }

    const authKey = dbConfig.serviceKey || dbConfig.anonKey;
    
    if (!dbConfig.serviceKey) {
      const proceed = window.confirm("⚠️ 未检测到 Service Role Key (管理员密钥)\n\n如果没有正确配置 RLS 策略，使用普通 Anon Key 将无法写入数据。\n\n是否继续？");
      if (!proceed) return;
    }

    if (!window.confirm(`🚀 确定要发布吗？\n\n即将把本地 ${tools.length} 条数据覆盖同步到云端。`)) return;

    setStatus('publishing');
    setStatusMsg('正在连接云端数据库...');

    try {
      const baseUrl = dbConfig.url.replace(/\/$/, ""); // Remove trailing slash
      
      // CRITICAL FIX:
      // 'apikey': MUST be the Anon Key to bypass Supabase's browser check (Origin header check).
      // 'Authorization': MUST be the Service Key to actually get admin privileges (Bypass RLS).
      const headers = {
        'apikey': dbConfig.anonKey, 
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };

      // 1. Delete all existing (Full Sync Strategy)
      // REST API: DELETE /rest/v1/tools?id=neq.placeholder_safety_check
      setStatusMsg('正在清理旧数据...');
      const deleteRes = await fetch(`${baseUrl}/rest/v1/tools?id=neq.placeholder_safety_check`, {
        method: 'DELETE',
        headers: headers
      });

      if (!deleteRes.ok) {
        const errText = await deleteRes.text();
        throw new Error(`删除旧数据失败 (${deleteRes.status}): ${errText}`);
      }

      // 2. Insert new data
      // REST API: POST /rest/v1/tools
      setStatusMsg(`正在上传 ${tools.length} 条新数据...`);
      const insertRes = await fetch(`${baseUrl}/rest/v1/tools`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(tools)
      });

      if (!insertRes.ok) {
        const errText = await insertRes.text();
        throw new Error(`上传数据失败 (${insertRes.status}): ${errText}`);
      }

      setStatus('success');
      setStatusMsg('🎉 发布成功！全网数据已更新。');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setStatusMsg(`发布失败: ${e.message}`);
    }
  };

  // Import Logic
  const handleImport = () => {
    try {
      const lines = importText.trim().split('\n');
      const newTools: Tool[] = [];
      lines.forEach(line => {
        // Format: Name | URL | Description | Category | Tags
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 2) {
          newTools.push({
            id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: parts[0],
            url: parts[1],
            description: parts[2] || '暂无描述',
            categoryId: (parts[3] as any) || 'chat',
            tags: parts[4] ? parts[4].split(/[,，]/).map(t => t.trim()) : [],
            isHot: false
          });
        }
      });
      if (newTools.length > 0) {
        setTools(prev => [...newTools, ...prev]);
        setImportText('');
        alert(`成功导入 ${newTools.length} 个网站！\n请记得点击【发布】同步到云端。`);
        setActiveTab('publish');
      } else {
        alert("格式错误，请使用：名称 | 网址 | 描述");
      }
    } catch (e) {
      alert("解析失败");
    }
  };

  // Delete Tool
  const handleDelete = (id: string) => {
    if (window.confirm("确定删除此项吗？")) {
      setTools(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <div className="bg-slate-900 text-white sticky top-0 z-40 shadow-xl">
        <div className="flex items-center justify-between px-4 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Settings size={18} className="text-blue-400" />
              CMS 后台
            </h1>
          </div>
          <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-slate-300">
            Local: {tools.length}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex px-2 max-w-5xl mx-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'publish', label: '发布中心', icon: Rocket },
            { id: 'manage', label: '内容管理', icon: Database },
            { id: 'import', label: '批量导入', icon: Upload },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-all whitespace-nowrap px-4 ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 animate-fade-in-up">
        
        {/* === TAB: PUBLISH === */}
        {activeTab === 'publish' && (
          <div className="space-y-6">
            
            {/* 1. Connection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <CloudLightning size={18} className="text-blue-600" />
                  数据库连接
                </h3>
                <button 
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  {showKeys ? '隐藏密钥' : '显示密钥'}
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project URL</label>
                  <input 
                    value={dbConfig.url}
                    onChange={e => setDbConfig({...dbConfig, url: e.target.value})}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Anon Key (Public)</label>
                  <div className="relative">
                    <input 
                      type={showKeys ? "text" : "password"}
                      value={dbConfig.anonKey}
                      onChange={e => setDbConfig({...dbConfig, anonKey: e.target.value})}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR... (必填，用于绕过浏览器检查)"
                      className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase mb-1">
                    Service Role Key (Admin Write) <AlertCircle size={12} />
                  </label>
                  <input 
                    type={showKeys ? "text" : "password"}
                    value={dbConfig.serviceKey}
                    onChange={e => setDbConfig({...dbConfig, serviceKey: e.target.value})}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR... (写入权限必填)"
                    className="w-full bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-orange-500 outline-none placeholder-orange-200 text-orange-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    * 技巧：Anon Key 用于“敲门”，Service Key 用于“解锁”。请务必同时填写两者以成功发布。
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                   <button 
                     onClick={handleSaveConfig}
                     className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"
                   >
                     {configSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                     {configSaved ? '已保存' : '保存配置'}
                   </button>
                   <button 
                     onClick={testConnection}
                     className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                   >
                     <RefreshCw size={16} className={status === 'testing' ? 'animate-spin' : ''} />
                     测试连接
                   </button>
                </div>
              </div>
            </div>

            {/* 2. Action Area */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">一键全网发布</h2>
              <p className="text-blue-100 text-sm mb-6 opacity-90">
                将本地的 <span className="font-bold text-white bg-white/20 px-1.5 rounded">{tools.length}</span> 个网站同步到云端数据库
              </p>
              
              {status === 'publishing' ? (
                 <div className="bg-white/10 rounded-xl p-4 flex flex-col items-center justify-center animate-pulse">
                    <RefreshCw size={32} className="animate-spin mb-2" />
                    <span className="font-bold">{statusMsg}</span>
                 </div>
              ) : status === 'success' ? (
                 <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-4 flex flex-col items-center justify-center">
                    <CheckCircle size={32} className="mb-2 text-green-300" />
                    <span className="font-bold">{statusMsg}</span>
                    <button onClick={() => setStatus('idle')} className="mt-4 text-xs underline opacity-80">重置状态</button>
                 </div>
              ) : status === 'error' ? (
                 <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-1 text-red-200">
                       <AlertCircle size={20} /> 发布失败
                    </div>
                    <p className="text-sm opacity-90 break-all">{statusMsg}</p>
                    <button onClick={() => setStatus('idle')} className="mt-3 bg-white/20 px-4 py-1.5 rounded-lg text-xs font-bold">重试</button>
                 </div>
              ) : (
                <button
                  onClick={handlePublish}
                  className="w-full bg-white text-blue-600 py-4 rounded-xl font-black text-lg shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Rocket size={24} className="animate-bounce" />
                  立即发布
                </button>
              )}
            </div>
            
            {/* Instructions */}
            <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
              <p className="font-bold mb-1">💡 发布指南：</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>由于浏览器安全限制，必须同时填写 <b>Anon Key</b>（骗过浏览器）和 <b>Service Role Key</b>（获取写入权限）。</li>
                <li>发布成功后，请确保网站代码的 <code className="text-slate-700 font-mono">config.ts</code> 中填入了 URL 和 Anon Key，这样其他人才能看到数据。</li>
              </ul>
            </div>
          </div>
        )}

        {/* === TAB: MANAGE === */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索本地网站..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-3">
              {tools.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(tool => (
                <div key={tool.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 text-xs font-bold shrink-0`}>
                       {tool.name.slice(0,1)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{tool.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{tool.url}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => window.open(tool.url, '_blank')}
                      className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <Globe size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(tool.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TAB: IMPORT === */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed">
              <p className="font-bold mb-1">批量导入格式：</p>
              <p className="font-mono text-xs opacity-80">名称 | 网址 | 描述 | 分类 | 标签1,标签2</p>
              <p className="mt-2 text-xs">例如：<br/>ChatGPT | https://openai.com | AI对话 | chat | AI,助手</p>
            </div>
            
            <textarea 
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-64 bg-white border border-slate-200 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="在此粘贴您的网站列表..."
            />
            
            <button 
              onClick={handleImport}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Upload size={18} />
              解析并导入
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

// Simple Icon component for the search bar inside manage tab
const Search = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
