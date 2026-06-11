import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomePackagesCarousel } from './HomePackagesCarousel';
import { TrendingRecipes } from '../blog/TrendingRecipes';
import { KnowledgeHub } from '../../pages/KnowledgeHub';
import { ProductRequestModal } from '../modals/ProductRequestModal';
import { Search, ScanLine, ChefHat, Store, ChevronLeft } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [showProductRequest, setShowProductRequest] = useState(false);

  const currentHour = new Date().getHours();
  let greeting = 'نهارك سعيد';
  let icon = '☀️';
  
  if (currentHour < 12) {
    greeting = 'صباح الخير';
    icon = '☀️';
  } else if (currentHour < 16) {
    greeting = 'نهارك سعيد';
    icon = '🌤️';
  } else {
    greeting = 'مساء الخير';
    icon = '🌙';
  }

  const storedName = localStorage.getItem('jouda_customer_name');
  const userName = storedName ? `، ${storedName.split(' ')[0]}` : '';

  return (
    <div className="animate-fade-in flex flex-col">
      {/* iOS Style Minimal Hero */}
      <div className="mt-5 mb-7 px-4">
        <h1 className="text-[28px] font-black text-gray-900 dark:text-white mb-3 tracking-tight flex items-center gap-2">
          <span>{greeting}، {userName}</span>
          <span className="text-2xl">{icon}</span>
        </h1>
        <p className="text-[14px] font-bold text-gray-500 dark:text-gray-400 leading-[1.7] max-w-[90%]">
          خياراتك الصحية الموثوقة.. في مكان واحد.
        </p>
      </div>

      {/* Smart Lifesaver Bar (Scanner Trigger) */}
      <div className="px-4 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => window.dispatchEvent(new Event('open-scanner'))}
          className="w-full relative group bg-white dark:bg-gray-900 rounded-[1.25rem] p-4 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 transition-all active:scale-[0.98] overflow-hidden"
        >
          {/* Animated Background Gradient (Subtle) */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Icon Area */}
          <div className="w-12 h-12 rounded-[1rem] bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
            <ScanLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>

          {/* Text Area */}
          <div className="flex-1 text-right">
            <h3 className="font-black text-gray-900 dark:text-white text-[15px] mb-0.5">افحص أي منتج الآن</h3>
            <p className="text-[11px] text-gray-500 font-bold">بالكاميرا أو البحث الكتابي.. وتأكد هل هو مسموح!</p>
          </div>

          {/* Search Icon Hint */}
          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors">
            <Search className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
          </div>
        </button>
      </div>

      {/* Minimal Categories (Bento Style) */}
      <div className="grid grid-cols-2 gap-3 mb-8 px-4">
        <button
          onClick={() => navigate('/recipes')}
          className="group relative h-28 rounded-[1.5rem] bg-white dark:bg-gray-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 text-right p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-[0.8rem] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
               <ChefHat className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ChevronLeft className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-[15px] leading-tight mb-1">مخبز جودة</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-snug line-clamp-1">وصفات وأكلات صحية</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/products')}
          className="group relative h-28 rounded-[1.5rem] bg-white dark:bg-gray-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 text-right p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-[0.8rem] bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
               <Store className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ChevronLeft className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-[15px] leading-tight mb-1">متجر جودة </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-snug line-clamp-1">كافة المنتجات والمقاضي</p>
          </div>
        </button>
      </div>

      <HomePackagesCarousel />



      <div className="mb-6">
        <TrendingRecipes />
      </div>

      <div className="mb-10">
        <KnowledgeHub />
      </div>

      {showProductRequest && (
        <ProductRequestModal onClose={() => setShowProductRequest(false)} />
      )}
    </div>
  );
};
