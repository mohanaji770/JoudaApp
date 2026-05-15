
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Plus, ShoppingBag, AlertCircle, Search, X, Cake, Check, Heart, SlidersHorizontal, ArrowUpDown, Filter, ChevronDown, Clock, Trash2, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { fetchProductsFromSupabase, fetchBakeryProductsFromSupabase, Product } from '../services/supabaseService';
import { ProductDetailsModal } from './ProductDetailsModal';
import { useDebounce } from '../hooks/useDebounce';
import { useRecentSearches } from '../hooks/useRecentSearches';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'popular';

interface FilterState {
  sort: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  favoritesOnly: boolean;
}

interface ProductsPageProps {
  initialViewMode?: 'store' | 'bakery';
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ initialViewMode = 'store' }) => {
  const { addToCart, decreaseQuantityByName, getItemQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [bakeryProducts, setBakeryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [viewMode, setViewMode] = useState<'store' | 'bakery'>(initialViewMode);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>({
    sort: 'default',
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    favoritesOnly: false,
  });

  // Pagination
  const INITIAL_ITEMS = 20;
  const LOAD_MORE_ITEMS = 20;
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);

  // Reset pagination when filters/search/category/view changes
  useEffect(() => {
    setVisibleCount(INITIAL_ITEMS);
  }, [viewMode, selectedCategory, debouncedSearchQuery, filters.sort, filters.inStockOnly, filters.favoritesOnly, filters.minPrice, filters.maxPrice]);

  // Add to recent searches when user submits/searchs
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      addRecentSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const loadAllData = async () => {
    setLoading(true);
    setError(false);
    try {
      const allProducts = await fetchProductsFromSupabase();
      // Split: bakery items go to bakery tab, everything else to store tab
      const storeData = allProducts.filter(p => p.source !== 'bakery');
      const bakeryData = allProducts.filter(p => p.source === 'bakery');
      setStoreProducts(storeData);
      setBakeryProducts(bakeryData);
      if (storeData.length === 0 && bakeryData.length === 0) {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const currentProducts = viewMode === 'store' ? storeProducts : bakeryProducts;
  const categories = ['الكل', ...Array.from(new Set(currentProducts.map(p => p.category).filter(Boolean)))];

  // Calculate price range from products
  const prices = currentProducts.map(p => p.price || 0).filter(p => p > 0);
  const maxProductPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Smart search: search in name, description, category, barcode
  const filteredProducts = useMemo(() => {
    let result = currentProducts.filter(product => {
      const matchCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
      const searchLower = debouncedSearchQuery.toLowerCase().trim();
      const matchSearch = !searchLower || 
                          product.name.toLowerCase().includes(searchLower);
      const matchStock = !filters.inStockOnly || product.inStock !== false;
      const matchFav = !filters.favoritesOnly || isFavorite(product.id);
      const matchMinPrice = filters.minPrice === null || (product.price || 0) >= filters.minPrice;
      const matchMaxPrice = filters.maxPrice === null || (product.price || 0) <= filters.maxPrice;
      return matchCategory && matchSearch && matchStock && matchFav && matchMinPrice && matchMaxPrice;
    });

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'price-asc':
          // Available first, then by price
          if (a.inStock !== false && b.inStock === false) return -1;
          if (a.inStock === false && b.inStock !== false) return 1;
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          // Available first, then by price
          if (a.inStock !== false && b.inStock === false) return -1;
          if (a.inStock === false && b.inStock !== false) return 1;
          return (b.price || 0) - (a.price || 0);
        case 'name-asc':
          // Available first, then by name
          if (a.inStock !== false && b.inStock === false) return -1;
          if (a.inStock === false && b.inStock !== false) return 1;
          return a.name.localeCompare(b.name, 'ar');
        case 'popular':
          // Available first, then popular
          if (a.inStock !== false && b.inStock === false) return -1;
          if (a.inStock === false && b.inStock !== false) return 1;
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
        case 'default':
        default:
          // Available first, then favorites, then popular
          if (a.inStock !== false && b.inStock === false) return -1;
          if (a.inStock === false && b.inStock !== false) return 1;
          const aFav = isFavorite(a.id) ? 1 : 0;
          const bFav = isFavorite(b.id) ? 1 : 0;
          if (aFav !== bFav) return bFav - aFav;
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
      }
    });

    return result;
  }, [currentProducts, selectedCategory, searchQuery, filters, isFavorite]);

  const activeFiltersCount = [
    filters.sort !== 'default',
    filters.inStockOnly,
    filters.favoritesOnly,
    filters.minPrice !== null,
    filters.maxPrice !== null,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({
      sort: 'default',
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      favoritesOnly: false,
    });
  };

  const handleAddToCart = (product: Product, mode: 'store' | 'bakery') => {
    addToCart(product.name, mode, product.barcode, product.price?.toString());
    setJustAdded(product.name);
    setTimeout(() => setJustAdded(null), 1500);
  };

  // Highlight matched text in search results
  const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-900/40 text-gray-900 dark:text-white px-0.5 rounded">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="pb-24 md:pb-8 animate-fade-in">
      
      {/* Store / Bakery Tabs */}
      <div className="flex gap-2 mb-4 px-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl max-w-md mx-auto md:max-w-none md:mx-0">
        <button 
          onClick={() => { setViewMode('store'); setSelectedCategory('الكل'); setSearchQuery(''); }}
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
          onClick={() => { setViewMode('bakery'); setSelectedCategory('الكل'); setSearchQuery(''); }}
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

      {/* Search + Filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1" ref={searchContainerRef}>
          <label htmlFor="product-search" className="sr-only">ابحث عن منتج</label>
          <input
            ref={searchInputRef}
            id="product-search"
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            placeholder="ابحث باسم المنتج..."
            className="w-full h-12 pl-4 pr-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
          <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery ? (
             <button onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
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
                      onClick={() => setSearchQuery(term)}
                      className="flex-1 flex items-center gap-3 px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{term}</span>
                    </button>
                    <button
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

      {/* Category Filters */}
      {!loading && !error && categories.length > 1 && (
        <div className="py-3 mb-4 -mx-4 px-4">
          <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                   setSelectedCategory(cat);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' 
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-warm-white dark:bg-gray-800 rounded-3xl animate-pulse border border-gray-100 dark:border-gray-700 h-64"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-red-50 dark:border-red-900/30">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">فشل تحميل المنتجات</p>
          <button onClick={loadAllData} className="text-brand-600 font-bold text-sm mt-2 hover:underline">إعادة المحاولة</button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900 dark:text-white font-bold text-base mb-1">لا توجد نتائج</p>
          <p className="text-gray-400 text-sm mb-4">
            {debouncedSearchQuery 
              ? `لا توجد منتجات تطابق "${debouncedSearchQuery}"`
              : 'لا توجد منتجات مطابقة للفلاتر المحددة'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {debouncedSearchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-xl border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors"
              >
                مسح البحث
              </button>
            )}
            {activeFiltersCount > 0 && (
              <button 
                onClick={resetFilters} 
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 transition-colors"
              >
                مسح الفلاتر ({activeFiltersCount})
              </button>
            )}
          </div>
          {/* Smart suggestions */}
          {debouncedSearchQuery && currentProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 mb-3">هل تقصد:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentProducts
                  .filter(p => p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase().slice(0, 2)))
                  .slice(0, 5)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSearchQuery(p.name)}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search Results Info Bar */}
          {debouncedSearchQuery && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> نتيجة لـ "<span className="font-bold">{debouncedSearchQuery}</span>"
                </span>
              </div>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-gray-400 hover:text-brand-600 font-bold transition-colors"
              >
                مسح
              </button>
            </div>
          )}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.slice(0, visibleCount).map((product) => {
              const quantity = getItemQuantity(product.name);
              const isAdded = justAdded === product.name;
              const liked = isFavorite(product.id);

              return (
                  <div 
                      key={product.id}
                      onClick={() => setSelectedProductDetails(product)}
                      className={`bg-warm-white dark:bg-gray-800 rounded-3xl overflow-hidden border transition-all relative flex flex-col h-full cursor-pointer hover:shadow-lg hover:-translate-y-1
                          ${!product.inStock ? 'opacity-70 grayscale' : 'border-gray-100 dark:border-gray-700 shadow-sm'}
                      `}
                  >
                      <div className="w-full aspect-[4/3] bg-gray-50 dark:bg-gray-700 relative overflow-hidden shrink-0">
                          {product.image ? (
                              <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                  {viewMode === 'bakery' ? <Cake className="text-pink-300 w-10 h-10" /> : <ShoppingBag className="text-gray-300 w-10 h-10" />}
                              </div>
                          )}
                          
                          {!product.inStock && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                  <span className="text-white text-xs font-bold border-2 border-white px-3 py-1 rounded-lg transform -rotate-12">نفد الكمية</span>
                              </div>
                          )}

                          <div className="absolute top-2 left-2 z-10">
                              <button 
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all active:scale-90 ${
                                      liked ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-black/40 text-gray-500 dark:text-gray-300 hover:text-red-500'
                                  }`}
                              >
                                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                              </button>
                          </div>
                      </div>

                      <div className="p-3 flex-1 flex flex-col">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs leading-tight mb-1 line-clamp-2 h-[2.5em] overflow-hidden">
                            <HighlightedText text={product.name} highlight={debouncedSearchQuery} />
                          </h3>
                          <div className="mt-auto pt-2 flex items-end justify-between">
                              <div>
                                  <p className="text-[11px] text-gray-400 mb-0.5">{product.category}</p>
                                  <p className="text-brand-600 dark:text-brand-400 text-xs font-black">{product.price || '---'}</p>
                              </div>
                              
                              {quantity > 0 ? (
                                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5" role="group" aria-label="التحكم بالكمية">
                                      <button onClick={(e) => { e.stopPropagation(); decreaseQuantityByName(product.name); }} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-600 rounded shadow-sm text-gray-600 dark:text-white">
                                          <X className="w-3 h-3" />
                                      </button>
                                      <span className="text-xs font-bold w-4 text-center" aria-live="polite">{quantity}</span>
                                       <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product, viewMode); }} className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded shadow-sm">
                                          <Plus className="w-3 h-3" />
                                      </button>
                                  </div>
                              ) : (
                                  <button 
                                       onClick={(e) => { e.stopPropagation(); handleAddToCart(product, viewMode); }}
                                      disabled={!product.inStock}
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                                          isAdded 
                                          ? 'bg-green-500 text-white scale-110' 
                                          : !product.inStock 
                                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105'
                                      }`}
                                  >
                                      {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                  </button>
                              )}
                          </div>
                      </div>
                  </div>
              );
            })}
          </div>

          {/* Load More */}
          {visibleCount < filteredProducts.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleCount(v => v + LOAD_MORE_ITEMS)}
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-[0.98] shadow-sm"
              >
                <ChevronDown className="w-4 h-4" />
                عرض المزيد
                <span className="text-[10px] text-gray-400 font-normal bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {filteredProducts.length - visibleCount} متبقي
                </span>
              </button>
            </div>
          )}

          {/* End of list indicator */}
          {visibleCount >= filteredProducts.length && filteredProducts.length > INITIAL_ITEMS && (
            <div className="mt-6 text-center pb-4">
              <div className="inline-flex items-center gap-2 text-gray-400 text-xs">
                <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
                <span>انتهت القائمة</span>
                <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col animate-slide-up-mobile md:animate-slide-in-right overflow-hidden border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-black text-gray-900 dark:text-white">فلترة متقدمة</h2>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    مسح الكل
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Sort */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  ترتيب حسب
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'default', label: 'الافتراضي' },
                    { value: 'popular', label: 'الأكثر مبيعاً' },
                    { value: 'price-asc', label: 'السعر: الأقل' },
                    { value: 'price-desc', label: 'السعر: الأعلى' },
                    { value: 'name-asc', label: 'الاسم: أ-ي' },
                  ] as { value: SortOption; label: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters(f => ({ ...f, sort: opt.value }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        filters.sort === opt.value
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-none'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              {maxProductPrice > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">نطاق السعر</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-1 block">من</label>
                      <input
                        type="number"
                        min={0}
                        max={filters.maxPrice || maxProductPrice}
                        value={filters.minPrice ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          setFilters(f => ({ ...f, minPrice: val }));
                        }}
                        className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="0"
                      />
                    </div>
                    <span className="text-gray-300 pt-5">—</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-1 block">إلى</label>
                      <input
                        type="number"
                        min={filters.minPrice || 0}
                        max={maxProductPrice}
                        value={filters.maxPrice ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          setFilters(f => ({ ...f, maxPrice: val }));
                        }}
                        className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder={maxProductPrice.toString()}
                      />
                    </div>
                  </div>
                  {/* Quick price chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      { label: 'أقل من 1000', max: 1000 },
                      { label: '1000 - 3000', min: 1000, max: 3000 },
                      { label: '3000 - 5000', min: 3000, max: 5000 },
                      { label: 'أكثر من 5000', min: 5000 },
                    ].map((chip) => {
                      const isActive = filters.minPrice === (chip.min || null) && filters.maxPrice === (chip.max || null);
                      return (
                        <button
                          key={chip.label}
                          onClick={() => {
                            if (isActive) {
                              setFilters(f => ({ ...f, minPrice: null, maxPrice: null }));
                            } else {
                              setFilters(f => ({ ...f, minPrice: chip.min || null, maxPrice: chip.max || null }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            isActive
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">خيارات</h3>

                {/* In Stock Only */}
                <button
                  onClick={() => setFilters(f => ({ ...f, inStockOnly: !f.inStockOnly }))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    filters.inStockOnly
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      filters.inStockOnly ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      <Check className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className={`block text-sm font-bold ${filters.inStockOnly ? 'text-green-800 dark:text-green-200' : 'text-gray-700 dark:text-gray-300'}`}>
                        متوفر فقط
                      </span>
                      <span className="text-[10px] text-gray-400">إخفاء المنتجات غير المتوفرة</span>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${filters.inStockOnly ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${filters.inStockOnly ? 'left-[22px]' : 'left-0.5'}`} />
                  </div>
                </button>

                {/* Favorites Only */}
                <button
                  onClick={() => setFilters(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    filters.favoritesOnly
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      filters.favoritesOnly ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      <Heart className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className={`block text-sm font-bold ${filters.favoritesOnly ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}`}>
                        المفضلة فقط
                      </span>
                      <span className="text-[10px] text-gray-400">عرض المنتجات المفضلة فقط</span>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${filters.favoritesOnly ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${filters.favoritesOnly ? 'left-[22px]' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Results Count */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-bold text-brand-600">{filteredProducts.length}</span> منتج مطابق
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98]"
              >
                عرض النتائج ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProductDetails && (
        <ProductDetailsModal
           product={selectedProductDetails}
           onClose={() => setSelectedProductDetails(null)}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          height: 4px;
          background: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }
        .hide-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
      `}</style>
    </div>
  );
};
