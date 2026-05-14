
import React from 'react';
import { X, ChefHat, Clock, ArrowRight } from 'lucide-react';
import { Recipe } from '../services/supabaseService';

interface ProductRecipesModalProps {
  productName: string;
  recipes: Recipe[];
  onClose: () => void;
}

export const ProductRecipesModal: React.FC<ProductRecipesModalProps> = ({ productName, recipes, onClose }) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg h-[70vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col animate-slide-up-mobile sm:animate-scale-in border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 rounded-t-3xl">
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
               <ChefHat className="w-6 h-6 text-orange-500" />
               وصفات بمنتج "{productName}"
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              أطباق شهية يمكنك تحضيرها باستخدام هذا المنتج
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
          {recipes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">لا توجد وصفات مسجلة لهذا المنتج حالياً.</p>
            </div>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 flex gap-3 shadow-sm hover:border-orange-200 dark:hover:border-orange-900 transition-all group">
                 <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-700 shrink-0 overflow-hidden relative">
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ChefHat className="w-8 h-8" />
                      </div>
                    )}
                 </div>
                 <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1 line-clamp-2">{recipe.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                        {recipe.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time}</span>}
                        {recipe.difficulty && <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">{recipe.difficulty}</span>}
                    </div>
                    <div className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                       <span>شاهد التفاصيل في المطبخ</span>
                       <ArrowRight className="w-3 h-3 rotate-180" />
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
