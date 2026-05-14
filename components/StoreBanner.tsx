import React from 'react';
import { ShoppingBag, ChevronLeft, Phone } from 'lucide-react';
import { STORE_CONFIG } from '../constants';

export const StoreBanner: React.FC = () => {
  return (
    <div className="relative w-full mt-6 mb-2">
      {/* Sponsor Badge */}
      <div className="absolute -top-2.5 right-4 z-20">
        <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm border-2 border-white">
          الراعي الرسمي
        </span>
      </div>

      <a 
          href={STORE_CONFIG.URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full bg-white border border-green-200 rounded-2xl p-4 pt-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] group relative"
      >
          {/* Icon Container */}
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0 border border-green-100 group-hover:bg-green-100 transition-colors">
              <ShoppingBag className="w-5 h-5 text-green-600" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 text-right">
              <h3 className="font-bold text-gray-900 text-sm mb-0.5">
                  {STORE_CONFIG.NAME}
              </h3>
              
              {/* Phone Number - Right aligned */}
              <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs mb-1">
                  <Phone className="w-3 h-3 fill-green-700/10" />
                  <span dir="ltr">{STORE_CONFIG.PHONE}</span>
              </div>

              <p className="text-[10px] text-gray-400 truncate">
                  منتجات آمنة وخالية من الجلوتين 100%
              </p>
          </div>

          {/* Action Indicator */}
          <div className="text-gray-300 group-hover:text-green-600 transition-colors pl-1">
              <ChevronLeft className="w-5 h-5" />
          </div>
      </a>
    </div>
  );
};