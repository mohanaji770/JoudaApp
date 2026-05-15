
import React from 'react';
import { X, ShoppingBag, Heart, ChefHat, Clock, Share2, Check, ArrowRight } from 'lucide-react';
import { Product, Recipe } from '../services/supabaseService';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useScrollLock } from '../hooks';

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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-lg md:max-w-4xl h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative flex flex-col md:flex-row animate-slide-up-mobile sm:animate-scale-in border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side (Desktop): Image Area */}
        <div className="relative w-full h-64 sm:h-72 md:h-auto md:w-1/2 bg-gray-100 dark:bg-gray-800 shrink-0">
          {product.image ? (
             <img 
               src={product.image} 
               alt={product.name} 
               loading="lazy"
               className="w-full h-full object-cover"
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ShoppingBag className="w-20 h-20" />
             </div>
          )}
          
          {/* Top Actions Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent md:from-black/20">
             <button 
               onClick={onClose}
               className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors md:hidden"
             >
               <X className="w-6 h-6" />
             </button>

             {/* Desktop Close Button (Right aligned in layout, but absolute here for mobile) */}
             <div className="hidden md:block"></div> 

             <div className="flex gap-3">
               <button 
                  onClick={handleShare}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
               >
                 <Share2 className="w-5 h-5" />
               </button>
               <button 
                  onClick={() => toggleFavorite(product.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      liked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
               >
                 <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
               </button>
             </div>
          </div>
        </div>

        {/* Right Side (Desktop): Content Body */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 md:border-r border-gray-100 dark:border-gray-800">
           
           {/* Desktop Close Button */}
           <div className="hidden md:flex justify-end p-4 absolute top-0 left-0 z-10">
              <button 
                 onClick={onClose}
                 className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 relative -mt-6 md:mt-0 bg-white dark:bg-gray-900 rounded-t-[2rem] md:rounded-none">
              {/* Handle Bar for mobile */}
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden"></div>

              <div className="mb-6 md:mt-8">
                 <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight flex-1 ml-4">
                       {product.name}
                    </h2>
                    <div className="text-xl md:text-2xl font-black text-brand-600 dark:text-brand-400 whitespace-nowrap">
                       {product.price}
                    </div>
                 </div>
                 
                 <div className="flex gap-2 mb-4">
                    <span className="text-[10px] md:text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                       {product.category}
                    </span>
                    {product.inStock ? (
                       <span className="text-[10px] md:text-xs font-bold px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> متوفر
                       </span>
                    ) : (
                       <span className="text-[10px] md:text-xs font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400">
                          نفد الكمية
                       </span>
                    )}
                 </div>

                 <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {product.description || "لا يوجد وصف إضافي لهذا المنتج، ولكنه مضمون الجودة من متجرنا."}
                 </p>
              </div>

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
                          onClick={() => addToCart(product.name, product.source || 'store')}
                          className="w-12 h-12 md:w-10 md:h-10 bg-brand-600 text-white rounded-xl shadow-sm flex items-center justify-center text-xl font-bold hover:bg-brand-700 transition-colors"
                       >
                          +
                       </button>
                    </div>
                 ) : (
                    <button 
                      onClick={() => addToCart(product.name, product.source || 'store')}
                      disabled={!product.inStock}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                       <ShoppingBag className="w-5 h-5" />
                       <span>{product.inStock ? 'إضافة للسلة' : 'غير متوفر حالياً'}</span>
                    </button>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
