
import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, Lightbulb, ShieldAlert, ScanLine, UtensilsCrossed, ChefHat } from 'lucide-react';
import { fetchArticlesWithFallback, Article } from '../services/supabaseService';
import { ArticleModal } from './ArticleModal';

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
      const data = await fetchArticlesWithFallback();
      setArticles(data.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="w-full mt-8 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
           <div className="bg-teal-100 dark:bg-teal-900/30 p-1.5 rounded-lg">
             <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">مساحة المعرفة 💡</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
           <button
             onClick={() => setActiveTab('blog')}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
               activeTab === 'blog' 
               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
             }`}
           >
             المقالات
           </button>
           <button
             onClick={() => setActiveTab('tips')}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
               activeTab === 'tips' 
               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
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
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
               {[1, 2].map(i => (
                  <div key={i} className="min-w-[260px] h-40 bg-warm-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
               ))}
            </div>
          ) : articles.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">لا توجد مقالات حالياً</div>
          ) : (
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-3 snap-x snap-mandatory hide-scrollbar animate-fade-in">
              {articles.map((article) => (
                <div 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="min-w-[260px] w-[260px] snap-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex flex-col group"
                >
                  <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                     {article.image ? (
                       <img src={article.image} alt={article.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-teal-50 dark:bg-teal-900/20">
                          <BookOpen className="w-8 h-8 text-teal-200" />
                       </div>
                     )}
                     <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                     <span className="absolute bottom-2 right-2 text-[10px] text-white font-medium bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                       {article.date}
                     </span>
                  </div>
                  <div className="p-3 flex flex-1 flex-col justify-between">
                     <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-2 mb-2 leading-snug">
                       {article.title}
                     </h4>
                     <div className="flex items-center justify-end text-teal-600 dark:text-teal-400 text-xs font-bold gap-1 group-hover:gap-2 transition-all">
                        <span>اقرأ المزيد</span>
                        <ChevronLeft className="w-3 h-3" />
                     </div>
                  </div>
                </div>
              ))}
              <div className="w-2 shrink-0"></div>
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
