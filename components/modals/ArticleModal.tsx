import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { X, Calendar, User, Share2 } from 'lucide-react';
import { Article } from '../../services/supabaseService';
import { useScrollLock } from '../../hooks/index';

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  // Lock body scroll when modal is open
  useScrollLock(true);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [theme, setTheme] = useState<'default' | 'sepia'>('default');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const currentScrollY = target.scrollTop;
    
    // Progress
    const totalScroll = target.scrollHeight - target.clientHeight;
    if (totalScroll > 0) {
      setScrollProgress((currentScrollY / totalScroll) * 100);
    }
    
    // Direction (for focus mode)
    if (currentScrollY > lastScrollY && currentScrollY > 60) {
      setIsScrollingDown(true);
    } else if (currentScrollY < lastScrollY - 10) { // Slight buffer
      setIsScrollingDown(false);
    }
    setLastScrollY(currentScrollY);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: `اقرأ هذا المقال المفيد من مدونة جودة: ${article.title}`,
          url: window.location.href,
        });
      } catch (e) {}
    }
  };

  // Pass the raw content directly so Markdown plugins can parse tables and lists correctly.
  const formattedContent = article.content;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex justify-center bg-black/60 backdrop-blur-sm animate-fade-in" style={{ overscrollBehavior: 'contain' }}>
      <div className={`w-full max-w-md h-[100dvh] overflow-hidden shadow-2xl relative flex flex-col animate-slide-up-mobile border-x transition-colors duration-500 ${theme === 'sepia' ? 'bg-[#fbf4e6] border-[#e8dcc4]' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/5 z-50">
          <div 
            className="h-full bg-brand-500 transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Floating Close Button (Always Visible) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-md p-2.5 rounded-full text-white shadow-lg transition-all duration-300 active:scale-90"
          aria-label="إغلاق المقال"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Image */}
        <div className={`relative shrink-0 transition-all duration-500 ${isScrollingDown ? 'h-0 opacity-0' : 'h-64 opacity-100'} bg-gray-200 dark:bg-gray-800`}>
          {article.image ? (
            <img 
              src={article.image} 
              alt={article.title} 
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
               <span className="text-brand-300 font-black text-4xl opacity-50">جودة</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>

        {/* Content */}
        <div 
           ref={scrollContainerRef}
           onScroll={handleScroll}
           className="flex-1 overflow-y-auto relative -mt-6 rounded-t-3xl px-6 pt-8 pb-6"
        >
           {/* Reader Controls */}
           <div className={`flex items-center justify-between rounded-2xl p-2 mb-8 backdrop-blur-sm border transition-colors duration-300 ${theme === 'sepia' ? 'bg-[#f3ead5]/50 border-[#e8dcc4]' : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'}`}>
              <div className="flex items-center gap-1">
                 <button onClick={() => setFontSize(prev => prev === 'base' ? 'base' : prev === 'lg' ? 'base' : 'lg')} className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-sm transition-colors ${theme === 'sepia' ? 'hover:bg-[#e8dcc4] text-[#5b4636]' : 'hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>A-</button>
                 <div className={`w-px h-4 ${theme === 'sepia' ? 'bg-[#d8ccb4]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                 <button onClick={() => setFontSize(prev => prev === 'xl' ? 'xl' : prev === 'lg' ? 'xl' : 'lg')} className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-lg transition-colors ${theme === 'sepia' ? 'hover:bg-[#e8dcc4] text-[#5b4636]' : 'hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>A+</button>
              </div>
              <button 
                onClick={() => setTheme(prev => prev === 'sepia' ? 'default' : 'sepia')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${theme === 'sepia' ? 'bg-[#e4d5b7] text-[#5b4636] hover:bg-[#d8ccb4]' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/50'}`}
              >
                {theme === 'sepia' ? 'الوضع الافتراضي' : 'وضع القراءة'}
              </button>
           </div>
           <div className="mb-8">
              <h1 className={`text-2xl font-bold mb-4 leading-snug ${theme === 'sepia' ? 'text-[#3a2818]' : 'text-gray-900 dark:text-white'}`}>
                {article.title}
              </h1>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                 <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{article.author}</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{article.date}</span>
                 </div>
              </div>
           </div>

           {/* Dynamic Typography for Reading Experience */}
           <div className={`
              prose max-w-none pb-12 transition-all duration-300
              ${fontSize === 'base' ? 'prose-base' : fontSize === 'lg' ? 'prose-lg' : 'prose-xl'}
              ${theme === 'sepia' 
                ? 'prose-headings:text-[#4a3623] text-[#5b4636] prose-p:text-[#5b4636] prose-li:text-[#5b4636] prose-strong:text-[#8b5a2b]'
                : 'dark:prose-invert prose-headings:font-bold text-gray-800 dark:text-gray-200 prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-strong:text-brand-600 dark:prose-strong:text-brand-400'
              }
              [&_p]:leading-loose [&_li]:leading-loose
              [&_br]:block [&_br]:mb-6 [&_br]:content-['']
           `}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                 {formattedContent}
              </ReactMarkdown>
           </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-between items-center transition-all duration-500 ${isScrollingDown ? 'h-0 p-0 opacity-0 overflow-hidden' : 'opacity-100'} ${theme === 'sepia' ? 'border-[#e8dcc4] bg-[#fbf4e6]' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
           <button 
             onClick={handleShare}
             className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 px-4 py-2 rounded-xl transition-colors"
           >
             <Share2 className="w-4 h-4" />
             <span>مشاركة المقال</span>
           </button>
           
           <button 
             onClick={onClose}
             className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-6 py-2 rounded-xl font-bold text-sm"
           >
             إغلاق
           </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
