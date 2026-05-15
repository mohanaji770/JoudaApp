
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Flame, ChefHat, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { fetchRecipesWithFallback, Recipe } from '../services/supabaseService';

const RECIPE_OF_DAY_KEY = 'jouda_recipe_of_day_v1';
const RECIPE_OF_DAY_DATE_KEY = 'jouda_recipe_of_day_date_v1';

export const RecipeOfTheDay: React.FC = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { addMultipleToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      // Check if we already have today's recipe cached
      const cachedDate = localStorage.getItem(RECIPE_OF_DAY_DATE_KEY);
      const today = new Date().toDateString();

      if (cachedDate === today) {
        const cached = localStorage.getItem(RECIPE_OF_DAY_KEY);
        if (cached) {
          try {
            setRecipe(JSON.parse(cached));
            setLoading(false);
            return;
          } catch (e) {
            localStorage.removeItem(RECIPE_OF_DAY_KEY);
          }
        }
      }

      // Fetch fresh and cache
      try {
        const recipes = await fetchRecipesWithFallback();
        if (recipes.length > 0) {
          const today = new Date();
          const start = new Date(today.getFullYear(), 0, 0);
          const diff = today.getTime() - start.getTime();
          const oneDay = 1000 * 60 * 60 * 24;
          const dayOfYear = Math.floor(diff / oneDay);

          const index = dayOfYear % recipes.length;
          const selected = recipes[index];

          setRecipe(selected);
          localStorage.setItem(RECIPE_OF_DAY_KEY, JSON.stringify(selected));
          localStorage.setItem(RECIPE_OF_DAY_DATE_KEY, new Date().toDateString());
        }
      } catch (e) {
        console.error("Failed to load daily recipe", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBuyIngredients = () => {
    if (!recipe) return;
    const itemsToBuy = [];
    
    // Add main product
    if (recipe.mainProduct) itemsToBuy.push(recipe.mainProduct);
    
    // Add bundle items if they exist
    if (recipe.bundleItems && recipe.bundleItems.length > 0) {
      itemsToBuy.push(...recipe.bundleItems);
    } else if (!recipe.mainProduct) {
        // Fallback if no items configured
        alert("عذراً، لا توجد منتجات محددة لهذه الوصفة في المتجر حالياً.");
        return;
    }
    
    if (itemsToBuy.length > 0) {
      addMultipleToCart(itemsToBuy, 'store');
    }
  };

  if (loading) return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer"></div>
      </div>
  );

  if (!recipe) return null;

  return (
    <div className="w-full relative h-[320px] rounded-3xl overflow-hidden shadow-lg group cursor-pointer border border-gray-100 dark:border-gray-800">
      {/* Background Image */}
      {recipe.image ? (
          <img 
            src={recipe.image} 
            alt={recipe.title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
      ) : (
          <div className="w-full h-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <ChefHat className="w-20 h-20 text-orange-300 dark:text-orange-500/50" />
          </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      {/* Badge */}
      <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-fade-in">
          <Sparkles className="w-3 h-3 fill-yellow-200 text-yellow-200" />
          <span>وصفة اليوم المقترحة</span>
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
          
          <h3 className="text-2xl font-black mb-1.5 leading-tight text-white drop-shadow-md">
            {recipe.title}
          </h3>
          
          <p className="text-sm text-gray-200 line-clamp-2 mb-3 opacity-90 font-medium leading-relaxed">
             {recipe.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-300 mb-5 font-bold">
             {recipe.time && <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><Clock className="w-3.5 h-3.5 text-orange-400" /> {recipe.time}</span>}
             {recipe.calories && <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><Flame className="w-3.5 h-3.5 text-orange-400" /> {recipe.calories}</span>}
          </div>

          <button 
             onClick={(e) => {
                 e.stopPropagation();
                 handleBuyIngredients();
             }}
             className="w-full bg-white text-gray-900 hover:bg-orange-50 active:scale-95 transition-all py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20"
          >
             <ShoppingBag className="w-5 h-5 text-orange-600" />
             <span>شراء المكونات ({recipe.bundleItems ? recipe.bundleItems.length + (recipe.mainProduct ? 1 : 0) : 1})</span>
          </button>
      </div>
    </div>
  );
};
    