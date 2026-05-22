import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, ChefHat, ArrowLeft, ArrowRight, BarChart3, ArrowUpLeft, Layers } from 'lucide-react';
import { fetchRecipesFromSupabase, Recipe } from '../services/supabaseService';

const RECIPE_LIST_KEY = 'jouda_recipe_list_v2';
const RECIPE_IDX_KEY = 'jouda_recipe_idx_v2';

export const TrendingRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let list: Recipe[] = [];
        const cachedList = localStorage.getItem(RECIPE_LIST_KEY);
        if (cachedList) {
          list = JSON.parse(cachedList);
        } else {
          list = await fetchRecipesFromSupabase();
          if (list.length > 0) {
            localStorage.setItem(RECIPE_LIST_KEY, JSON.stringify(list));
          }
        }

        if (list.length > 0) {
          const todayIdxStr = localStorage.getItem(RECIPE_IDX_KEY);
          const todayIdx = todayIdxStr ? parseInt(todayIdxStr, 10) : 0;
          const filtered = list
            .filter((_, idx) => idx !== todayIdx)
            .slice(0, 6);
          setRecipes(filtered);
        }
      } catch {
        /* silent */
      }
      setLoading(false);
    };
    load();
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [recipes]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCardClick = () => {
    navigate('/recipes');
  };

  const handleViewAll = () => {
    navigate('/recipes');
  };

  if (loading) return (
    <div className="flex gap-3 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="min-w-[220px] h-[270px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse shrink-0" />
      ))}
    </div>
  );

  if (recipes.length === 0) return null;

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="text-brand-600">🔥</span>
          <span>وصفات رائجة</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="اليمين"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="اليسار"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recipes.map((recipe) => {
          const ingredientCount = recipe.ingredients?.length || 0;
          return (
            <div
              key={recipe.id}
              onClick={handleCardClick}
              className="min-w-[220px] max-w-[220px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group snap-start shrink-0 flex flex-col overflow-hidden active:scale-95"
            >
              {/* Image */}
              <div className="relative h-32 w-full bg-gray-50 dark:bg-gray-700 overflow-hidden">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                    <ChefHat className="w-10 h-10 text-orange-300 dark:text-orange-500/50" />
                  </div>
                )}
                {recipe.videoUrl && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <span className="text-white text-[8px]">▶</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 flex flex-col flex-1">
                <h4 className="font-black text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1.5 min-h-[2.5em]">
                  {recipe.title}
                </h4>

                {/* Metadata */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
                  {recipe.time && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {recipe.time}
                    </span>
                  )}
                  {recipe.calories && (
                    <span className="flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-orange-400" /> {recipe.calories}
                    </span>
                  )}
                </div>

                {/* Ingredient Count + Difficulty */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {ingredientCount > 0 && (
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      {ingredientCount} مكون
                    </span>
                  )}
                  {recipe.difficulty && (
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BarChart3 className="w-2.5 h-2.5" />
                      {recipe.difficulty}
                    </span>
                  )}
                </div>

                {/* View Recipe Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    navigate('/recipes');
                  }}
                  className="mt-auto w-full bg-brand-50 dark:bg-white text-brand-700 dark:text-gray-900 hover:bg-brand-100 dark:hover:bg-gray-100 active:scale-95 transition-all py-2 rounded-xl font-bold text-xs"
                >
                  عرض الوصفة
                </button>
              </div>
            </div>
          );
        })}

        {/* "عرض الكل" Link at the end */}
        <button
          onClick={handleViewAll}
          className="min-w-[100px] max-w-[100px] h-[270px] bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all cursor-pointer snap-start shrink-0 flex flex-col items-center justify-center gap-2 group"
        >
          <ArrowUpLeft className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            عرض الكل
          </span>
        </button>
      </div>
    </div>
  );
};
