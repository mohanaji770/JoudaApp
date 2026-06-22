import React from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, ArrowUpDown, Check, Heart } from 'lucide-react';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'popular';

export interface FilterState {
  sort: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  favoritesOnly: boolean;
}

interface FilterPanelModalProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  maxProductPrice: number;
  filteredCount: number;
  resetFilters: () => void;
  activeFiltersCount: number;
}

export const FilterPanelModal: React.FC<FilterPanelModalProps> = ({
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  maxProductPrice,
  filteredCount,
  resetFilters,
  activeFiltersCount,
}) => {
  if (!showFilters) return null;

  return createPortal(
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
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                مسح الكل
              </button>
            )}
            <button
              type="button"
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
                { value: 'popular', label: 'الأكثر طلباً 🔥' },
                { value: 'price-asc', label: 'السعر: من الأرخص' },
                { value: 'price-desc', label: 'السعر: من الأغلى' },
                { value: 'name-asc', label: 'الاسم: أ - ي' },
              ] as { value: SortOption; label: string }[]).map((opt) => (
                <button
                  type="button"
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
                  { id: 'under-1000', label: <>أقل من ١٠٠٠ <span className="saudi-riyal">{"\u00ea"}</span></>, max: 1000 },
                  { id: '1000-3000', label: <>١٠٠٠ - ٣٠٠٠ <span className="saudi-riyal">{"\u00ea"}</span></>, min: 1000, max: 3000 },
                  { id: '3000-5000', label: <>٣٠٠٠ - ٥٠٠٠ <span className="saudi-riyal">{"\u00ea"}</span></>, min: 3000, max: 5000 },
                  { id: 'over-5000', label: <>أكثر من ٥٠٠٠ <span className="saudi-riyal">{"\u00ea"}</span></>, min: 5000 },
                ].map((chip) => {
                  const isActive = filters.minPrice === (chip.min || null) && filters.maxPrice === (chip.max || null);
                  return (
                    <button
                      type="button"
                      key={chip.id}
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
              type="button"
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
                    المتوفر حالياً بس
                  </span>
                  <span className="text-[10px] text-gray-400">ما ترويني المنتجات المخلصة</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${filters.inStockOnly ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${filters.inStockOnly ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
            </button>

            {/* Favorites Only */}
            <button
              type="button"
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
                    المفضلة بس
                  </span>
                  <span className="text-[10px] text-gray-400">عرض الأشياء اللي حبيتها بس</span>
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
              <span className="font-bold text-brand-600">{filteredCount}</span> منتج يطابق خياراتك
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <button
            type="button"
            onClick={() => setShowFilters(false)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            شوف النتائج ({filteredCount})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
