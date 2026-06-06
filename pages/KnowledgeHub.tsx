
import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, Lightbulb, ShieldAlert, ScanLine, UtensilsCrossed, ChefHat, Calendar } from 'lucide-react';
import { fetchArticlesFromSupabase, Article } from '../services/supabaseService';
import { ArticleModal } from '../components/modals/ArticleModal';

export const KnowledgeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blog' | 'tips'>('blog');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Tips Data
  const tips = [
    {
      id: 1,
      title: "المصادر الخفية",
      content: "انتبه من مكعبات المرق، الصويا صوس، واللحوم المصنعة، فهي غالباً تحتوي على القمح.",
      icon: <ScanLine className="w-6 h-6 text-purple-500" />,
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-100 dark:border-purple-900/30"
    },
    {
      id: 2,
      title: "خطر التلوث",
      content: "في المطاعم، اسأل عن زيت القلي. البطاطس المقلية في نفس زيت البروستد غير آمنة.",
      icon: <UtensilsCrossed className="w-6 h-6 text-orange-500" />,
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-100 dark:border-orange-900/30"
    },
    {
      id: 3,
      title: "مصطلحات غامضة",
      content: "احذر من \"نشاء معدل\" أو \"نكهات طبيعية\" إذا لم يذكر المصدر، فقد تكون من القمح.",
      icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-100 dark:border-red-900/30"
    },
    {
      id: 4,
      title: "أدوات المطبخ",
      content: "الجلوتين يلتصق! خصص محمصة خبز ومصفاة خاصة بك، فهذه الأدوات يصعب تنظيفها.",
      icon: <ChefHat className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-900/30"
    }
  ];

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
        <div className="flex items-center gap-2">
           <div className="bg-teal-100 dark:bg-teal-900/30 p-1.5 rounded-lg">
             <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">مساحة المعرفة 💡</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-0.5 rounded-[0.8rem] border border-gray-200/50 dark:border-gray-700/50">
           <button
             onClick={() => setActiveTab('blog')}
             className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
               activeTab === 'blog' 
               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none' 
               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
             }`}
           >
             المقالات
           </button>
           <button
             onClick={() => setActiveTab('tips')}
             className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
               activeTab === 'tips' 
               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none' 
               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
             }`}
           >
             نصائح
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[220px]">
        {activeTab === 'blog' ? (
          /* BLOG CONTENT */
          loading ? (
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
            </div>
          )
        ) : (
          /* TIPS CONTENT */
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-3 snap-x snap-mandatory hide-scrollbar animate-fade-in">
            {tips.map((item) => (
              <div 
                key={item.id} 
                className={`min-w-[240px] w-[240px] snap-center bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border ${item.border} flex flex-col transition-all active:scale-[0.98] duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4 shrink-0`}>
                    {item.icon}
                </div>
                <div className="flex-1 flex flex-col">
                    <h4 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        {item.content}
                    </p>
                </div>
              </div>
            ))}
            <div className="w-2 shrink-0"></div>
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
