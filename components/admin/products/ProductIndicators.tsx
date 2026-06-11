import React from 'react';
import { Tag, Star, Gift, EyeOff, XCircle } from 'lucide-react';
import { Product } from '../../../services/supabaseService';

export const ProductIndicators: React.FC<{ product: Product }> = ({ product }) => {
  const tags = product.tags || [];
  
  return (
    <div className="flex items-center gap-1.5 justify-end shrink-0">
      {product.is_hidden_in_app && (
        <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border border-gray-200 dark:border-gray-700 whitespace-nowrap">
          <EyeOff className="w-2.5 h-2.5" /> مخفي
        </span>
      )}
      {product.force_out_of_stock && (
        <span className="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
          <XCircle className="w-2.5 h-2.5" /> منتهي
        </span>
      )}
      {tags.includes('discount') && <Tag className="w-3.5 h-3.5 text-red-500" title="خصم" />}
      {tags.includes('best_seller') && <Star className="w-3.5 h-3.5 text-amber-500" title="الأكثر مبيعاً" />}
      {tags.includes('gift') && <Gift className="w-3.5 h-3.5 text-green-500" title="هدية" />}
    </div>
  );
};
