import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Category, CategoryId } from '../types';

interface FloatingMenuProps {
  categories: Category[];
  activeId: CategoryId;
  onSelect: (id: CategoryId) => void;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ categories, activeId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-8 z-50 flex flex-col items-end gap-3">
      {/* Expanded Menu Items */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ease-out-back origin-bottom-right ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'
      }`}>
        {categories.map((cat) => {
          const isActive = activeId === cat.id;
          const Icon = cat.icon;
          
          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelect(cat.id);
                setIsOpen(false);
              }}
              className="flex items-center justify-end group active:scale-95 transition-transform duration-100"
            >
              {/* Text Label */}
              <div className={`mr-3 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-sm border border-white/50 text-xs font-bold text-slate-600 transition-all duration-200 ${
                  isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}>
                {cat.label}
              </div>

              {/* 3D Button Icon */}
              <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all duration-200 border-t border-white/40 ${
                isActive 
                  ? `bg-gradient-to-br ${cat.color} shadow-[0_4px_0_0_rgba(0,0,0,0.15)] translate-y-0`
                  : 'bg-gradient-to-br from-white to-slate-100 shadow-[0_4px_0_0_rgb(203,213,225)] hover:bg-white'
              }`}>
                <Icon 
                  size={20} 
                  className={`drop-shadow-sm ${isActive ? 'text-white' : 'text-slate-500'}`} 
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Toggle Button - 3D Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-200 active:shadow-none active:translate-y-[4px] border-t border-white/30 z-50 ${
          isOpen 
            ? 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_4px_0_0_rgb(15,23,42)] text-white' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_0_0_rgb(30,58,138)] text-white'
        }`}
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
           {isOpen ? <X size={26} strokeWidth={3} /> : <Menu size={26} strokeWidth={3} />}
        </div>
      </button>
      
      {/* Backdrop for closing */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[-1] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};