import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ExternalLink, Newspaper } from 'lucide-react';
import { Tool } from '../types';

interface HeroCarouselProps {
  tools: Tool[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ tools }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Helper to get high-res favicon URL for background
  const getHighResLogo = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      // Requesting larger size (256px) for background usage
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    } catch (e) {
      return '';
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (isPaused || tools.length <= 1) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        let nextIndex = activeIndex + 1;
        
        // Loop back to start
        if (nextIndex >= tools.length) {
            nextIndex = 0;
        }

        const nextNode = container.children[nextIndex] as HTMLElement;
        if (nextNode) {
             const containerWidth = container.clientWidth;
             const itemWidth = nextNode.clientWidth;
             const offsetLeft = nextNode.offsetLeft;
             
             const scrollLeft = offsetLeft - (containerWidth / 2) + (itemWidth / 2);
             
             container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
        
        setActiveIndex(nextIndex);
      }
    }, 4000); 

    return () => clearInterval(interval);
  }, [activeIndex, isPaused, tools.length]);

  // Handle manual scroll
  const handleScroll = () => {
      if (scrollRef.current) {
          const container = scrollRef.current;
          const containerCenter = container.scrollLeft + container.clientWidth / 2;
          
          let closestIndex = 0;
          let minDiff = Infinity;

          Array.from(container.children).forEach((child, index) => {
              const htmlChild = child as HTMLElement;
              const childCenter = htmlChild.offsetLeft + htmlChild.clientWidth / 2;
              const diff = Math.abs(containerCenter - childCenter);
              
              if (diff < minDiff) {
                  minDiff = diff;
                  closestIndex = index;
              }
          });
          
          if (closestIndex !== activeIndex) {
              setActiveIndex(closestIndex);
          }
      }
  }

  if (tools.length === 0) return null;

  return (
    <div className="mb-8 relative flex flex-col items-center">
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="w-full flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-[5vw] sm:px-0 no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
        onScroll={handleScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {tools.map((tool, index) => {
            const isNews = tool.categoryId === 'news';
            const logoUrl = tool.iconUrl || getHighResLogo(tool.url);
            
            return (
              <div 
                key={tool.id} 
                className="flex-shrink-0 w-[85vw] sm:w-[360px] snap-center relative transition-all duration-500 ease-out py-2"
                style={{
                    transform: index === activeIndex ? 'scale(1)' : 'scale(0.95)',
                    opacity: index === activeIndex ? 1 : 0.6
                }}
              >
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative h-48 rounded-[32px] overflow-hidden group shadow-lg shadow-blue-500/10 active:scale-95 transition-all bg-slate-900"
                >
                  {/* Background Image Layer */}
                  <div className="absolute inset-0 z-0">
                      <img 
                        src={logoUrl} 
                        alt="" 
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 ${isNews ? 'opacity-80' : 'opacity-60 blur-md scale-110'}`}
                      />
                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/30" />
                      {/* Color tint based on index */}
                      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${
                        isNews ? 'from-indigo-600' :
                        index % 3 === 0 ? 'from-blue-600' :
                        index % 3 === 1 ? 'from-purple-600' :
                        'from-emerald-600'
                      } mix-blend-overlay`} />
                  </div>

                  {/* Content */}
                  <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">
                    <div className="flex justify-between items-start">
                      {/* Badge / Logo */}
                      {isNews ? (
                         <div className="flex items-center gap-1.5 bg-indigo-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/20 shadow-sm">
                             <Newspaper size={12} />
                             NEWS
                         </div>
                      ) : (
                         <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
                            <img src={logoUrl} className="w-full h-full object-contain rounded-lg" alt="logo" />
                         </div>
                      )}
                      
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm uppercase tracking-wider backdrop-blur-md ${
                          isNews ? 'bg-orange-500/20 border-orange-500/30 text-orange-200' : 'bg-white/20 border-white/10 text-white'
                      }`}>
                        {isNews ? <span className="animate-pulse">● Live</span> : <><Sparkles size={10} className="fill-current" /> Featured</>}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight drop-shadow-md flex items-center gap-2 line-clamp-2 leading-tight">
                          {tool.name}
                      </h2>
                      <p className="text-slate-200 text-xs sm:text-sm font-medium line-clamp-2 leading-relaxed drop-shadow-sm opacity-90">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            );
        })}
      </div>
      
      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-1">
          {tools.map((_, i) => (
              <button 
                key={i}
                onClick={() => {
                   if (scrollRef.current) {
                       const container = scrollRef.current;
                       const nextNode = container.children[i] as HTMLElement;
                       const scrollLeft = nextNode.offsetLeft - (container.clientWidth / 2) + (nextNode.clientWidth / 2);
                       container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                   }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-5 bg-slate-400' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
              />
          ))}
      </div>
    </div>
  );
};