import React from 'react';
import { Truck } from 'lucide-react';

interface DeliveryProgressBarProps {
  isFreeDelivery: boolean;
  deliveryProgress: number;
  deliveryRemaining: number;
}

export const DeliveryProgressBar: React.FC<DeliveryProgressBarProps> = ({
  isFreeDelivery,
  deliveryProgress,
  deliveryRemaining
}) => (
  <div className={`p-3.5 rounded-2xl border transition-colors duration-500 ${
    isFreeDelivery 
      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40' 
      : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
  }`}>
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-1.5">
        <Truck className={`w-4 h-4 transition-colors ${isFreeDelivery ? 'text-green-500' : 'text-gray-400'}`} />
        <span className={`text-[11px] font-bold transition-colors ${
          isFreeDelivery ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'
        }`}>
          {isFreeDelivery 
            ? 'مبروك! التوصيل مجاني 🎉' 
            : <>باقي {deliveryRemaining.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span> للتوصيل المجاني</>
          }
        </span>
      </div>
      {!isFreeDelivery && (
        <span className="text-[10px] font-mono font-bold text-gray-400">
          {Math.round(deliveryProgress)}%
        </span>
      )}
    </div>
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-700 ease-out ${
          isFreeDelivery 
            ? 'bg-green-500' 
            : 'bg-gradient-to-l from-brand-600 to-brand-400'
        }`}
        style={{ width: `${deliveryProgress}%` }}
      />
    </div>
  </div>
);
