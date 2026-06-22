import React from 'react';

interface TotalsBreakdownCardProps {
  currentSubtotal: number;
  totalSavings: number;
  currentFee: number;
  rawFee?: number;
  isFreeDelivery: boolean;
  distanceKm?: number;
  deliveryZone?: 'sanaa' | 'provinces';
  qualifiesForFree?: boolean;
  grandTotal?: number;
}

export const TotalsBreakdownCard: React.FC<TotalsBreakdownCardProps> = ({
  currentSubtotal,
  totalSavings,
  currentFee,
  rawFee = 0,
  isFreeDelivery,
  distanceKm = 0,
  deliveryZone = 'sanaa',
  qualifiesForFree = false,
  grandTotal = 0
}) => {
  const isShipping = deliveryZone === 'provinces' || distanceKm > 20;
  
  // Calculate delivery savings:
  const effectiveRawFee = rawFee > 0 ? rawFee : 1000;
  const deliverySavings = qualifiesForFree 
    ? (deliveryZone === 'sanaa' ? effectiveRawFee : 0) 
    : (rawFee - currentFee);
  
  const hasDeliverySavings = (qualifiesForFree && deliveryZone === 'sanaa') || (!qualifiesForFree && rawFee > currentFee && currentFee > 0);

  return (
    <section className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2.5 mb-2 shadow-sm">
      {/* 1. Subtotal */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold">
        <span>المجموع الفرعي</span>
        <span className="tabular-nums font-mono">
          {currentSubtotal.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
        </span>
      </div>

      {/* 2. Package Savings */}
      {totalSavings > 0 && (
        <div className="flex justify-between text-xs font-bold text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/10 p-2 rounded-xl border border-green-100/40 dark:border-green-900/20">
          <span>🎁 التوفير من العروض والباكجات</span>
          <span className="font-mono tabular-nums">
            -{totalSavings.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
          </span>
        </div>
      )}

      {/* 3. Delivery Fee */}
      <div className="flex justify-between text-xs font-bold">
        <span className="text-gray-500 dark:text-gray-400">رسوم التوصيل</span>
        <span className="text-gray-800 dark:text-gray-200">
          {qualifiesForFree ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <span>مجاناً 🎉</span>
            </span>
          ) : deliveryZone === 'provinces' ? (
            'شحن محافظات (تُحدد لاحقاً)'
          ) : distanceKm === 0 ? (
            'تُحدد بعد تحديد الموقع'
          ) : isShipping ? (
            'شحن محافظات (تُحدد لاحقاً)'
          ) : isFreeDelivery ? (
            <span className="text-brand-600">مجاناً</span>
          ) : rawFee > currentFee ? (
            <span className="flex items-center gap-1.5">
              <span className="line-through text-gray-400 dark:text-gray-500 text-[11px] tabular-nums">
                {rawFee.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
              </span>
              <span className="tabular-nums font-mono">
                {currentFee.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
              </span>
            </span>
          ) : (
            <span className="tabular-nums font-mono">
              {currentFee.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
            </span>
          )}
        </span>
      </div>

      {/* 4. Delivery Savings Promo / Capping (Merged into the same layout cleanly) */}
      {hasDeliverySavings && (
        <div className="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 p-2 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20">
          <span className="flex items-center gap-1">
            <span>🎁</span>
            {qualifiesForFree 
              ? (deliveryZone === 'sanaa' ? 'تجاوزت 20,000! توصيل مجاني' : 'تجاوزت 40,000! شحن مجاني')
              : 'جوده تتحمل فرق التوصيل عنك!'}
          </span>
          <span className="font-mono tabular-nums">
            -{deliverySavings.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
          </span>
        </div>
      )}

      {/* 5. Divider Line */}
      <div className="border-t border-dashed border-gray-150 dark:border-gray-700/60 my-2 pt-1" />

      {/* 6. Grand Total */}
      <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
        <span>الإجمالي النهائي</span>
        <span className="text-base text-brand-600 dark:text-brand-400 tabular-nums font-black">
          {grandTotal.toLocaleString('en-US')}<span className="saudi-riyal mr-1">{"\u00ea"}</span>
        </span>
      </div>
    </section>
  );
};
