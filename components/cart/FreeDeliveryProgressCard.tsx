import React from 'react';
import { Truck, Package, CheckCircle2 } from 'lucide-react';

interface FreeDeliveryProgressCardProps {
  subtotal: number;
  zone: 'sanaa' | 'provinces';
  sanaaLimit?: number;
  provincesLimit?: number;
  isMinimal?: boolean;
}

export const FreeDeliveryProgressCard: React.FC<FreeDeliveryProgressCardProps> = ({
  subtotal,
  zone,
  sanaaLimit = 20000,
  provincesLimit = 40000,
  isMinimal = false,
}) => {
  const limit = zone === 'sanaa' ? sanaaLimit : provincesLimit;
  const remaining = limit - subtotal;
  const progress = Math.min((subtotal / limit) * 100, 100);
  const isTargetMet = subtotal >= limit;

  // Determine Icon
  const Icon = isTargetMet ? CheckCircle2 : zone === 'sanaa' ? Truck : Package;

  // Determine Message text
  let message = '';
  if (isTargetMet) {
    message = zone === 'sanaa' 
      ? 'تم تفعيل التوصيل المجاني داخل صنعاء 💚' 
      : 'تم تفعيل الشحن المجاني للمحافظات 💚';
  } else if (remaining < 5000) {
    message = zone === 'sanaa'
      ? `قريب جداً! أضف ${remaining.toLocaleString('en-US')} ريال فقط للتوصيل المجاني`
      : `قريب جداً! أضف ${remaining.toLocaleString('en-US')} ريال فقط للشحن المجاني للمحافظات`;
  } else {
    message = zone === 'sanaa'
      ? `باقي ${remaining.toLocaleString('en-US')} ريال للتوصيل المجاني`
      : `باقي ${remaining.toLocaleString('en-US')} ريال للشحن المجاني للمحافظات`;
  }

  return (
    <div 
      className={`rounded-2xl p-4 border transition-all duration-500 flex flex-col gap-2.5 shadow-sm ${
        isTargetMet 
          ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30' 
          : 'bg-white dark:bg-gray-800/60 border-gray-100/80 dark:border-gray-700/80'
      }`}
    >
      <div className="flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors duration-300 ${
            isTargetMet 
              ? 'text-emerald-600 dark:text-emerald-450' 
              : zone === 'sanaa' ? 'text-brand-600 dark:text-brand-400' : 'text-orange-500 dark:text-orange-400'
          }`} />
          <span className={`text-[12px] font-black leading-tight truncate ${
            isTargetMet 
              ? 'text-emerald-800 dark:text-emerald-350' 
              : 'text-gray-800 dark:text-gray-100'
          }`}>
            {message}
          </span>
        </div>
        {!isTargetMet && (
          <span className="text-[10px] font-bold font-mono text-gray-400 dark:text-gray-550 shrink-0">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar & Limits */}
      {!isMinimal && (
        <div className="space-y-1.5 animate-fade-in">
          {/* Progress track */}
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700/70 rounded-full overflow-hidden relative">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isTargetMet 
                  ? 'bg-emerald-500' 
                  : zone === 'sanaa' ? 'bg-brand-600' : 'bg-orange-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Bottom Labels */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-550 font-bold">
            <span>البداية</span>
            <span>الحد: {limit.toLocaleString('en-US')} ريال</span>
          </div>
        </div>
      )}
    </div>
  );
};
