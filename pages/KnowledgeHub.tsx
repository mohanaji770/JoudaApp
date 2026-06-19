
import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchArticlesFromSupabase, Article } from '../services/supabaseService';
import { ArticleModal } from '../components/modals/ArticleModal';

export const KnowledgeHub: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchArticlesFromSupabase();
      setArticles(data.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="w-full animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="text-brand-600">💡</span>
          <span>مساحة المعرفة</span>
        </h3>
      </div>

      {/* Content Area */}
      <div className="min-h-[220px]">
          {/* BLOG CONTENT */}
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-4 px-1 hide-scrollbar">
               {[1, 2].map(i => (
                  <div key={i} className="min-w-[260px] h-[280px] bg-gray-50 dark:bg-gray-800/40 rounded-3xl animate-pulse shrink-0"></div>
               ))}
            </div>
          ) : articles.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">لا توجد مقالات حالياً</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-6 pt-1 px-1 -mx-1 snap-x snap-mandatory hide-scrollbar animate-fade-in">
              {articles.map((article) => (
                <div 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="min-w-[260px] max-w-[260px] bg-gray-50 dark:bg-gray-800/40 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group snap-center shrink-0 flex flex-col overflow-hidden active:scale-[0.98] border border-transparent"
                >
                  <div className="relative h-40 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-t-3xl">
                     {article.image ? (
                       <img src={article.image} alt={article.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-teal-50 dark:bg-teal-900/20">
                          <BookOpen className="w-10 h-10 text-teal-300 dark:text-teal-500/50" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4 flex flex-col flex-1 relative bg-white/50 dark:bg-gray-900/50">
                     <h4 className="font-bold text-[15px] text-gray-900 dark:text-white line-clamp-2 leading-snug mb-3">
                       {article.title}
                     </h4>
                     
                     {/* Clean Metadata Line */}
                     <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/50">
                       <span className="flex items-center gap-1.5">
                         <Calendar className="w-3.5 h-3.5" /> {article.date}
                       </span>
                     </div>
                  </div>
                </div>
              ))}
              
              {/* View All Card */}
              <div 
                onClick={() => navigate('/articles')}
                className="min-w-[160px] max-w-[160px] bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-300 cursor-pointer group snap-center shrink-0 flex flex-col items-center justify-center active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <ArrowLeft className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">عرض الكل</span>
              </div>
            </div>
          )}
      </div>

      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
