
import React, { useEffect, useState } from 'react';
import { Plus, ShoppingBag, AlertCircle, Search, X, Cake, Check, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { fetchProductsFromSupabase, fetchBakeryProductsFromSupabase, Product } from '../services/supabaseService';
import { ProductDetailsModal } from './ProductDetailsModal';

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
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const loadAllData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [storeData, bakeryData] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchBakeryProductsFromSupabase()
      ]);
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

  const filteredProducts = currentProducts.filter(product => {
    const matchCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = product.name.toLowerCase().includes(searchLower) || 
                        product.description.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    const aFav = isFavorite(a.id) ? 1 : 0;
    const bFav = isFavorite(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return 0;
  });

  const handleAddToCart = (product: Product, mode: 'store' | 'bakery') => {
    addToCart(product.name, mode, product.barcode, product.price?.toString());
    setJustAdded(product.name);
    setTimeout(() => setJustAdded(null), 1500);
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

      {/* Search */}
      <div className="relative mb-3">
        <label htmlFor="product-search" className="sr-only">ابحث عن منتج</label>
        <input
          id="product-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full h-12 pl-4 pr-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
        <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        {searchQuery && (
           <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
             <X className="w-4 h-4" />
           </button>
        )}
      </div>

      {/* Category Pills */}
      {!loading && !error && categories.length > 1 && (
        <div className="sticky top-[55px] z-30 bg-warm-50 dark:bg-gray-900 backdrop-blur-md py-2 -mx-4 sm:-mx-6 lg:-mx-8 mb-4 shadow-sm border-b border-gray-100 dark:border-gray-800">
          <div className="flex overflow-x-auto gap-2 hide-scrollbar px-4 sm:px-6 lg:px-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                   setSelectedCategory(cat);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md transform -translate-y-0.5' 
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
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">لا توجد منتجات مطابقة</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-brand-600 font-bold text-sm mt-2 hover:underline">مسح البحث</button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => {
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
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs leading-tight mb-1 line-clamp-2 h-[2.5em] overflow-hidden">{product.name}</h3>
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
