import React from 'react';
import { X, AlertTriangle, Globe, CheckCircle } from 'lucide-react';

interface MedicalCardProps {
  onClose: () => void;
}

export const MedicalCard: React.FC<MedicalCardProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative animate-scale-in border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="bg-brand-600 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">بطاقة تحذير طبية</h2>
          <p className="text-brand-100 text-xs font-medium tracking-widest uppercase">Medical Alert Card</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Arabic Section */}
          <div className="text-center dir-rtl">
            <h3 className="text-brand-600 font-bold mb-2 flex items-center justify-center gap-2">
              <span className="text-lg">⚠️ تنبيه للمطعم</span>
            </h3>
            <p className="text-gray-800 dark:text-gray-100 text-base font-bold leading-relaxed border-r-4 border-brand-600 pr-3 bg-gray-50 dark:bg-gray-800 py-3 rounded-l-xl">
              أنا مصاب بمرض السيلياك (حساسية القمح). تناول أي كمية من القمح، الشعير، أو الجاودار يسبب لي ضررًا صحيًا بالغًا.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 leading-relaxed">
              يرجى التأكد من عدم استخدام نفس الزيت أو الأدوات المستخدمة مع الخبز والمخبوزات.
            </p>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

          {/* English Section */}
          <div className="text-center dir-ltr">
            <h3 className="text-brand-600 font-bold mb-2 flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="uppercase text-xs tracking-wider">Chef Alert</span>
            </h3>
            <p className="text-gray-800 dark:text-gray-100 text-base font-bold leading-relaxed border-l-4 border-brand-600 pl-3 bg-gray-50 dark:bg-gray-800 py-3 rounded-r-xl text-left">
              I have Celiac Disease. I strictly cannot eat Wheat, Barley, Rye, or Oats.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 leading-relaxed text-left">
              Please ensure no cross-contamination with bread, crumbs, or shared fryers.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 text-center border-t border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
             <CheckCircle className="w-3 h-3" />
             تم التحقق بواسطة تطبيق جودة
           </p>
        </div>
      </div>
    </div>
  );
};
