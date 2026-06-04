
import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Heart, ChefHat, Clock, Share2, Check, ArrowRight, Sparkles, BadgeCheck, Gift } from 'lucide-react';
import { Product, Recipe } from '../services/supabaseService';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useScrollLock } from '../hooks';
import { ProductRequestModal } from './ProductRequestModal';
import { getCachedProducts } from '../services/db';

interface ProductDetailsModalProps {
  product: Product;
  relatedRecipes?: Recipe[];
  onClose: () => void;
  onOpenRecipe?: (recipeName: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  relatedRecipes = [], 
  onClose,
  onOpenRecipe
}) => {
  const { addToCart, getItemQuantity, decreaseQuantityByName } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const [resolvedBundleItems, setResolvedBundleItems] = useState<{
    barcode: string;
    product_name: string;
    quantity: number;
    price?: number;
    image?: string;
  }[]>([]);
  const [savingsInfo, setSavingsInfo] = useState<{
    originalTotal: number;
    discountAmount: number;
    discountPercentage: number;
  } | null>(null);

  useEffect(() => {
    const resolveBundleDetails = async () => {
      if (!product.bundle_items || product.bundle_items.length === 0) {
        setResolvedBundleItems([]);
        setSavingsInfo(null);
        return;
      }
      
      try {
        const cached = await getCachedProducts();
        if (cached && cached.length > 0) {
          const resolved = product.bundle_items.map(item => {
            const comp = cached.find(p => p.barcode === item.barcode);
            return {
              barcode: item.barcode,
              product_name: comp ? comp.name : item.product_name,
              quantity: item.quantity,
              price: comp ? comp.price : undefined,
              image: comp ? comp.image_url || comp.image : undefined
            };
          });
          setResolvedBundleItems(resolved);

          // Calculate savings
          let originalTotal = 0;
          let hasMissingPrice = false;
          for (const item of resolved) {
            if (item.price) {
              originalTotal += item.price * item.quantity;
            } else {
              hasMissingPrice = true;
            }
          }
          if (!hasMissingPrice && originalTotal > product.price) {
            const discountAmount = originalTotal - product.price;
            const discountPercentage = Math.round((discountAmount / originalTotal) * 100);
            setSavingsInfo({
              originalTotal,
              discountAmount,
              discountPercentage
            });
          } else {
            setSavingsInfo(null);
          }
        }
      } catch (e) {
        console.warn('Failed to resolve bundle details in modal', e);
      }
    };

    resolveBundleDetails();
  }, [product]);

  // Swipe to close logic
  const [touchStart, setTouchStart] = useState(0);
  const [touchY, setTouchY] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchY(e.touches[0].clientY);
  };
  
  const handleTouchEnd = () => {
    if (touchY - touchStart > 100) {
      onClose();
    }
    setTouchStart(0);
    setTouchY(0);
  };

  const translateY = touchY > touchStart ? touchY - touchStart : 0;
  const swipeStyle = translateY > 0 ? { transform: `translateY(${translateY}px)` } : {};

  // Lock body scroll when modal is open
  useScrollLock(true);
   
  const quantity = getItemQuantity(product.name);
  const liked = isFavorite(product.id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `شاهد هذا المنتج من متجر جودة: ${product.name} \n ${product.description}`,
          url: window.location.href,
        });
      } catch (e) {}
    }
  };

  return (
    <>
    <div 
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-lg md:max-w-4xl h-auto max-h-[90vh] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative flex flex-col md:flex-row animate-slide-up-mobile sm:animate-scale-in border border-gray-200 dark:border-gray-800 overflow-hidden transition-transform"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={swipeStyle}
      >
        
        {/* Left Side (Desktop): Image Area */}
        <div className="relative w-full h-64 sm:h-72 md:h-auto md:w-1/2 bg-white shrink-0 p-6 flex items-center justify-center">
          {/* Swipe Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full z-20 sm:hidden"></div>
          {product.image ? (
             <>
               <div className="absolute inset-0 bg-gray-100 animate-pulse" />
               <img 
                 src={product.image} 
                 alt={product.name} 
                 loading="lazy"
                 className="w-full h-full object-contain relative z-10 opacity-0 transition-opacity duration-500"
                 onLoad={(e) => {
                   e.currentTarget.style.opacity = '1';
                   const prev = e.currentTarget.previousElementSibling as HTMLElement;
                   if (prev) prev.style.display = 'none';
                 }}
               />
             </>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ShoppingBag className="w-20 h-20" />
             </div>
          )}
          
          {/* Top Actions Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-start z-10">
             <button 
               onClick={onClose}
               className="w-10 h-10 bg-gray-100/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors md:hidden shadow-sm"
             >
               <X className="w-5 h-5" />
             </button>

             {/* Desktop Close Button (Right aligned in layout, but absolute here for mobile) */}
             <div className="hidden md:block"></div> 

             <div className="flex gap-2">
               <button 
                  onClick={handleShare}
                  className="w-10 h-10 bg-gray-100/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
               >
                 <Share2 className="w-5 h-5" />
               </button>
               <button 
                  onClick={() => toggleFavorite(product.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-sm ${
                      liked ? 'bg-red-50 text-red-500' : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200'
                  }`}
               >
                 <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
               </button>
             </div>
          </div>
        </div>

        {/* Right Side (Desktop): Content Body */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 md:border-r border-gray-100 dark:border-gray-800 min-h-0">
           
           {/* Desktop Close Button */}
           <div className="hidden md:flex justify-end p-4 absolute top-0 left-0 z-10">
              <button 
                 onClick={onClose}
                 className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 relative bg-white dark:bg-gray-900">
              <div className="mb-6 md:mt-6">
                  <div className="flex flex-col mb-4">
                     <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="text-3xl md:text-4xl font-black text-brand-600 dark:text-brand-400">
                           {product.price || '---'} <span className="text-lg md:text-xl font-bold text-gray-500 dark:text-gray-400">ر.ي</span>
                        </div>
                        {savingsInfo && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 line-through mt-2 font-mono">
                              {savingsInfo.originalTotal} ر.ي
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-black bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-lg border border-green-100 dark:border-green-900/30 mt-1.5">
                              وفر {savingsInfo.discountPercentage}%
                            </span>
                          </div>
                        )}
                     </div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight flex items-start gap-2 flex-wrap">
                       {product.name}
                       
                       {/* UI Badges inline with title */}
                       <div className="flex gap-1.5 items-center pt-1.5 flex-wrap">
                          {product.tags?.includes('discount') && (
                            <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-red-200 dark:border-red-800">
                              <Sparkles className="w-3.5 h-3.5" /> خصم
                            </span>
                          )}
                          {product.tags?.includes('best_seller') && (
                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                              <BadgeCheck className="w-3.5 h-3.5" /> الأكثر مبيعاً
                            </span>
                          )}
                          {product.tags?.includes('gift') && (
                            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-200 dark:border-green-800">
                              <Gift className="w-3.5 h-3.5" /> هدية مجانية
                            </span>
                          )}
                       </div>
                    </h2>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-xs font-bold px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                       {product.category}
                    </span>
                    {product.inStock ? (
                       <span className="text-xs font-bold px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-full text-green-700 dark:text-green-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> متوفر
                       </span>
                    ) : (
                       <span className="text-xs font-bold px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-full text-red-700 dark:text-red-400">
                          نفدت الكمية
                       </span>
                    )}
                 </div>

                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                     {product.description || "لا يوجد وصف إضافي لهذا المنتج، ولكنه مضمون الجودة من متجرنا."}
                  </p>
               </div>

               {/* Package Bundle Items Section */}
               {product.bundle_items && product.bundle_items.length > 0 && (
                 <div className="mb-6 pt-6 border-t border-gray-100 dark:border-gray-800/80 space-y-4">
                   <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                     <Gift className="w-5 h-5 text-amber-500" />
                     مكونات الباكج التوفيري
                   </h3>
                   
                   <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                     {resolvedBundleItems.map((item, idx) => (
                       <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/80 p-3 rounded-2xl flex items-center gap-3">
                         <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-gray-600/50">
                           {item.image ? (
                             <img src={item.image} alt={item.product_name} className="w-full h-full object-contain" />
                           ) : (
                             <ShoppingBag className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                           )}
                         </div>
                         <div className="flex-1 min-w-0 text-right">
                           <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate leading-snug">{item.product_name}</h4>
                           <p className="text-[10px] text-gray-400 font-bold mt-1 font-mono">
                             الكمية: {item.quantity} {item.price ? `(${item.price} ر.ي للواحد)` : ''}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   {/* Smart Savings Dashboard */}
                   {savingsInfo && (
                     <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl mt-4">
                       <h4 className="text-xs font-black text-green-700 dark:text-green-400 mb-2.5 flex items-center gap-1">
                         <span>حاسبة التوفير الذكية من جودة</span>
                         <span>⚡</span>
                       </h4>
                       <div className="grid grid-cols-3 gap-2 text-center text-xs">
                         <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col justify-center">
                           <span className="block text-[9px] text-gray-400 mb-1">المنتجات منفردة</span>
                           <span className="font-bold text-gray-500 line-through font-mono leading-none">{savingsInfo.originalTotal} ر.ي</span>
                         </div>
                         <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col justify-center">
                           <span className="block text-[9px] text-gray-400 mb-1">سعر البكج</span>
                           <span className="font-bold text-brand-600 dark:text-brand-400 font-mono leading-none">{product.price} ر.ي</span>
                         </div>
                         <div className="bg-green-600 text-white p-2.5 rounded-xl shadow-sm flex flex-col justify-center">
                           <span className="block text-[9px] text-green-100 mb-1">وفرت في جيبك</span>
                           <span className="font-black font-mono leading-none">+{savingsInfo.discountAmount} ر.ي ({savingsInfo.discountPercentage}%)</span>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}

              {/* Related Recipes Section */}
               {relatedRecipes.length > 0 && onOpenRecipe && (
                <div className="mb-6 animate-fade-in">
                   <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-orange-500" />
                      وصفات ذات صلة
                   </h3>
                   <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 hide-scrollbar md:flex-wrap">
                      {relatedRecipes.map(recipe => (
                         <button 
                           key={recipe.id}
                           onClick={() => onOpenRecipe(product.name)}
                           className="min-w-[200px] md:min-w-[48%] bg-orange-50 dark:bg-gray-800 border border-orange-100 dark:border-gray-700 p-3 rounded-2xl flex items-center gap-3 text-right hover:border-orange-300 transition-colors"
                         >
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 shrink-0 overflow-hidden">
                               {recipe.image ? (
                                   <img src={recipe.image} alt={recipe.title} loading="lazy" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-6 h-6 text-orange-300" /></div>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate">{recipe.title}</h4>
                               <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{recipe.time}</span>
                               </div>
                            </div>
                         </button>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Footer Actions */}
           <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom mt-auto">
              <div className="flex gap-3">
                 {quantity > 0 ? (
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 flex items-center justify-between">
                       <button 
                          onClick={() => decreaseQuantityByName(product.name)}
                          className="w-12 h-12 md:w-10 md:h-10 bg-white dark:bg-gray-700 rounded-xl shadow-sm flex items-center justify-center text-xl font-bold hover:bg-gray-50 transition-colors"
                       >
                          -
                       </button>
                       <span className="text-xl font-bold">{quantity}</span>
                       <button 
                          onClick={() => addToCart(product.name, product.source || 'store', product.barcode, product.price?.toString())}
                          className="w-12 h-12 md:w-10 md:h-10 bg-brand-600 text-white rounded-xl shadow-sm flex items-center justify-center text-xl font-bold hover:bg-brand-700 transition-colors"
                       >
                          +
                       </button>
                    </div>
                 ) : (
                    <button 
                      onClick={() => product.inStock ? addToCart(product.name, product.source || 'store', product.barcode, product.price?.toString()) : setRequestModalOpen(true)}
                      className={`flex-1 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                        product.inStock 
                          ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-200 dark:shadow-none' 
                          : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                    >
                       <ShoppingBag className="w-5 h-5" />
                       <span>{product.inStock ? 'إضافة للسلة' : 'اطلب توفيره'}</span>
                    </button>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
    
    {requestModalOpen && (
      <ProductRequestModal 
        initialProductName={product.name} 
        onClose={() => setRequestModalOpen(false)} 
      />
    )}
    </>
  );
};
