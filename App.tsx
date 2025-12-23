import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  MessageCircle, // Chat
  GraduationCap, // Study
  Briefcase,     // Work
  Coffee,        // Life
  Film,          // Media
  Bot,           // Agent
  Home,
  Settings2,     // New Admin Icon
  FlaskConical,  // Brand Logo Icon (Lab/Research)
  Zap,
  Hash,
  ChevronRight,
  LayoutGrid,
  Search,
  Newspaper,      // News Icon
  Clock
} from 'lucide-react';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { Category, CategoryId, Tool, NewsItem } from './types';
import { toolsData } from './data';
import { supabaseConfig } from './config'; // Import Config
import { SearchBar } from './components/SearchBar';
import { FloatingMenu } from './components/FloatingMenu';
import { ToolCard } from './components/ToolCard';
import { TagCloud } from './components/TagCloud';
import { AddToolModal } from './components/AddToolModal';
import { HeroCarousel } from './components/HeroCarousel';
import { AdminDashboard } from './components/AdminDashboard';
import { NewsFeed } from './components/NewsFeed';

// Category Definitions mapping - UPDATED to 7 Categories (Added News)
const CATEGORIES: Category[] = [
  { id: 'new', label: '首页', icon: Home, color: 'from-orange-400 to-red-400', iconColor: 'text-white' },
  { id: 'news', label: '资讯', icon: Newspaper, color: 'from-indigo-400 to-purple-400', iconColor: 'text-white' },
  { id: 'chat', label: '对话', icon: MessageCircle, color: 'from-blue-400 to-cyan-400', iconColor: 'text-white' },
  { id: 'study', label: '学习', icon: GraduationCap, color: 'from-emerald-400 to-green-400', iconColor: 'text-white' },
  { id: 'work', label: '办公', icon: Briefcase, color: 'from-sky-400 to-blue-400', iconColor: 'text-white' },
  { id: 'life', label: '生活', icon: Coffee, color: 'from-amber-400 to-yellow-400', iconColor: 'text-white' },
  { id: 'media', label: '多媒体', icon: Film, color: 'from-fuchsia-400 to-pink-400', iconColor: 'text-white' },
  { id: 'agent', label: '智能体', icon: Bot, color: 'from-teal-400 to-cyan-400', iconColor: 'text-white' },
];

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "OpenAI 发布 GPT-5 预览版：推理能力大幅提升",
    pubDate: new Date().toISOString(),
    link: "https://openai.com/blog",
    guid: "fallback-1",
    author: "OpenAI",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
    description: "最新的模型展示了在数学和编程领域的突破性进展...",
    content: ""
  },
  {
    title: "Midjourney V7 更新：支持 3D 建模与视频生成",
    pubDate: new Date(Date.now() - 86400000).toISOString(),
    link: "https://www.midjourney.com",
    guid: "fallback-2",
    author: "Midjourney",
    thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000",
    description: "生成的图像细节更加惊人，且新增了时间轴控制功能...",
    content: ""
  },
];

// Helper: Resolve DB Config (File > LocalStorage)
const getDbConfig = () => {
  if (supabaseConfig.url && supabaseConfig.anonKey) {
    return supabaseConfig;
  }
  try {
    const saved = localStorage.getItem('ai-db-config-public');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { url: '', anonKey: '' };
};

function App() {
  // --- State Initialization ---
  const [tools, setTools] = useState<Tool[]>(() => {
    try {
      const saved = localStorage.getItem('ai-tools-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Safety check to ensure parsed data is an array
        if (Array.isArray(parsed)) return parsed;
      }
      return toolsData;
    } catch (e) {
      return toolsData;
    }
  });

  // --- Sync from Cloud on Mount ---
  useEffect(() => {
    const fetchFromCloud = async () => {
      const dbConfig = getDbConfig();
      
      // 1. Check if config exists
      if (!dbConfig.url || !dbConfig.anonKey) return;

      try {
        // 2. Init Client (Public Read)
        const supabase = createClient(dbConfig.url, dbConfig.anonKey);
        
        // 3. Fetch Data
        const { data, error } = await supabase.from('tools').select('*');
        
        if (error) throw error;

        // 4. Update State if data exists
        if (data && Array.isArray(data) && data.length > 0) {
           console.log("☁️ Cloud Sync: Loaded", data.length, "items");
           setTools(data as Tool[]);
           // Optional: Update local cache so next load is faster before sync
           localStorage.setItem('ai-tools-data', JSON.stringify(data));
        }
      } catch (err) {
        console.error("Cloud Sync Error:", err);
        // Fail silently, fall back to local data
      }
    };

    fetchFromCloud();
  }, []);

  // --- News State ---
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);

  // Persist changes to LocalStorage (Manual changes by user)
  useEffect(() => {
    localStorage.setItem('ai-tools-data', JSON.stringify(tools));
  }, [tools]);

  const [activeCategory, setActiveCategory] = useState<CategoryId>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'home' | 'admin'>('home');

  // --- Gesture State ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // --- Helper: Simple Date Formatter for Snippets ---
  const formatTimeSnippet = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 1) return '刚刚';
      if (diffHrs < 24) return `${Math.ceil(diffHrs)}小时前`;
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      return '';
    }
  };

  // --- Fetch News Logic (Refactored for Refresh with Shuffle) ---
  const fetchNews = useCallback(async () => {
    const RSS_URL = 'https://www.qbitai.com/feed';
    // Add timestamp to prevent caching
    const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}&t=${Date.now()}`;
    
    try {
      setNewsLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.status === 'ok' && data.items) {
        // Process items
        const rawItems: any[] = data.items;
        const processed = rawItems.map(item => {
           let img = item.thumbnail;
           if (!img && item.content) {
             const match = item.content.match(/<img[^>]+src="([^">]+)"/);
             if (match) img = match[1];
           }
           // Clean description
           const rawDesc = item.description || '';
           const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

           return { ...item, thumbnail: img, description: cleanDesc };
        });

        // --- FILTERING LOGIC for Pure Tech ---
        const EXCLUDE_KEYWORDS = ['明星', '绯闻', '体育', '足球', '篮球', '娱乐', '演唱会', '代言', '综艺'];
        
        const filteredNews = processed.filter(item => {
          const text = (item.title + item.description).toLowerCase();
          const hasExclude = EXCLUDE_KEYWORDS.some(kw => text.includes(kw));
          return !hasExclude; // Keep if it doesn't have exclude words
        });

        // --- SHUFFLE LOGIC ---
        // Randomly shuffle the array to simulate "grabbing a random batch"
        for (let i = filteredNews.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filteredNews[i], filteredNews[j]] = [filteredNews[j], filteredNews[i]];
        }

        setNews(filteredNews);
        setNewsError(false);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (err) {
      console.error("News fetch error:", err);
      setNewsError(true);
      
      // Also shuffle fallback news on error
      const shuffledFallback = [...FALLBACK_NEWS].sort(() => 0.5 - Math.random());
      setNews(prev => prev.length > 0 ? prev : shuffledFallback);
    } finally {
      // Artificial delay (500ms) to ensure users see the refresh spin animation
      setTimeout(() => {
        setNewsLoading(false);
      }, 500);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);


  // --- Logic ---

  // Extract all unique tags dynamically
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    tools.forEach(tool => {
      if (tool.tags) {
        tool.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return Object.keys(tagCounts).sort((a, b) => {
      const countDiff = tagCounts[b] - tagCounts[a];
      if (countDiff !== 0) return countDiff;
      return a.localeCompare(b, 'zh-Hans-CN');
    });
  }, [tools]);

  // Filtering Logic for Tools
  const filteredTools = useMemo(() => {
    let result = tools;
    if (selectedTag === 'ALL') {
      return [...tools].sort((a, b) => (a.isHot === b.isHot ? 0 : a.isHot ? -1 : 1));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return result.filter(
        (t) => 
          t.name.toLowerCase().includes(q) || 
          t.description.toLowerCase().includes(q) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    } 
    if (selectedTag) {
      return result.filter(t => t.tags && t.tags.includes(selectedTag));
    }
    if (activeCategory === 'new') {
      return result.filter((t) => t.isHot);
    } else {
      return result.filter((t) => t.categoryId === activeCategory);
    }
  }, [searchQuery, activeCategory, selectedTag, tools]);

  // --- Carousel Logic (Mixed Tools + News) ---
  const featuredTools = useMemo(() => {
    // 1. Get Top Tools
    const hotTools = tools.filter(t => t.isHot).slice(0, 4);
    
    // 2. Convert Top 3 News to Tool format
    const hotNewsAsTools: Tool[] = news.slice(0, 3).map(item => ({
       id: `news-${item.guid}`,
       name: item.title,
       description: item.description,
       url: item.link,
       iconUrl: item.thumbnail || '',
       categoryId: 'news',
       isHot: true,
       tags: ['新闻', '前沿']
    }));

    // 3. Interleave or Combine (Put 1 news at start, then tools, then rest of news)
    if (hotNewsAsTools.length > 0) {
        return [hotNewsAsTools[0], ...hotTools, ...hotNewsAsTools.slice(1)];
    }
    
    return hotTools;
  }, [tools, news]);

  // Get snippets for the "Latest News" list below carousel
  const newsSnippets = useMemo(() => {
    return news.slice(0, 3);
  }, [news]);

  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory);

  const handleAddTool = (newTool: Tool) => {
    setTools(prev => [newTool, ...prev]);
    if (newTool.isHot) setActiveCategory('new');
    else setActiveCategory(newTool.categoryId);
  };

  // View States
  const isAllMode = selectedTag === 'ALL';
  const isDashboardView = activeCategory === 'new' && !searchQuery && !selectedTag;
  const isNewsView = activeCategory === 'news' && !searchQuery && !selectedTag;

  // Title Logic
  const mainTitle = isDashboardView 
    ? 'AI研社' 
    : isNewsView ? 'AI资讯'
    : isAllMode ? '全部网站' : (selectedTag ? selectedTag : activeCategoryData?.label);
    
  const subTitle = isDashboardView 
    ? '实验室' 
    : isNewsView ? 'News'
    : isAllMode ? 'All' : (selectedTag ? 'Tag' : 'Station');

  // Navigation Logic
  const canGoBack = !!searchQuery || !!selectedTag || activeCategory !== 'new';
  const handleBack = () => {
    if (searchQuery) { setSearchQuery(''); return; }
    if (selectedTag) { setSelectedTag(null); return; }
    if (activeCategory !== 'new') { setActiveCategory('new'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  };

  // Swipe Handlers
  const minSwipeDistance = 60;
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isRightSwipe && canGoBack) handleBack();
  };

  // --- Navigation Handler for Categories ---
  const handleNavigateToCategory = (id: CategoryId) => {
    setActiveCategory(id);
    setSearchQuery('');
    setSelectedTag(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'admin') {
    return (
      <AdminDashboard 
        tools={tools} 
        setTools={setTools} 
        onExit={() => {
           setView('home');
           // Re-sync on exit in case admin changed public config
           const dbConfig = getDbConfig();
           if (dbConfig.url) window.location.reload(); // Simple reload to pick up new config
        }}
        onSelectTag={(tag) => { setSelectedTag(tag); setView('home'); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />
    );
  }

  return (
    <div 
      className="min-h-screen pb-24 text-slate-900 selection:bg-cyan-100/50"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <SearchBar 
        value={searchQuery} 
        onChange={setSearchQuery} 
        canGoBack={canGoBack} 
        onBack={handleBack} 
        onHome={() => handleNavigateToCategory('new')} 
      />

      <main className="px-4 sm:px-5 mt-4 sm:mt-6 animate-fade-in-up max-w-7xl mx-auto">
        {!searchQuery && (
          <div className="mb-6 pl-1 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isDashboardView ? (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/20 transform transition-transform hover:scale-105 border border-white/10">
                     <FlaskConical size={26} className="text-white opacity-90" strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className={`w-10 h-10 backdrop-blur-md rounded-[14px] flex items-center justify-center shadow-lg shadow-slate-900/10 transform transition-transform hover:scale-105 border border-white/10 ${selectedTag ? (isAllMode ? 'bg-slate-800 text-white' : 'bg-cyan-600 text-white') : 'bg-slate-900/90 text-white'}`}>
                     {isAllMode ? <LayoutGrid size={20} className="opacity-90" /> : selectedTag ? <Hash size={20} className="opacity-90" /> : isNewsView ? <Newspaper size={20} className="opacity-90" /> : <Zap size={20} className="fill-current text-yellow-300" />}
                  </div>
                )}
                
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight drop-shadow-sm">
                  <span className={isDashboardView ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 font-black tracking-tighter" : ""}>
                    {mainTitle}
                  </span>
                  <span className="text-slate-400/50 font-medium text-2xl">/</span>
                  <span className="text-slate-400 font-medium text-xl">{subTitle}</span>
                </h1>
              </div>

              <p className="text-slate-500 font-medium text-[15px] leading-relaxed pl-1">
                {isAllMode ? `共收录 ${tools.length} 个 AI 实验项目，按热度排序。` : selectedTag ? `浏览包含 "${selectedTag}" 标签的实验项目。` : isNewsView ? "聚焦纯粹的 AI 技术与产业动态，拒绝噪音。" : isDashboardView ? "探索前沿 AI 工具，你的数字实验室。" : `为你精选最佳 ${activeCategoryData?.label} 资源。`}
              </p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="mt-2 p-2.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-full shadow-sm text-slate-600 hover:text-cyan-600 hover:bg-white/80 transition-all active:scale-95"
              aria-label="进入后台"
            >
              <Settings2 size={20} />
            </button>
          </div>
        )}

        {!isNewsView && <TagCloud tags={allTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />}

        {/* Hero Carousel: Shows mixed News and Tools on Dashboard */}
        {isDashboardView && (
          <>
            <HeroCarousel tools={featuredTools} />
            
            {/* LATEST NEWS SNIPPET SECTION */}
            {newsSnippets.length > 0 && (
              <div className="mb-8 px-1">
                 <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                       <Zap size={14} className="text-indigo-500 fill-current" />
                       最新资讯
                    </h3>
                    <button 
                       onClick={() => handleNavigateToCategory('news')}
                       className="text-xs font-bold text-indigo-500 flex items-center gap-0.5 hover:underline p-2 -mr-2 cursor-pointer active:opacity-70 transition-opacity"
                    >
                       全部 <ChevronRight size={12} />
                    </button>
                 </div>
                 <div className="bg-white/60 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-sm divide-y divide-slate-100/60 overflow-hidden">
                    {newsSnippets.map((item, i) => (
                       <div 
                         key={i}
                         onClick={() => handleNavigateToCategory('news')}
                         className="flex items-start gap-3 p-3.5 hover:bg-white/50 transition-colors active:bg-slate-100/50 cursor-pointer"
                       >
                         <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-1.5">
                               {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                               <span className="bg-white/50 px-1 rounded">{item.author || 'AI News'}</span>
                               <span className="flex items-center gap-0.5"><Clock size={10} /> {formatTimeSnippet(item.pubDate)}</span>
                            </div>
                         </div>
                         {item.thumbnail && (
                            <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-100 border border-white overflow-hidden shadow-sm">
                               <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                         )}
                       </div>
                    ))}
                 </div>
              </div>
            )}
          </>
        )}

        {searchQuery && (
          <div className="mb-6 pl-1 flex items-center justify-between">
             <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-lg shadow-sm">
                    <Search size={14} className="text-cyan-600"/>
                </div>
                <span>找到 {filteredTools.length} 个相关结果</span>
             </div>
             <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold text-cyan-600 hover:underline">+ 提交新资源</button>
          </div>
        )}

        {isNewsView ? (
          <NewsFeed news={news} loading={newsLoading} error={newsError} onRefresh={fetchNews} />
        ) : isDashboardView ? (
          <div className="space-y-8">
            {CATEGORIES.filter(c => c.id !== 'new' && c.id !== 'news').map(cat => {
              const catTools = tools.filter(t => t.categoryId === cat.id).slice(0, 4);
              if (catTools.length === 0) return null;
              return (
                <div key={cat.id} className="animate-fade-in-up">
                  {/* Category Header with Actionable Click Area */}
                  <div 
                    onClick={() => handleNavigateToCategory(cat.id)}
                    className="flex items-center justify-between mb-4 cursor-pointer group active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-sm`}>
                          <cat.icon size={16} className="text-white" />
                       </div>
                       <h2 className="text-lg font-bold text-slate-800">{cat.label}</h2>
                    </div>
                    <button className="flex items-center text-xs font-bold text-slate-400 group-hover:text-cyan-600 transition-colors">
                      查看更多 <ChevronRight size={14} />
                    </button>
                  </div>
                  {/* Optimized Grid for Mobile: gap-2 instead of gap-3 */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {catTools.map(tool => <ToolCard key={tool.id} tool={tool} accentColor={`bg-gradient-to-br ${cat.color}`} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Optimized Grid for Mobile: gap-2 */
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => {
                const catColor = CATEGORIES.find(c => c.id === tool.categoryId)?.color || 'from-slate-200 to-gray-100';
                return <ToolCard key={tool.id} tool={tool} accentColor={`bg-gradient-to-br ${catColor}`} compact={isAllMode} />;
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-20 h-20 bg-white/40 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/50 flex items-center justify-center mb-6"><Search size={32} className="opacity-30" /></div>
                <p className="font-medium">没有找到相关资源</p>
                <button onClick={() => { setSearchQuery(''); setSelectedTag(null); }} className="mt-4 text-cyan-600 font-semibold text-sm hover:underline">清除筛选</button>
              </div>
            )}
          </div>
        )}
      </main>

      <FloatingMenu categories={CATEGORIES} activeId={activeCategory} onSelect={handleNavigateToCategory} />
      <AddToolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddTool} onEnterAdmin={() => setView('admin')} />
    </div>
  );
}

export default App;