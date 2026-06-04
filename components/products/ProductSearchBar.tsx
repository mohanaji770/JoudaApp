import React, { useRef } from 'react';
import { Search, X, Sparkles, Clock, SlidersHorizontal } from 'lucide-react';

interface ProductSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  activeFiltersCount: number;
  setShowFilters: (show: boolean) => void;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  recentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  activeFiltersCount,
  setShowFilters,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleInputBlur = () => {
    // Timeout allows clicking on recent search items before dropdown closes
    setTimeout(() => setIsSearchFocused(false), 150);
    if (searchQuery.trim().length >= 2) {
      addRecentSearch(searchQuery.trim());
    }
  };

  return (
    <div className="flex gap-2 mb-3">
      <div className="relative flex-1">
        <label htmlFor="product-search" className="sr-only">ابحث عن منتج</label>
        <input
          ref={searchInputRef}
          id="product-search"
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={handleInputBlur}
          placeholder="ابحث باسم المنتج..."
          className="w-full h-12 pl-4 pr-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
        <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        {searchQuery ? (
          <button 
            type="button"
            onClick={handleClearSearch} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        ) : debouncedSearchQuery && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
          </div>
        )}
        
        {/* Recent Searches Dropdown */}
        {isSearchFocused && !searchQuery && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                عمليات البحث الأخيرة
              </span>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                مسح الكل
              </button>
            </div>
            <div className="py-1">
              {recentSearches.map((term, index) => (
                <div key={index} className="flex items-center group">
                  <button
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="flex-1 flex items-center gap-3 px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{term}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecentSearch(term)}
                    className="px-3 py-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search Suggestions (when typing) */}
        {isSearchFocused && searchQuery.length >= 1 && searchQuery.length < 3 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-40 overflow-hidden p-4">
            <p className="text-xs text-gray-400 text-center">اكتب 3 أحرف على الأقل للبحث...</p>
          </div>
        )}
      </div>
      
      <button
        type="button"
        onClick={() => setShowFilters(true)}
        className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all relative shrink-0 ${
          activeFiltersCount > 0
            ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        aria-label="فلترة متقدمة"
      >
        <SlidersHorizontal className="w-5 h-5" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  );
};
