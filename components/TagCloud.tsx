import React, { useState } from 'react';
import { Tag, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';

interface TagCloudProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const TagCloud: React.FC<TagCloudProps> = ({ tags, selectedTag, onSelectTag }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // We always render the tag list, even if empty (though logic in App usually prevents empty lists)
  if (tags.length === 0 && !selectedTag) return null;

  const DISPLAY_LIMIT = 10;
  const showToggle = tags.length > DISPLAY_LIMIT;
  
  const displayedTags = isExpanded ? tags : tags.slice(0, DISPLAY_LIMIT);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 px-1 transition-all duration-300">
      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/40 backdrop-blur-md text-slate-400 mr-1 border border-white/30 shadow-sm">
        <Tag size={12} />
      </div>
      
      {/* "All" Button for Compact View */}
      <button
        onClick={() => onSelectTag(selectedTag === 'ALL' ? null : 'ALL')}
        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 border shadow-sm backdrop-blur-md flex items-center gap-1 ${
          selectedTag === 'ALL'
            ? 'bg-slate-800 border-slate-700 text-white'
            : 'bg-white/40 border-white/40 text-slate-600 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        <LayoutGrid size={12} />
        全部
      </button>

      {/* Dynamic Tags */}
      {displayedTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
          className={`px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 border shadow-sm backdrop-blur-md ${
            selectedTag === tag
              ? 'bg-blue-500/90 border-blue-500/50 text-white'
              : 'bg-white/40 border-white/40 text-slate-600 hover:bg-white/60 hover:text-blue-600'
          }`}
        >
          {tag}
        </button>
      ))}

      {showToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1 rounded-xl text-xs font-medium bg-white/30 text-slate-500 hover:bg-white/50 transition-colors flex items-center gap-1 border border-white/30 backdrop-blur-md"
        >
          {isExpanded ? (
            <>收起 <ChevronUp size={12} /></>
          ) : (
            <>更多 <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  );
};