
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Calendar, User, Share2 } from 'lucide-react';
import { Article } from '../services/supabaseService';
import { useScrollLock } from '../hooks';

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  // Lock body scroll when modal is open
  useScrollLock(true);

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

  // Enhance content to support newlines from CSV (which might come as single \n)
  // Markdown treats single \n as space. We replace them with double space + \n for hard break.
  const formattedContent = article.content.replace(/\n/g, '  \n');

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg h-[95vh] sm:h-[85vh] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col animate-slide-up-mobile sm:animate-scale-in border border-gray-200 dark:border-gray-700">
        
        {/* Header Image */}
        <div className="relative h-64 shrink-0 bg-gray-200 dark:bg-gray-800">
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
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 relative -mt-6 rounded-t-3xl px-6 pt-8 pb-6">
           <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
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

           {/* Enforce dark mode text colors explicitly on the container to override any potential defaults */}
           <div className="prose prose-sm dark:prose-invert prose-headings:font-bold text-gray-800 dark:text-gray-200 prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-strong:text-brand-600 dark:prose-strong:text-brand-400 max-w-none pb-10">
              <ReactMarkdown>
                 {formattedContent}
              </ReactMarkdown>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
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
};
