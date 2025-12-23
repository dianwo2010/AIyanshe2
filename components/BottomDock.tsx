import React from 'react';
import { Category, CategoryId } from '../types';

interface BottomDockProps {
  categories: Category[];
  activeId: CategoryId;
  onSelect: (id: CategoryId) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 p-2.5 bg-white/60 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/40 rounded-[32px] max-w-full overflow-x-auto no-scrollbar ring-1 ring-white/30">
        {categories.map((cat) => {
          const isActive = activeId === cat.id;
          const Icon = cat.icon;
          
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[24px] transition-all duration-300 ease-out-back group ${
                isActive 
                  ? 'bg-slate-900/90 text-white shadow-lg shadow-slate-900/20 scale-105 backdrop-blur-md' 
                  : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
              }`}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : 'group-hover:scale-110'}`} 
              />
              
              <span className={`absolute bottom-2 text-[9px] font-bold tracking-wide transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};