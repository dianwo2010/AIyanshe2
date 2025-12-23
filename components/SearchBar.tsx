import React from 'react';
import { Search, X, ChevronLeft, Home } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  canGoBack: boolean;
  onBack: () => void;
  onHome: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, canGoBack, onBack, onHome }) => {
  return (
    <div className="sticky top-0 z-40 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 transition-all duration-300 shadow-sm shadow-slate-200/20 flex items-center gap-2 sm:gap-3">
      {/* Back Button - Only visible when needed */}
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex-shrink-0 p-2.5 rounded-xl bg-white/50 border border-white/60 text-slate-600 shadow-sm hover:bg-white/80 hover:text-blue-600 active:scale-95 transition-all animate-fade-in"
          aria-label="返回上一级"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div className="relative group flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索 AI 网站..."
          className="block w-full pl-10 pr-10 py-3 bg-slate-100/50 hover:bg-white/70 focus:bg-white/90 backdrop-blur-md border border-transparent focus:border-blue-500/30 rounded-2xl leading-5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner transition-all text-base"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
          >
            <div className="bg-slate-200/80 rounded-full p-0.5 hover:bg-slate-300 transition-colors">
              <X className="h-3 w-3 text-slate-500" />
            </div>
          </button>
        )}
      </div>

      {/* Home Button */}
      <button
        onClick={onHome}
        className="flex-shrink-0 p-2.5 rounded-xl bg-white/50 border border-white/60 text-slate-600 shadow-sm hover:bg-white/80 hover:text-blue-600 active:scale-95 transition-all"
        aria-label="回到首页"
      >
        <Home size={20} />
      </button>
    </div>
  );
};