import React from 'react';
import { Tag, Star, Gift, EyeOff, XCircle, Infinity, PowerOff } from 'lucide-react';
import { Product } from '../../../services/supabaseService';

export const ProductIndicators: React.FC<{ product: Product }> = ({ product }) => {
  const tags = product.tags || [];
  
  return (
    <div className="flex items-center gap-1.5 justify-end shrink-0">
      {product.is_active === false && (
        <span className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border border-red-200 dark:border-red-800 whitespace-nowrap">
          <PowerOff className="w-2.5 h-2.5" /> غير نشط
        </span>
      )}
      {product.is_hidden_in_app && (
        <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border border-gray-200 dark:border-gray-700 whitespace-nowrap">
          <EyeOff className="w-2.5 h-2.5" /> مخفي من التطبيق
        </span>
      )}
      {product.force_out_of_stock && (
        <span className="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
          <XCircle className="w-2.5 h-2.5" /> يظهر كنافد
        </span>
      )}
      {product.is_stock_tracked === false && (
        <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
          <Infinity className="w-2.5 h-2.5" /> لا يتتبع المخزون
        </span>
      )}
      {tags.includes('discount') && <span title="خصم"><Tag className="w-3.5 h-3.5 text-red-500" /></span>}
      {tags.includes('best_seller') && <span title="الأكثر مبيعاً"><Star className="w-3.5 h-3.5 text-amber-500" /></span>}
      {tags.includes('gift') && <span title="هدية"><Gift className="w-3.5 h-3.5 text-green-500" /></span>}
    </div>
  );
};
