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
          <span>تعرّف أكثر عن الجلوتين.</span>
        </h3>
      </div>

      {/* Content Area */}
      <div className="min-h-[220px]">
        {/* BLOG CONTENT */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-20 bg-gray-50 dark:bg-gray-800/40 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">لا توجد مقالات حالياً</div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="w-full bg-white dark:bg-gray-900 rounded-[1.25rem] border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none p-3 cursor-pointer active:scale-[0.99] hover:shadow-md transition-all duration-300 flex items-center gap-4 text-right"
              >
                {/* Content Side (Right) */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <span className="inline-block text-[11px] font-black text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-900/20 px-2.5 py-0.5 rounded-full mb-1">
                      مقالة المعرفة
                    </span>
                    <h4 className="font-black text-[13px] text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{article.date}</span>
                  </div>
                </div>

                {/* Thumbnail Side (Left) */}
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-100/50 dark:border-gray-700 shadow-inner">
                  {article.image ? (
                    <img src={article.image} alt={article.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-50 dark:bg-brand-950/20">
                      <BookOpen className="w-6 h-6 text-brand-300 dark:text-brand-600/50" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* "عرض الكل" Button at the bottom of the list */}
            <button
              onClick={() => navigate('/articles')}
              className="w-full h-12 bg-white dark:bg-gray-900 hover:bg-brand-50 dark:hover:bg-brand-950/20 rounded-[1.25rem] border border-dashed border-gray-200 dark:border-gray-800 hover:border-brand-500 hover:border-solid transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.99] mt-1"
            >
              <span className="font-bold text-xs text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">عرض جميع المقالات</span>
              <ArrowLeft className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:-translate-x-1 transition-all" />
            </button>
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
