import React, { useState, useEffect } from 'react';
import { KnowledgeHub } from './KnowledgeHub';
import { fetchFAQFromSupabase, FAQItem } from '../services/supabaseService';
import { ChevronDown, MessageCircle, HelpCircle, BookOpen, Sparkles } from 'lucide-react';

export const HealthPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'faq'>('articles');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);

  useEffect(() => {
    if (activeSubTab === 'faq' && faqs.length === 0) {
      const loadFaqs = async () => {
        try {
          setIsLoadingFaqs(true);
          const data = await fetchFAQFromSupabase();
          setFaqs(data);
        } catch (err) {
          console.error('Failed to load FAQs:', err);
        } finally {
          setIsLoadingFaqs(false);
        }
      };
      loadFaqs();
    }
  }, [activeSubTab, faqs.length]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col pb-16 animate-fade-in text-right">
      {/* Page Title & Intro */}
      <div className="mb-6 px-1">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5">صحتك بالدنيا 💚</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed max-w-md">
          نهتم بصحتك وسلامتك الغذائية. هنا تجد كل ما تحتاجه للعيش بأمان وحيوية بنمط حياة خالٍ تماماً من الجلوتين.
        </p>
      </div>

      {/* Segmented Sliding Tab Header */}
      <div className="bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-2xl flex mb-6 border border-gray-200/20 max-w-xs shrink-0 select-none">
        <button
          onClick={() => setActiveSubTab('articles')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'articles'
              ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-250'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دليل المعرفة</span>
        </button>
        <button
          onClick={() => setActiveSubTab('faq')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'faq'
              ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-250'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>أسئلة شائعة</span>
        </button>
      </div>

      {/* Content Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeSubTab === 'articles' ? (
          <div className="animate-fade-in">
            <KnowledgeHub />
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* FAQ Accordion Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 md:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">أسئلة وأجوبة تهمك حول الجلوتين</h3>
              <div className="space-y-3">
                {isLoadingFaqs ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border border-gray-100 dark:border-gray-750 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
                    </div>
                  ))
                ) : faqs.length > 0 ? (
                  faqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/30 dark:bg-gray-855/20">
                      <button 
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={openFaqId === faq.id}
                        className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className={`font-bold text-[13px] ${openFaqId === faq.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-200'}`}>
                          {faq.question}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-350 ${openFaqId === faq.id ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''}`} />
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${openFaqId === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-4 pb-4 pt-0 font-medium">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-6 font-bold">لا توجد أسئلة شائعة حالياً، اسألنا مباشرة عبر الواتساب! 💬</p>
                )}
              </div>
            </div>

            {/* AI Assistant Chat Preview Card */}
            <div className="bg-gradient-to-b from-brand-50/30 to-brand-100/10 dark:from-brand-950/15 dark:to-brand-950/5 p-5 rounded-3xl border border-brand-100/10 dark:border-brand-900/15 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-[13px] font-black text-gray-800 dark:text-gray-205">مساعد جوده الذكي ✨</h4>
              </div>

              {/* Stacked Chat Preview Bubbles */}
              <div className="flex flex-col gap-2.5">
                <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-250 text-xs font-bold px-4 py-2.5 rounded-2xl rounded-tr-none border border-gray-100 dark:border-gray-700 shadow-sm max-w-[85%] ml-auto text-right">
                  هل الشوفان مناسب للسيلياك؟ 🌾
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-250 text-xs font-bold px-4 py-2.5 rounded-2xl rounded-tr-none border border-gray-100 dark:border-gray-700 shadow-sm max-w-[85%] ml-auto text-right">
                  أيش أطلب لطفل عنده حساسية جلوتين؟ 👶
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-250 text-xs font-bold px-4 py-2.5 rounded-2xl rounded-tr-none border border-gray-100 dark:border-gray-700 shadow-sm max-w-[85%] ml-auto text-right">
                  هل هذا المنتج مناسب لنظامي؟ 🔍
                </div>
              </div>

              {/* Bottom Coming Soon Indicator */}
              <div className="flex items-center justify-between pt-3.5 border-t border-brand-100/20 dark:border-brand-900/10">
                <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>قريباً: مساعد يجاوبك خطوة بخطوة</span>
                </span>
                <span className="text-[9px] bg-brand-100/70 dark:bg-brand-900/30 text-brand-700 dark:text-brand-350 px-2.5 py-1 rounded-full font-black">
                  ميزة قادمة
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
