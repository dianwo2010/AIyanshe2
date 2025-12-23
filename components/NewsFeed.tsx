import React from 'react';
import { Calendar, ExternalLink, Newspaper, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
  error: boolean;
  onRefresh?: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, loading, error, onRefresh }) => {
  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs < 24) {
        return `${Math.ceil(diffHrs)}小时前`;
      }
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="animate-fade-in-up pb-10">
      {/* Header Banner */}
      <div className="mb-6 p-5 rounded-[24px] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden flex items-center justify-between">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="relative z-10 flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            <Newspaper size={20} /> AI 前沿快讯
          </h2>
          <p className="text-indigo-100 text-sm opacity-90">
            {loading ? "正在连接全球科技网络..." : "聚焦纯粹的 AI 技术与产业动态"}
          </p>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="relative z-10 ml-4 p-2.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm flex-shrink-0"
            aria-label="刷新资讯"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && news.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 size={32} className="animate-spin mb-3 text-indigo-500" />
          <p className="text-xs font-medium animate-pulse">正在筛选最有价值的 AI 资讯...</p>
        </div>
      )}

      {/* Error State (showing fallback logic is handled in App, but if list is empty show this) */}
      {!loading && error && news.length === 0 && (
        <div className="mb-6 mx-1 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3 text-orange-700 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">资讯获取受限</p>
            <p className="opacity-80">当前网络无法连接到实时数据源。</p>
          </div>
        </div>
      )}
      
      {!loading && !error && news.length === 0 && (
         <div className="py-12 text-center text-slate-400 text-sm">暂无符合条件的科技新闻</div>
      )}

      {/* News List */}
      <div className="space-y-4">
        {news.map((item, index) => (
          <a
            key={item.guid || index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group block bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all active:scale-[0.99] ${loading ? 'opacity-70' : ''}`}
          >
            <div className="flex gap-4">
              {/* Text Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                       {item.author || "Tech News"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Calendar size={10} />
                      {formatDate(item.pubDate)}
                    </span>
                  </div>
                </div>
                
                {/* Mobile-friendly snippet */}
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                   {item.description.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                </p>
              </div>

              {/* Thumbnail Image (Right side) */}
              {item.thumbnail && (
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                  <img 
                    src={item.thumbnail} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Category Badge overlay */}
                   <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-[8px] text-white px-1.5 rounded-full">
                      News
                   </div>
                </div>
              )}
            </div>
            
            {/* Read More Link (Visual only) */}
            <div className="mt-3 flex items-center justify-end text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
               阅读全文 <ExternalLink size={12} className="ml-1" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-8 text-center pb-8">
        <p className="text-xs text-slate-300">
            内容来源: 量子位 (QbitAI) & TechCrunch <br/>
            仅展示 AI 与前沿科技内容
        </p>
      </div>
    </div>
  );
};