import React, { useState } from 'react';
import { X, Lock, Plus, Send, Settings, ArrowRight, ArrowLeft } from 'lucide-react';
import { CategoryId } from '../types';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onEnterAdmin?: () => void; // New prop
}

export const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onSubmit, onEnterAdmin }) => {
  const [step, setStep] = useState<'login' | 'options' | 'form'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    categoryId: 'chat' as CategoryId, // Default to chat
    tags: '',
  });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setStep('options'); // Go to options first instead of form directly
      setError('');
    } else {
      setError('账号或密码错误 (试用: admin/admin)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(/[,，\s]+/).filter(t => t.trim().length > 0);
    onSubmit({
      ...formData,
      tags: tagsArray,
      id: `custom-${Date.now()}`
    });
    // Reset
    setStep('login');
    setUsername('');
    setPassword('');
    setFormData({ name: '', url: '', description: '', categoryId: 'chat', tags: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 p-6 animate-fade-in-up ring-1 ring-white/50">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/40 text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>

        {step === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-white/60 rounded-2xl flex items-center justify-center mb-3 text-slate-700 shadow-sm border border-white/60">
                <Lock size={26} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">管理员登录</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">需要验证身份</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">账号</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/60 transition-all text-slate-800 placeholder-slate-400 backdrop-blur-sm"
                  placeholder="请输入账号"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/60 transition-all text-slate-800 placeholder-slate-400 backdrop-blur-sm"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-3 text-center font-medium bg-red-50/50 py-1 rounded-lg">{error}</p>}

            <button
              type="submit"
              className="w-full mt-6 bg-slate-900/90 backdrop-blur-md text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20 border border-white/10"
            >
              验证身份
            </button>
          </form>
        )}

        {step === 'options' && (
           <div className="flex flex-col gap-4 py-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">欢迎回来，Admin</h2>
                <p className="text-sm text-slate-500">请选择操作</p>
              </div>

              <button 
                onClick={() => setStep('form')}
                className="w-full py-4 px-6 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 rounded-2xl font-bold flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Plus size={20} />
                  <span>提交单个网站</span>
                </div>
                <ArrowRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => {
                  if (onEnterAdmin) {
                    onEnterAdmin();
                    onClose();
                  }
                }}
                className="w-full py-4 px-6 bg-slate-800 text-white hover:bg-slate-900 rounded-2xl font-bold flex items-center justify-between group transition-all shadow-lg shadow-slate-900/20"
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} />
                  <span>进入管理系统</span>
                </div>
                <ArrowRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={() => setStep('options')} className="p-1 -ml-2 rounded-lg hover:bg-black/5"><ArrowLeft size={20}/></button>
              <div className="w-10 h-10 bg-blue-500/10 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-600 border border-blue-500/20">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">提交新网站</h2>
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
              <div>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:bg-white/60 focus:outline-none text-sm transition-colors"
                  placeholder="网站名称"
                />
              </div>
              <div>
                <input
                  required
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:bg-white/60 focus:outline-none text-sm transition-colors"
                  placeholder="官网链接"
                />
              </div>
              <div>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value as CategoryId})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:bg-white/60 focus:outline-none text-sm text-slate-600 appearance-none transition-colors"
                >
                  <option value="chat">对话 (Chat)</option>
                  <option value="study">学习 (Study)</option>
                  <option value="work">办公 (Work)</option>
                  <option value="life">生活 (Life)</option>
                  <option value="media">多媒体 (Media)</option>
                  <option value="agent">智能体 (Agent)</option>
                </select>
              </div>
              <div>
                <input
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:bg-white/60 focus:outline-none text-sm transition-colors"
                  placeholder="标签 (逗号分隔)"
                />
              </div>
              <div>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-white/50 focus:bg-white/60 focus:outline-none text-sm resize-none transition-colors"
                  placeholder="一句话介绍"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-blue-600/90 backdrop-blur-md text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 border border-white/20"
            >
              <Send size={16} /> 立即发布
            </button>
          </form>
        )}
      </div>
    </div>
  );
};