import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PromoBanner } from '../PromoBanner';
import { TrendingRecipes } from '../TrendingRecipes';
import { KnowledgeHub } from '../KnowledgeHub';
import { ProductRequestModal } from '../ProductRequestModal';
import { Search, ScanLine, ChefHat, Store, ChevronLeft } from 'lucide-react';

interface DashboardViewProps {
  onOpenScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenScanner }) => {
  const navigate = useNavigate();
  const [showProductRequest, setShowProductRequest] = useState(false);

  return (
    <div className="animate-fade-in flex flex-col">
      {/* Search Bar Container */}
      <div className="mt-5 mb-5 relative">
        <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-1.5 flex items-center justify-between transition-all duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-800">
          <button
            onClick={() => navigate('/products')}
            className="flex-1 flex items-center gap-3 p-1.5 text-right transition-all group/btn"
            aria-label="البحث في المتجر"
          >
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 group-hover/btn:scale-105 transition-transform duration-200" />
            <div className="flex-1 text-right">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 block transition-colors group-hover/btn:text-gray-600 dark:group-hover/btn:text-gray-300">ابحث عن منتج، وصفة، أو مكون...</span>
            </div>
          </button>

          <div className="pl-2 border-r border-gray-200 dark:border-gray-700 mr-2 pr-2">
            <button
              onClick={onOpenScanner}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-white dark:hover:bg-gray-700 transition-all active:scale-95 group/scan"
              aria-label="بدء الفحص بالكميرا"
              title="بدء الفحص بالكميرا"
            >
              <ScanLine className="w-5 h-5 group-hover/scan:scale-110 transition-transform duration-300 group-hover/scan:text-brand-600" />
            </button>
          </div>
        </div>
      </div>

      <PromoBanner />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={() => navigate('/recipes')}
          className="group relative h-28 rounded-3xl overflow-hidden bg-warm-white dark:bg-gray-800 border border-orange-100/80 dark:border-gray-700/50 text-right p-4 transition-all duration-300 hover:border-orange-200/80 hover:bg-orange-50/10 dark:hover:bg-gray-700/80 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(234,88,12,0.03)] active:scale-[0.98] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.015)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <ChefHat className="w-7 h-7 text-orange-600 dark:text-orange-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            <ChevronLeft className="w-4 h-4 text-orange-500 dark:text-orange-400 group-hover:-translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1">مخبز جودة</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-snug line-clamp-1">وصفات وأكلات صحية خالية من الجلوتين</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/products')}
          className="group relative h-28 rounded-3xl overflow-hidden bg-warm-white dark:bg-gray-800 border border-rose-100/80 dark:border-gray-700/50 text-right p-4 transition-all duration-300 hover:border-rose-200/80 hover:bg-rose-50/10 dark:hover:bg-gray-700/80 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(211,47,47,0.03)] active:scale-[0.98] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.015)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <Store className="w-7 h-7 text-brand-600 dark:text-brand-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
            <ChevronLeft className="w-4 h-4 text-rose-500 dark:text-rose-400 group-hover:-translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1">متجر جودة </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-snug line-clamp-1">كافة المنتجات والمقاضي</p>
          </div>
        </button>
      </div>

      <div className="py-2.5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">اكتشف</span>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>

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
