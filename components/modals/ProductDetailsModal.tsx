
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Heart, ChefHat, Clock, Share2, Check, ArrowRight, Sparkles, BadgeCheck, Gift } from 'lucide-react';
import { Product, Recipe } from '../../services/supabaseService';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useScrollLock } from '../../hooks/index';
import { ProductRequestModal } from './ProductRequestModal';
import { getCachedProducts } from '../../services/db';

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

  return createPortal(
    <>
    <div 
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative flex flex-col animate-slide-up-mobile sm:animate-scale-in border border-gray-200 dark:border-gray-800 overflow-hidden transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="relative w-full h-64 sm:h-72 bg-white shrink-0 p-6 flex items-center justify-center">
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
               className="w-10 h-10 bg-gray-100/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
             >
               <X className="w-5 h-5" />
             </button>

             {/* Desktop Close Button (Right aligned in layout, but absolute here for mobile) */}
 

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
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0">
           
           {/* Desktop Close Button */}


           <div className="flex-1 overflow-y-auto p-6 relative bg-white dark:bg-gray-900">
                <div className="mb-6">
                   {/* Clean Minimal Badges (moved to top for elegant hierarchy) */}
                   <div className="flex gap-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wide">
                      <span>{product.category}</span>
                      {product.tags?.includes('discount') && <span className="text-brand-500 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/> عرض خاص</span>}
                      {product.tags?.includes('best_seller') && <span className="text-amber-500 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5"/> الأكثر مبيعاً</span>}
                      {product.tags?.includes('gift') && <span className="text-green-500 flex items-center gap-1"><Gift className="w-3.5 h-3.5"/> هدايا مضمنة</span>}
                   </div>

                   {/* Title */}
                   <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                      {product.name}
                   </h2>

                   {/* Clean Price Display */}
                   <div className="flex items-baseline gap-3 mb-6">
                      <div className="text-3xl font-black text-brand-600 dark:text-brand-400 tracking-tight">
                         {product.price || '---'} <span className="text-lg text-gray-500 font-bold">ر.ي</span>
                      </div>
                      {savingsInfo && (
                        <div className="flex items-center gap-2">
                          <span className="text-base text-gray-400 line-through font-mono">
                            {savingsInfo.originalTotal} ر.ي
                          </span>
                        </div>
                      )}
                      {product.inStock ? (
                         <span className="mr-auto text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                            <Check className="w-3.5 h-3.5" /> متوفر
                         </span>
                      ) : (
                         <span className="mr-auto text-xs font-bold text-red-500 flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                            نفدت الكمية
                         </span>
                      )}
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                      {product.description || "لا يوجد وصف إضافي لهذا المنتج، ولكنه مضمون الجودة من متجرنا."}
                   </p>
                </div>

               {/* Package Bundle Items Section */}
               {product.bundle_items && product.bundle_items.length > 0 && (
                 <div className="mb-6 pt-6 border-t border-gray-100 dark:border-gray-800/80">
                   <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4 text-sm">
                     <Gift className="w-4 h-4 text-brand-500" />
                     محتويات الباكج
                   </h3>
                   
                   {/* Clean List Instead of Boxes */}
                   <ul className="space-y-3 mb-6">
                     {resolvedBundleItems.map((item, idx) => (
                       <li key={idx} className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-gray-800/50 pb-3 last:border-0 last:pb-0">
                         <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                           <span className="text-gray-700 dark:text-gray-300 font-medium">{item.quantity} × {item.product_name}</span>
                         </div>
                         {item.price && (
                            <span className="text-xs text-gray-400 font-mono shrink-0 pr-4">{item.price} ر.ي</span>
                         )}
                       </li>
                     ))}
                   </ul>
                   
                   {/* Minimal Receipt-Style Savings Summary */}
                   {savingsInfo && (
                     <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                       <div className="space-y-2 text-sm">
                         <div className="flex justify-between text-gray-500 dark:text-gray-400">
                           <span>قيمة المنتجات مفردة</span>
                           <span className="font-mono">{savingsInfo.originalTotal} ر.ي</span>
                         </div>
                         <div className="flex justify-between text-gray-500 dark:text-gray-400">
                           <span>سعر الباكج</span>
                           <span className="font-mono">{product.price} ر.ي</span>
                         </div>
                         <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold">
                           <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> وفرت في جيبك</span>
                           <span className="text-green-600 dark:text-green-400 font-mono">
                             {savingsInfo.discountAmount} ر.ي (وفر {savingsInfo.discountPercentage}%)
                           </span>
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
                   <div className="flex flex-col gap-3 pb-2">
                      {relatedRecipes.map(recipe => (
                         <button 
                           key={recipe.id}
                           onClick={() => onOpenRecipe(product.name)}
                           className="w-full bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3 text-right"
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
           <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom mt-auto">
              <div className="flex gap-3">
                 {quantity > 0 ? (
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 flex items-center justify-between">
                       <button 
                          onClick={() => decreaseQuantityByName(product.name)}
                          className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl shadow-sm flex items-center justify-center text-xl font-bold hover:bg-gray-50 transition-colors"
                       >
                          -
                       </button>
                       <span className="text-xl font-bold">{quantity}</span>
                       <button 
                          onClick={() => addToCart(product.name, product.source || 'store', product.barcode, product.price?.toString())}
                          className="w-12 h-12 bg-brand-600 text-white rounded-xl shadow-sm flex items-center justify-center text-xl font-bold hover:bg-brand-700 transition-colors"
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
    </>,
    document.body
  );
};
