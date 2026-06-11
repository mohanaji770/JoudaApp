import React, { useState, useEffect, useCallback } from 'react';
import { Product, fetchProductsFromSupabase } from '../../services/supabaseService';
import { getCachedProducts } from '../../services/db';
import { useCart } from '../../contexts/CartContext';
import { ProductDetailsModal } from '../modals/ProductDetailsModal';
import { calculatePackageSavings } from '../products/utils';

export const HomePackagesCarousel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  const { addToCart } = useCart();

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

  // Auto-rotate every 4s
  useEffect(() => {
    if (featuredPackages.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredPackages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featuredPackages.length, isPaused]);

  const goNext = useCallback(() => setCurrentIndex(p => (p + 1) % featuredPackages.length), [featuredPackages.length]);
  const goPrev = useCallback(() => setCurrentIndex(p => (p - 1 + featuredPackages.length) % featuredPackages.length), [featuredPackages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setTimeout(() => setIsPaused(false), 3000);
  };

  if (loading && featuredPackages.length === 0) {
    return <div className="mx-4 mb-8 h-[200px] bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />;
  }
  
  if (featuredPackages.length === 0) return null;

  return (
    <>
      <div className="px-4 mb-8 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
          <span className="text-brand-600">🎁</span>
          <span>عروض التوفير</span>
        </h3>

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative w-full h-[150px] rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 group"
        >
          {featuredPackages.map((pkg, i) => {
            const isActive = i === currentIndex;
            const savings = calculatePackageSavings(pkg, products);
            
            return (
              <div 
                key={pkg.id}
                onClick={() => setSelectedProductDetails(pkg)}
                className="absolute inset-0 w-full h-full flex items-center p-4 gap-3 cursor-pointer transition-opacity duration-700 ease-in-out"
                style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 2 : 1, pointerEvents: isActive ? 'auto' : 'none' }}
              >
                {/* Content Side (Right) */}
                <div className="flex-1 flex flex-col h-full justify-center pb-2">
                  <div className="h-[22px] mb-1.5 flex items-end">
                    {savings && (
                      <span className="inline-block bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full w-fit">
                        خصم {savings.discountPercentage}%
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-black text-gray-900 dark:text-white text-[14px] leading-[20px] line-clamp-2 mb-2 h-[40px]">
                    {pkg.name}
                  </h4>
                  
                  <div className="flex items-end gap-2 mt-auto">
                    <p className="text-brand-600 dark:text-brand-400 font-black text-lg font-mono leading-none">
                      {pkg.price} <span className="text-[10px] text-brand-500">ر.ي</span>
                    </p>
                    {savings && (
                      <p className="text-[11px] text-gray-400 line-through font-mono leading-none pb-0.5">
                        {savings.originalTotal}
                      </p>
                    )}
                  </div>
                </div>

                {/* Image Side (Left) */}
                <div className="w-[110px] h-[110px] shrink-0 relative flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-700 overflow-hidden">
                  {pkg.image && (
                    <img 
                      src={pkg.image} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              </div>
            );
          })}

        </div>

        {/* Dots Indicator - Moved Outside */}
        <div className="flex justify-center gap-1.5 mt-3">
          {featuredPackages.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentIndex ? 'w-5 bg-brand-600' : 'w-1.5 bg-gray-200 dark:bg-gray-700'
              }`} 
            />
          ))}
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
