import React, { useState, useMemo, useEffect } from 'react';
import { PackageSearch, Search, RefreshCw, Settings2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Product, AppCategory, fetchAppCategoriesFromSupabase } from '../../services/supabaseService';
import { AdminProductService } from '../../services/admin/AdminProductService';

import { ProductCard } from './products/ProductCard';
import { ManageCategoriesModal } from './products/ManageCategoriesModal';
import { EditProductModal } from './products/EditProductModal';

interface ProductManagerProps {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  showSuccess,
  showError,
  loading,
  setLoading
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(50);

  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        supabase.from('products').select('*').order('name', { ascending: true }),
        fetchAppCategoriesFromSupabase()
      ]);

      if (prodData.error) throw prodData.error;
      
      setProducts(prodData.data || []);
      setCategories(catData || []);
    } catch (err: any) {
      showError(err.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    const data = await fetchAppCategoriesFromSupabase();
    setCategories(data || []);
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProperties = async (product: Product, updates: any) => {
    setIsSaving(true);
    try {
      if (updates.category && updates.category !== product.category) {
        await AdminProductService.updateCashierCategory(product.barcode, updates.category);
      }
      
      await AdminProductService.updateProductProperties(product.barcode, updates);
      
      setProducts(prev => prev.map(p => p.barcode === product.barcode ? { ...p, ...updates } : p));
      showSuccess('تم تحديث خصائص المنتج بنجاح');
      setSelectedProduct(null);
    } catch (err: any) {
      showError(err.message || 'فشل تحديث المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
      const resolvedCat = p.app_category || p.category;
      const matchesCat = categoryFilter === 'ALL' || resolvedCat === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, categoryFilter]);

  const uniqueCashierCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [products]);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, categoryFilter]);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 md:bg-white md:dark:bg-gray-900 md:border md:border-gray-100 md:dark:border-gray-800 md:p-6 md:rounded-3xl animate-fade-in relative min-h-screen md:min-h-[600px] flex flex-col">
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 md:bg-transparent pb-4 pt-2 md:pt-0">
        <div className="flex items-center justify-between mb-4 px-2 md:px-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center border border-brand-100 dark:border-brand-800/50 shrink-0">
              <PackageSearch className="w-5 h-5 md:w-6 md:h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-white">خصائص المنتجات</h2>
              <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5 font-bold">
                تحكم شامل في تصنيفات وشارات التطبيق.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManageCatsOpen(true)}
              className="w-10 h-10 md:w-auto md:px-4 md:py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-brand-600 dark:text-brand-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden md:inline">إدارة التصنيفات</span>
            </button>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="w-10 h-10 md:w-auto md:px-4 md:py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">تحديث</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-2 md:px-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-9 pl-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white transition-all shadow-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white w-28 md:w-48 transition-all shadow-sm appearance-none"
          >
            <option value="ALL">الكل</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 md:px-0 pb-24">
        <div className="flex flex-col gap-1.5 md:gap-2">
          {filteredProducts.slice(0, visibleCount).map(product => (
            <ProductCard 
              key={product.barcode} 
              product={product} 
              onClick={() => setSelectedProduct(product)} 
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
              <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">لا توجد منتجات مطابقة للبحث</p>
            </div>
          )}

          {visibleCount < filteredProducts.length && (
            <button
              onClick={() => setVisibleCount(v => v + 50)}
              className="mt-4 mb-4 py-3 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-brand-600 dark:text-brand-400 rounded-xl text-sm font-bold transition-all shadow-sm mx-auto flex items-center justify-center"
            >
              عرض المزيد ({filteredProducts.length - visibleCount} متبقي)
            </button>
          )}
        </div>
      </div>

      {selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          categories={categories}
          cashierCategories={uniqueCashierCategories}
          isSaving={isSaving}
          onClose={() => !isSaving && setSelectedProduct(null)}
          onSave={handleSaveProperties}
        />
      )}

      {isManageCatsOpen && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setIsManageCatsOpen(false)}
          onRefresh={refreshCategories}
          showError={showError}
          showSuccess={showSuccess}
        />
      )}
    </div>
  );
};
