import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PromoBanner } from './PromoBanner';
import { TrendingRecipes } from '../blog/TrendingRecipes';
import { KnowledgeHub } from '../../pages/KnowledgeHub';
import { ProductRequestModal } from '../modals/ProductRequestModal';
import { Search, ScanLine, ChefHat, Store, ChevronLeft } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [showProductRequest, setShowProductRequest] = useState(false);

  return (
    <div className="animate-fade-in flex flex-col">
      {/* Floating Search Bar */}
      <div className="mt-4 mb-6 px-1">
        <div className="w-full bg-white dark:bg-gray-900 rounded-[1.5rem] p-1.5 flex items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-none border border-transparent dark:border-gray-800 transition-all duration-300">
          <button
            onClick={() => navigate('/products')}
            className="flex-1 flex items-center gap-3 p-2.5 text-right group/btn"
            aria-label="البحث"
          >
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-1" />
            <div className="flex-1 text-right">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">ابحث عن منتجات، وصفات...</span>
            </div>
          </button>
        </div>
      </div>

      <PromoBanner />

      {/* Minimal Categories (Bento Style) */}
      <div className="grid grid-cols-2 gap-3 mb-8 px-1">
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
