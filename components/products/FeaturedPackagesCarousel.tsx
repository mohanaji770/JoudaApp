import React from 'react';
import { Gift } from 'lucide-react';
import { Product } from '../../services/supabaseService';
import { calculatePackageSavings } from './utils';
import { FeaturedPackageCard } from './FeaturedPackageCard';

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
    <div className="mb-4 bg-gradient-to-r from-amber-500/5 to-brand-500/5 dark:from-amber-950/10 dark:to-brand-950/5 p-3 rounded-2xl border border-amber-100/70 dark:border-amber-900/20 shadow-sm">
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-amber-500" />
            عروض وبكجات التوفير المميزة 🎁
          </h3>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            عروض متكاملة تضمن لك أفضل قيمة توفير
          </p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2.5 hide-scrollbar -mx-4 px-4">
        {featuredPackages.map((pkg) => (
          <FeaturedPackageCard
            key={`featured-${pkg.id}`}
            pkg={pkg}
            quantity={getItemQuantity(pkg.name)}
            isAdded={justAdded === pkg.name}
            liked={isFavorite(pkg.id)}
            savings={calculatePackageSavings(pkg, allProducts)}
            toggleFavorite={toggleFavorite}
            handleAddToCart={handleAddToCart}
            decreaseQuantityByName={decreaseQuantityByName}
            setSelectedProductDetails={setSelectedProductDetails}
          />
        ))}
      </div>
    </div>
  );
};
