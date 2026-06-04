import React from 'react';
import { Gift, Heart, Check, Plus } from 'lucide-react';
import { Product } from '../../services/supabaseService';
import { calculatePackageSavings } from './utils';

interface FeaturedPackagesCarouselProps {
  storeProducts: Product[];
  bakeryProducts: Product[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  getItemQuantity: (name: string) => number;
  handleAddToCart: (product: Product, mode: 'store' | 'bakery') => void;
  decreaseQuantityByName: (name: string) => void;
  setSelectedProductDetails: (product: Product) => void;
  justAdded: string | null;
}

export const FeaturedPackagesCarousel: React.FC<FeaturedPackagesCarouselProps> = ({
  storeProducts,
  bakeryProducts,
  isFavorite,
  toggleFavorite,
  getItemQuantity,
  handleAddToCart,
  decreaseQuantityByName,
  setSelectedProductDetails,
  justAdded,
}) => {
  const featuredPackages = storeProducts.filter(
    p => p.barcode.startsWith('PKG-') || p.category === 'عروض وبكجات'
  );

  if (featuredPackages.length === 0) return null;

  const allProducts = [...storeProducts, ...bakeryProducts];

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500/5 to-brand-500/5 dark:from-amber-950/10 dark:to-brand-950/5 p-4 rounded-3xl border border-amber-100/70 dark:border-amber-900/20 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
            <Gift className="w-4.5 h-4.5 text-amber-500" />
            عروض وبكجات التوفير المميزة 🎁
          </h3>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            عروض متكاملة خالية من الغلوتين تضمن لك الجودة وأفضل قيمة توفير
          </p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2.5 hide-scrollbar -mx-4 px-4">
        {featuredPackages.map((pkg) => {
          const quantity = getItemQuantity(pkg.name);
          const isAdded = justAdded === pkg.name;
          const liked = isFavorite(pkg.id);
          const savings = calculatePackageSavings(pkg, allProducts);

          return (
            <div 
              key={`featured-${pkg.id}`}
              onClick={() => setSelectedProductDetails(pkg)}
              className="min-w-[220px] max-w-[220px] bg-white dark:bg-gray-800 rounded-[22px] p-3 border border-amber-100 dark:border-amber-900/40 shadow-[0_2px_8px_rgba(245,158,11,0.03)] relative flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-[0.99] shrink-0 group"
            >
              <div className="w-full aspect-[4/3] bg-white rounded-xl overflow-hidden relative shrink-0 mb-2">
                {pkg.image ? (
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-50/30">
                    <Gift className="text-amber-300 w-8 h-8" />
                  </div>
                )}
                {savings && (
                  <span className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    وفر {savings.discountPercentage}%
                  </span>
                )}
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toggleFavorite(pkg.id); 
                  }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border border-gray-100/50 transition-all active:scale-90 bg-white/90 text-gray-400 hover:text-red-400"
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                </button>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs leading-tight mb-1 line-clamp-2 h-[2.5em]">
                {pkg.name}
              </h4>
              <p className="text-[10px] text-gray-400 mb-2 truncate">
                {pkg.bundle_items ? `${pkg.bundle_items.length} منتجات` : 'عرض متكامل'}
              </p>
              <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                <div>
                  <p className="text-brand-600 dark:text-brand-400 text-sm font-black">
                    {pkg.price} ر.ي
                  </p>
                  {savings && (
                    <p className="text-[10px] text-gray-400 line-through leading-none mt-0.5">
                      {savings.originalTotal} ر.ي
                    </p>
                  )}
                </div>
                {quantity > 0 ? (
                  <div 
                    className="flex items-center bg-gray-100 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-full shrink-0 shadow-inner" 
                    onClick={e => e.stopPropagation()}
                  >
                    <button 
                      type="button"
                      onClick={() => handleAddToCart(pkg, 'store')} 
                      className="w-7 h-7 flex items-center justify-center text-brand-600 font-bold"
                    >
                      +
                    </button>
                    <span className="text-[10px] font-black min-w-[18px] text-center text-gray-800 dark:text-white">
                      {quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => decreaseQuantityByName(pkg.name)} 
                      className="w-7 h-7 flex items-center justify-center text-gray-500 font-bold"
                    >
                      -
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleAddToCart(pkg, 'store'); 
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm border transition-all shrink-0 ${
                      isAdded 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white dark:bg-gray-850 text-brand-600 dark:text-brand-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
