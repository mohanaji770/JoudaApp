import React from 'react';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemRowProps {
  item: any;
  cachedProducts: any[];
  bouncingItemId: string | null;
  handleIncrease: (name: string, id: string) => void;
  handleDecrease: (id: string) => void;
  handleRemove: (id: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  cachedProducts,
  bouncingItemId,
  handleIncrease,
  handleDecrease,
  handleRemove
}) => {
  const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
  const isPackage = item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
  const bundleItems = matchedProduct?.bundle_items || [];
  
  let savings = 0;
  if (isPackage && bundleItems.length > 0) {
    const regularTotal = bundleItems.reduce((sum: number, bItem: any) => {
      const compProd = cachedProducts.find(p => p.barcode === bItem.barcode);
      const compPrice = compProd ? compProd.price : 0;
      return sum + (compPrice * bItem.quantity);
    }, 0);
    const pkgPrice = parseFloat(item.price || '0') || 0;
    if (regularTotal > pkgPrice) {
      savings = (regularTotal - pkgPrice) * item.quantity;
    }
  }

  const isBouncing = bouncingItemId === item.id;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate leading-snug">{item.name}</h3>
            {isPackage && (
              <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                🎁 عرض خاص
              </span>
            )}
          </div>
          
          {isPackage && bundleItems.length > 0 && (
            <div className="pr-2.5 py-1.5 mt-1.5 mb-2 border-r-2 border-amber-200 dark:border-amber-900 space-y-1.5 bg-amber-50/10 dark:bg-amber-950/5 rounded-l-lg">
              {bundleItems.map((bItem: any, idx: number) => {
                const compProd = cachedProducts.find(p => p.barcode === bItem.barcode);
                const compImg = compProd ? compProd.image_url || compProd.image : null;
                return (
                  <div key={idx} className="text-[10px] text-gray-600 dark:text-gray-300 font-bold flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-white dark:bg-gray-700 border border-gray-150 dark:border-gray-650 overflow-hidden flex items-center justify-center shrink-0">
                      {compImg ? (
                        <img src={compImg} alt={bItem.product_name} className="w-full h-full object-contain" />
                      ) : (
                        <ShoppingBag className="w-3 h-3 text-gray-300 dark:text-gray-500" />
                      )}
                    </div>
                    <span className="truncate">{bItem.product_name}</span>
                    <span className="font-mono text-gray-400 dark:text-gray-500 font-bold mr-auto">×{bItem.quantity * item.quantity}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-black text-gray-900 dark:text-white">
              {item.price ? `${parseFloat(item.price) * item.quantity} ريال` : 'السعر لاحقاً'}
            </span>
            {savings > 0 && (
              <span className="text-[9px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-900/30">
                وفرت {savings.toLocaleString('en-US')} ريال! 🎉
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center mr-2 self-start shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => handleDecrease(item.id)}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 shadow-sm active:bg-gray-100 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className={`text-sm font-bold min-w-[20px] text-center text-gray-800 dark:text-white ${isBouncing ? 'cart-qty-bounce' : ''}`}>
              {item.quantity}
            </span>
            <button 
              onClick={() => handleIncrease(item.name, item.id)}
              className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-lg shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => handleRemove(item.id)}
            className="w-full h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors text-[10px] font-bold gap-1"
          >
            <Trash2 className="w-3 h-3" /> حذف
          </button>
        </div>
      </div>
    </div>
  );
};
