import React from 'react';
import { ShoppingBag, X, ChevronRight } from 'lucide-react';

interface CartHeaderProps {
  totalItems: number;
  handleClose: () => void;
  step?: 'cart' | 'checkout';
  onBack?: () => void;
}

export const CartHeader: React.FC<CartHeaderProps> = ({ totalItems, handleClose, step = 'cart', onBack }) => (
  <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-warm-white dark:bg-gray-900 sticky top-0 z-10 shrink-0 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="bg-brand-50 dark:bg-brand-900/20 p-2 rounded-xl relative">
        <ShoppingBag className="w-5 h-5 text-brand-600" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 px-0.5">
            {totalItems}
          </span>
        )}
      </div>
      <div>
        <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 leading-none">
          {step === 'cart' ? 'سلة المشتريات' : 'بيانات التوصيل'}
        </h2>
        <p className="text-[10px] text-gray-400 font-bold mt-1">
          {step === 'cart' ? 'مراجعة المنتجات والكميات' : 'الرجاء تعبئة بيانات الاستلام'}
        </p>
      </div>
    </div>
    <div className="flex gap-2">
      {step === 'checkout' && onBack && (
        <button 
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <button 
        onClick={handleClose}
        className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);
