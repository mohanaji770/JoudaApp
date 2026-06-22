import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

interface EmptyCartViewProps {
  handleClose: () => void;
}

export const EmptyCartView: React.FC<EmptyCartViewProps> = ({ handleClose }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">سلتك فاضية حالياً</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px] leading-relaxed">
        تصفح المتجر وضيف المنتجات اللي تحبها
      </p>
      <button 
        onClick={() => {
          handleClose();
          navigate('/products');
        }}
        className="mt-6 text-brand-600 font-bold text-sm hover:underline"
      >
        ارجع للمتجر
      </button>
    </div>
  );
};
