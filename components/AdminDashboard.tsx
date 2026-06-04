import React, { useEffect, useState } from 'react';
import { 
  Shield, Gift, BadgeCheck, Image as ImageIcon, BookOpen, 
  ChefHat, Check, AlertCircle 
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchProductsFromSupabase, Product, Recipe, Article } from '../services/supabaseService';

// Extracted Sub-managers
import { BadgeManager } from './admin/BadgeManager';
import { PackageManager } from './admin/PackageManager';
import { BannerManager } from './admin/BannerManager';
import { RecipeManager } from './admin/RecipeManager';
import { ArticleManager } from './admin/ArticleManager';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'packages' | 'banners' | 'recipes' | 'articles'>('badges');
  const [pin] = useState(() => sessionStorage.getItem('admin_pin') || '');
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reload data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Products
      const fetchedProducts = await fetchProductsFromSupabase();
      setProducts(fetchedProducts);

      // Recipes
      const { data: fetchedRecipes } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (fetchedRecipes) setRecipes(fetchedRecipes);

      // Articles
      const { data: fetchedArticles } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      if (fetchedArticles) setArticles(fetchedArticles);

      // Banners
      const { data: fetchedBanners } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
      if (fetchedBanners) setBanners(fetchedBanners);

    } catch (err: any) {
      setError(err.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pin) {
      setError('غير مصرح: الرمز السري للمشرف مفقود. يرجى تسجيل الدخول مجدداً.');
    } else {
      loadData();
    }
  }, [pin]);

  // Flash messages helper
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  return (
    <div className="pb-24 text-right" dir="rtl">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand-50 dark:bg-brand-900/20 p-2.5 rounded-2xl">
          <Shield className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">لوحة تحكم المشرف</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">إدارة الباكجات، الشارات، والمحتوى التوعوي والتجاري</p>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {([
          { id: 'badges', label: 'شارات المنتجات', icon: <BadgeCheck className="w-4 h-4" /> },
          { id: 'packages', label: 'منشئ الباكجات', icon: <Gift className="w-4 h-4" /> },
          { id: 'banners', label: 'البانرات الإعلانية', icon: <ImageIcon className="w-4 h-4" /> },
          { id: 'recipes', label: 'الوصفات والطهي', icon: <ChefHat className="w-4 h-4" /> },
          { id: 'articles', label: 'المقالات الطبية', icon: <BookOpen className="w-4 h-4" /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading && !success && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Managers Content */}
      {!loading && activeTab === 'badges' && (
        <BadgeManager
          products={products}
          setProducts={setProducts}
          pin={pin}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {!loading && activeTab === 'packages' && (
        <PackageManager
          products={products}
          pin={pin}
          showSuccess={showSuccess}
          showError={showError}
          loadData={loadData}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {!loading && activeTab === 'banners' && (
        <BannerManager
          banners={banners}
          pin={pin}
          showSuccess={showSuccess}
          showError={showError}
          loadData={loadData}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {!loading && activeTab === 'recipes' && (
        <RecipeManager
          recipes={recipes}
          pin={pin}
          showSuccess={showSuccess}
          showError={showError}
          loadData={loadData}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {!loading && activeTab === 'articles' && (
        <ArticleManager
          articles={articles}
          pin={pin}
          showSuccess={showSuccess}
          showError={showError}
          loadData={loadData}
          loading={loading}
          setLoading={setLoading}
        />
      )}
    </div>
  );
};
