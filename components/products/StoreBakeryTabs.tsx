import React from 'react';
import { ShoppingBag, Cake } from 'lucide-react';

interface StoreBakeryTabsProps {
  viewMode: 'store' | 'bakery';
  setViewMode: (mode: 'store' | 'bakery') => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const StoreBakeryTabs: React.FC<StoreBakeryTabsProps> = ({
  viewMode,
  setViewMode,
  setSelectedCategory,
  setSearchQuery,
}) => {
  const handleTabChange = (mode: 'store' | 'bakery') => {
    setViewMode(mode);
    setSelectedCategory('الكل');
    setSearchQuery('');
  };

  return (
    <div className="flex gap-2 mb-4 px-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl max-w-md mx-auto md:max-w-none md:mx-0">
      <button 
        onClick={() => handleTabChange('store')}
        className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
          viewMode === 'store' 
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm scale-[1.02]' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>المتجر</span>
      </button>
      <button 
        onClick={() => handleTabChange('bakery')}
        className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
          viewMode === 'bakery' 
            ? 'bg-pink-500 text-white shadow-md shadow-pink-200 dark:shadow-none scale-[1.02]' 
            : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
        }`}
      >
        <Cake className="w-4 h-4" />
        <span>المخبز</span>
      </button>
    </div>
  );
};
