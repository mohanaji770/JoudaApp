
import React, { useState } from 'react';
import { Cake, ChevronLeft, Star } from 'lucide-react';
import { BakeryModal } from './BakeryModal';

export const BakeryBanner: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="relative w-full mt-6 mb-4 animate-fade-in">
        {/* Badge */}
        <div className="absolute -top-2.5 left-4 z-20">
          <span className="bg-pink-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            شريك معتمد
          </span>
        </div>

        <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-4 w-full bg-gradient-to-r from-pink-50 to-white dark:from-gray-800 dark:to-gray-900 border border-pink-100 dark:border-pink-900/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] group text-right"
        >
            {/* Icon Container */}
            <div className="w-14 h-14 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 border-2 border-pink-100 dark:border-pink-900/50 shadow-sm">
                <Cake className="w-7 h-7 text-pink-500" />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm mb-1">
                    مخبز "حلو صار أحلى" 🧁
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 ml-2">
                   مخبوزات وحلويات طازجة يومياً، خالية من الجلوتين ومصنوعة بدقيق جودة.
                </p>
            </div>

            {/* Action Indicator */}
            <div className="bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-sm text-pink-400 group-hover:text-pink-600 transition-colors">
                <ChevronLeft className="w-4 h-4" />
            </div>
        </button>
      </div>

      {/* Modal */}
      {showModal && <BakeryModal onClose={() => setShowModal(false)} />}
    </>
  );
};
