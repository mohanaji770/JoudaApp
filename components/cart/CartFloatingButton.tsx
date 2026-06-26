
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export const CartFloatingButton: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-[80px] left-0 right-0 z-40 px-4 animate-slide-up pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-brand-600 text-white p-4 rounded-2xl shadow-xl shadow-brand-900/20 flex items-center justify-between border border-white/10 backdrop-blur-md active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
               {totalItems}
             </div>
             <div className="flex flex-col items-start">
                <span className="font-bold text-sm">معاينة السلة</span>
                <span className="text-[10px] text-brand-100">إتمام الطلب</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-3 py-2 rounded-xl group-hover:bg-white/20 transition-colors">
             <span>الدفع</span>
             <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </button>
      </div>
    </div>
  );
};
