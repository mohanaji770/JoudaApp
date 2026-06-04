import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Product } from '../../services/supabaseService';

interface BadgeManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  pin: string;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}

export const BadgeManager: React.FC<BadgeManagerProps> = ({
  products,
  setProducts,
  pin,
  showSuccess,
  showError,
}) => {
  const [badgeSearch, setBadgeSearch] = useState('');

  const filteredBadgeProducts = useMemo(() => {
    return products.filter(
      p =>
        p.name.toLowerCase().includes(badgeSearch.toLowerCase()) ||
        p.barcode.includes(badgeSearch)
    );
  }, [products, badgeSearch]);

  const handleTagToggle = async (product: Product, tag: string) => {
    if (!pin) return;
    const currentTags = product.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    try {
      const { data, error: rpcError } = await supabase.rpc('admin_update_product_tags', {
        p_pin: pin,
        p_barcode: product.barcode,
        p_tags: newTags
      });

      if (rpcError) throw rpcError;
      if (data) {
        setProducts(prev =>
          prev.map(p => (p.barcode === product.barcode ? { ...p, tags: newTags } : p))
        );
        showSuccess('تم تحديث شارات المنتج بنجاح');
      }
    } catch (err: any) {
      showError(err.message || 'فشل تحديث الشارات');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="ابحث باسم المنتج أو الباركود..."
          value={badgeSearch}
          onChange={e => setBadgeSearch(e.target.value)}
          className="w-full h-11 pr-10 pl-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs text-gray-900 dark:text-white placeholder-gray-400"
        />
        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-50 dark:bg-gray-850 text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="p-3">المنتج</th>
              <th className="p-3">الباركود</th>
              <th className="p-3 text-center">خصم 🏷️</th>
              <th className="p-3 text-center">الأكثر مبيعاً 🔥</th>
              <th className="p-3 text-center">هدية مجانية 🎁</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredBadgeProducts.slice(0, 50).map(p => {
              const currentTags = p.tags || [];
              return (
                <tr key={p.barcode} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <td className="p-3 font-bold text-gray-900 dark:text-gray-100">{p.name}</td>
                  <td className="p-3 font-mono text-[10px] text-gray-400">{p.barcode}</td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={currentTags.includes('discount')}
                      onChange={() => handleTagToggle(p, 'discount')}
                      className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={currentTags.includes('best_seller')}
                      onChange={() => handleTagToggle(p, 'best_seller')}
                      className="w-4 h-4 rounded text-amber-500 border-gray-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={currentTags.includes('gift')}
                      onChange={() => handleTagToggle(p, 'gift')}
                      className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
                    />
                  </td>
                </tr>
              );
            })}
            {filteredBadgeProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">لا توجد نتائج مطابقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
