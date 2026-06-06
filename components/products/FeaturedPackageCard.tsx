import React from 'react';
import { Gift, Heart, Check, Plus } from 'lucide-react';
import { Product } from '../../services/supabaseService';

interface FeaturedPackageCardProps {
  pkg: Product;
  quantity: number;
  isAdded: boolean;
  liked: boolean;
  savings: {
    originalTotal: number;
    discountAmount: number;
    discountPercentage: number;
  } | null;
  toggleFavorite: (id: string) => void;
  handleAddToCart: (product: Product, mode: 'store' | 'bakery') => void;
  decreaseQuantityByName: (name: string) => void;
  setSelectedProductDetails: (product: Product) => void;
}

export const FeaturedPackageCard: React.FC<FeaturedPackageCardProps> = ({
  pkg,
  quantity,
  isAdded,
  liked,
  savings,
  toggleFavorite,
  handleAddToCart,
  decreaseQuantityByName,
  setSelectedProductDetails
}) => {
  return (
    <div 
      onClick={() => setSelectedProductDetails(pkg)}
      className="min-w-[280px] max-w-[280px] h-[110px] bg-white dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-[0_2px_8px_rgba(245,158,11,0.03)] relative flex cursor-pointer hover:shadow-md transition-all active:scale-[0.99] shrink-0 group overflow-hidden"
    >
      {/* Right Side: Image */}
      <div className="w-[100px] h-full bg-white dark:bg-gray-800 relative shrink-0 p-1.5">
        <div className="w-full h-full bg-amber-50/50 dark:bg-amber-900/10 rounded-xl overflow-hidden relative border border-gray-50 dark:border-gray-700/50">
          {pkg.image ? (
            <img src={pkg.image} alt={pkg.name} className="w-full h-full object-contain p-1" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="text-amber-300 w-8 h-8" />
            </div>
          )}
        </div>
        {savings && (
          <span className="absolute top-0 right-0 bg-green-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg rounded-tr-2xl shadow-sm z-10">
            وفر {savings.discountPercentage}%
          </span>
        )}
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleFavorite(pkg.id); 
          }}
          className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-100/50 dark:border-gray-700/50 transition-all active:scale-90 text-gray-400 hover:text-red-400 z-10"
        >
          <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Left Side: Content */}
      <div className="flex-1 flex flex-col p-2.5 pl-3 min-w-0 border-r border-gray-50 dark:border-gray-700/30">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-[12px] leading-snug mb-0.5 line-clamp-2">
          {pkg.name}
        </h4>
        <p className="text-[10px] text-gray-400 mb-auto truncate">
          {pkg.bundle_items ? `${pkg.bundle_items.length} منتجات` : 'عرض متكامل'}
        </p>
        
        <div className="flex items-end justify-between gap-1.5 mt-1">
          <div className="flex flex-col">
            {savings && (
              <p className="text-[9px] text-gray-400 line-through leading-none mb-0.5">
                {savings.originalTotal} ر.ي
              </p>
            )}
            <p className="text-brand-600 dark:text-brand-400 text-sm font-black leading-none">
              {pkg.price} ر.ي
            </p>
          </div>
          
          {quantity > 0 ? (
            <div 
              className="flex items-center bg-gray-100 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-full shrink-0 shadow-inner" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => handleAddToCart(pkg, 'store')} 
                className="w-6 h-6 flex items-center justify-center text-brand-600 font-bold text-sm"
              >
                +
              </button>
              <span className="text-[10px] font-black min-w-[16px] text-center text-gray-800 dark:text-white">
                {quantity}
              </span>
              <button 
                type="button"
                onClick={() => decreaseQuantityByName(pkg.name)} 
                className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold text-sm"
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
                  : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-900/30'
              }`}
            >
              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
