import React from 'react';

interface TotalsBreakdownCardProps {
  currentSubtotal: number;
  totalSavings: number;
  currentFee: number;
  isFreeDelivery: boolean;
}

export const TotalsBreakdownCard: React.FC<TotalsBreakdownCardProps> = ({
  currentSubtotal,
  totalSavings,
  currentFee,
  isFreeDelivery
}) => (
  <section className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2.5 mb-2">
    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-bold">
      <span>المجموع الفرعي</span>
      <span className="tabular-nums">{currentSubtotal.toLocaleString('en-US')} ريال</span>
    </div>
    {totalSavings > 0 && (
      <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-2.5 rounded-xl border border-green-100 dark:border-green-900/30">
        <span>التوفير من العروض والباكجات</span>
        <span className="font-mono tabular-nums">-{totalSavings.toLocaleString('en-US')} ريال 🎉</span>
      </div>
    )}
    <div className="flex justify-between text-sm font-bold">
      <span className="text-gray-600 dark:text-gray-400">رسوم التوصيل</span>
      {isFreeDelivery ? (
        <span className="text-green-600">مجاناً! 🎉</span>
      ) : (
        <span className="text-gray-800 dark:text-gray-200 tabular-nums">{currentFee.toLocaleString('en-US')} ريال</span>
      )}
    </div>
  </section>
);
