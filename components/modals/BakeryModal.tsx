
import React from 'react';
import { X, MessageCircle, Star, ChefHat, CheckCircle } from 'lucide-react';
import { STORE_CONFIG } from '../../constants';

interface BakeryModalProps {
  onClose: () => void;
}

export const BakeryModal: React.FC<BakeryModalProps> = ({ onClose }) => {
  const items = [
    { name: 'توست طازج', desc: 'طري ومثالي للسندويشات', icon: '🍞' },
    { name: 'سينابون', desc: 'هش ولذيذ بالقرفة', icon: '🥯' },
    { name: 'كيك مناسبات', desc: 'حسب الطلب لكل أفراحكم', icon: '🎂' },
    { name: 'معجنات مشكلة', desc: 'بيتزا، سبانخ، وجبن', icon: '🥐' },
  ];

  const handleOrder = () => {
    const message = encodeURIComponent(
      `مرحباً، جئتكم من تطبيق جودة 📱\nحبيت استفسر عن قائمة الحلويات والمخبوزات المتوفرة لديكم.`
    );
    // Assuming the bakery has a specific number, otherwise falling back to store number or a placeholder logic
    // For now, using Store Phone as placeholder or needs to be provided. 
    // Let's use a generic logic or the store phone if they handle it. 
    // Ideally, replace this with "Helo Sar Ahla" specific number.
    const phone = STORE_CONFIG.PHONE.replace(/\D/g, ''); 
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-scale-in border border-gray-200 dark:border-gray-800">
        
        {/* Header Image/Pattern */}
        <div className="h-32 bg-pink-100 dark:bg-pink-900/30 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cupcakes.png')]"></div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg z-10">
             <ChefHat className="w-8 h-8 text-pink-500" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 p-1.5 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-1">حلو صار أحلى 🧁</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">شريك الجودة والطعم الأصيل</p>
            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-[10px] font-bold border border-green-100 dark:border-green-800">
              <CheckCircle className="w-3 h-3" />
              نستخدم دقيق جودة 100%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5">{item.name}</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleOrder}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-100 dark:shadow-none transition-transform active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>تواصل للطلب واتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
