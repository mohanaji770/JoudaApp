import React, { useState, useEffect } from 'react';
import { Product, fetchProductsFromSupabase } from '../../services/supabaseService';
import { getCachedProducts } from '../../services/db';
import { ProductDetailsModal } from '../modals/ProductDetailsModal';
import { calculatePackageSavings } from '../products/utils';

export const HomePackagesCarousel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      try {
        const cached = await getCachedProducts();
        if (cached && cached.length > 0) {
          setProducts(cached);
          setLoading(false);
        }
        const fresh = await fetchProductsFromSupabase();
        setProducts(fresh);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPackages();
  }, []);

  const featuredPackages = products.filter(
    p => p.barcode.startsWith('PKG-') || p.category === 'عروض وبكجات'
  );

  if (loading && featuredPackages.length === 0) {
    return <div className="mx-4 mb-6 h-[130px] bg-gray-100 dark:bg-gray-800 rounded-[1.5rem] animate-pulse" />;
  }
  
  if (featuredPackages.length === 0) return null;

  return (
    <>
      <div className="px-4 mb-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
          <span className="text-brand-600">🎁</span>
          <span>عروض التوفير</span>
        </h3>

        <div
          className="flex gap-3.5 overflow-x-auto pb-4 pt-1 px-1 -mx-1 scrollbar-hide snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {featuredPackages.map((pkg) => {
            const savings = calculatePackageSavings(pkg, products);
            
            return (
              <div 
                key={pkg.id}
                onClick={() => setSelectedProductDetails(pkg)}
                className="min-w-[280px] max-w-[280px] h-[130px] bg-white dark:bg-gray-900 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none p-3.5 cursor-pointer active:scale-[0.98] transition-all duration-300 snap-center shrink-0 flex items-center gap-4 hover:shadow-md"
              >
                {/* Content Side (Right) */}
                <div className="flex-1 flex flex-col justify-between h-full py-0.5 text-right">
                  <div>
                    {savings && (
                      <span className="inline-block bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-[11px] font-black px-2 py-0.5 rounded-full mb-1">
                        خصم {savings.discountPercentage}%
                      </span>
                    )}
                    <h4 className="font-black text-gray-900 dark:text-white text-[13px] leading-snug line-clamp-2">
                      {pkg.name}
                    </h4>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="text-brand-600 dark:text-brand-400 font-black text-base font-mono">
                      {pkg.price} <span className="text-[10px] font-bold">ر.ي</span>
                    </span>
                    {savings && (
                      <span className="text-[11px] text-gray-400 line-through font-mono">
                        {savings.originalTotal}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image Side (Left) */}
                <div className="w-[84px] h-[84px] shrink-0 relative flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100/50 dark:border-gray-700 overflow-hidden shadow-inner">
                  {pkg.image ? (
                    <img 
                      src={pkg.image} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover animate-fade-in" 
                    />
                  ) : (
                    <span className="text-2xl">🎁</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedProductDetails && (
        <ProductDetailsModal
           product={selectedProductDetails}
           onClose={() => setSelectedProductDetails(null)}
        />
      )}
    </>
  );
};
