import React, { useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  accentColor: string;
  compact?: boolean; // New prop for minimalist mode
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, accentColor, compact = false }) => {
  const [imageError, setImageError] = useState(false);

  // Helper to get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return '';
    }
  };

  const logoUrl = tool.iconUrl || getFaviconUrl(tool.url);

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col bg-white/60 backdrop-blur-xl rounded-[18px] sm:rounded-[20px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-white/60 hover:bg-white/80 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 overflow-hidden ring-1 ring-white/50 ${
        compact ? 'h-[80px] sm:h-[88px] p-2 sm:p-2.5 justify-center' : 'h-[128px] sm:h-[140px] p-2.5 sm:p-3'
      }`}
    >
      {/* Soft Glow Background - internal glass reflection */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColor} opacity-[0.12] rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:opacity-25 transition-opacity duration-500`} />

      {/* Header: Logo & Title */}
      <div className={`flex items-center justify-between z-10 ${compact ? 'mb-1' : 'mb-1.5'}`}>
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className={`rounded-[10px] bg-white/80 backdrop-blur-sm shadow-sm border border-white/50 flex items-center justify-center flex-shrink-0 overflow-hidden p-1 ring-1 ring-black/5 ${compact ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'}`}>
            {!imageError ? (
              <img 
                src={logoUrl} 
                alt={tool.name} 
                className="w-full h-full object-contain rounded-md" 
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-xs font-bold text-slate-400">{tool.name.charAt(0)}</span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-[12px] sm:text-[13px] truncate leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
            {tool.name}
          </h3>
        </div>
        
        {tool.isHot && (
          <div className="flex-shrink-0 flex items-center gap-0.5 bg-red-500/10 backdrop-blur-md px-1 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold text-red-500 border border-red-500/20 shadow-sm">
             <Sparkles size={6} className="fill-current animate-pulse" /> 
             HOT
          </div>
        )}
      </div>

      {/* Body: Description (Hidden in Compact Mode) */}
      {!compact && (
        <div className="z-10 flex flex-col flex-grow min-h-0">
          <p className="text-[10px] sm:text-[11px] text-slate-600/90 font-medium leading-relaxed line-clamp-2 mix-blend-hard-light mb-1">
            {tool.description}
          </p>
        </div>
      )}

      {/* Tags: Show only main tags in compact mode */}
      {tool.tags && tool.tags.length > 0 && (
        <div className={`z-10 flex flex-wrap gap-1 ${compact ? '' : 'mt-auto pt-0.5'}`}>
          {tool.tags.slice(0, compact ? 1 : 2).map((tag) => (
            <span key={tag} className="inline-block px-1.5 py-0.5 rounded-[6px] bg-white/50 backdrop-blur-sm border border-white/40 text-slate-500 text-[8px] sm:text-[9px] font-semibold leading-none shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hover Icon */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ExternalLink size={10} className="text-slate-400" />
      </div>
    </a>
  );
};