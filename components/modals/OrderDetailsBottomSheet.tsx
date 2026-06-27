import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Repeat, MessageCircle, FileText, Share2, MapPin, Calendar, CheckCircle2, Clipboard } from 'lucide-react';
import { LiveOrderItem } from '../../services/liveOrderService';
import { useScrollLock, useBackButton } from '../../hooks';

interface OrderDetailsBottomSheetProps {
  order: any;
  items: LiveOrderItem[];
  isLoadingItems: boolean;
  onClose: () => void;
  onRepeatOrder: (order: any) => void;
  isRepeating: boolean;
  onViewReceipt: (order: any) => void;
  onShareWhatsApp: (order: any, items: LiveOrderItem[]) => void;
  formatPrice: (n: number) => string;
  formatDate: (iso: string) => string;
  statusInfo: { label: string; color: string; bg: string; icon: React.ReactNode };
}

export const OrderDetailsBottomSheet: React.FC<OrderDetailsBottomSheetProps> = ({
  order,
  items,
  isLoadingItems,
  onClose,
  onRepeatOrder,
  isRepeating,
  onViewReceipt,
  onShareWhatsApp,
  formatPrice,
  formatDate,
  statusInfo
}) => {
  const isShipping = order.order_type === 'shipping';

  // Lock body scrolling when bottom sheet is open
  useScrollLock(true);

  // Close sheet on native Android back button press
  useBackButton(true, onClose);

  return createPortal(
    <div 
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up-mobile border-t border-gray-150 dark:border-gray-800/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Indicator Visual */}
        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto my-3.5 shrink-0" />

        {/* Header Section */}
        <div className="px-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-1.5">
              <span>تفاصيل الطلب #{order.order_number?.split('-').pop() || '—'}</span>
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(order.created_at)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-250 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Status & Delivery Summary Card */}
          <div className="bg-gray-50 dark:bg-gray-805 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/55 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-550 dark:text-gray-400">حالة الطلب الحالية</span>
              <span 
                style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                className="px-3 py-1 rounded-full font-bold text-xs inline-flex items-center justify-center min-w-[75px] text-center"
              >
                {statusInfo.label}
              </span>
            </div>
            {order.customer_address && (
              <div className="flex items-start gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500">عنوان التوصيل</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-bold leading-normal block">
                    {order.customer_address}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Items Header */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">المنتجات المطلوبة</h4>
            {isLoadingItems ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-450 font-bold">جاري تحميل الأصناف...</span>
              </div>
            ) : items.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-850 shadow-inner-sm">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-xs font-black flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <span className="text-xs text-gray-800 dark:text-gray-200 font-black truncate">
                        {item.product_name}
                      </span>
                    </div>
                    <div className="text-left shrink-0 pl-1">
                      <p className="text-xs font-mono font-black text-gray-900 dark:text-white">
                        {formatPrice(item.total_price || (item.unit_price * item.quantity))}
                        <span className="saudi-riyal mr-0.5">{"\u00ea"}</span>
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold font-mono">
                          ({formatPrice(item.unit_price)} للقطعة)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-400 font-bold">
                تعذر تحميل تفاصيل المنتجات
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div className="bg-amber-50/45 dark:bg-amber-950/10 p-3.5 rounded-2xl border border-amber-100/30 dark:border-amber-900/20 text-xs text-amber-900/90 dark:text-amber-305/90">
              <span className="font-extrabold text-amber-950 dark:text-amber-300 block mb-1">ملاحظات العميل:</span>
              <p className="leading-relaxed font-bold">{order.notes}</p>
            </div>
          )}

          {/* Pricing Receipt Breakdown Card */}
          <div className="bg-gray-50 dark:bg-gray-805 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 space-y-2.5 shadow-sm">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold">
              <span>المجموع الفرعي</span>
              <span className="font-mono">{formatPrice(order.subtotal || (order.total - (order.delivery_fee || 0)))}<span className="saudi-riyal mr-0.5">{"\u00ea"}</span></span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs font-bold text-green-600 dark:text-green-450 bg-green-50/50 dark:bg-green-950/15 p-2 rounded-xl border border-green-100/30">
                <span>🎁 الخصم والتوفير</span>
                <span className="font-mono">-{formatPrice(order.discount)}<span className="saudi-riyal mr-0.5">{"\u00ea"}</span></span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold">
              <span>{isShipping ? 'رسوم الشحن' : 'رسوم التوصيل'}</span>
              <span className="font-mono">
                {order.delivery_fee > 0 ? (
                  <>{formatPrice(order.delivery_fee)}<span className="saudi-riyal mr-0.5">{"\u00ea"}</span></>
                ) : isShipping ? (
                  <span className="text-amber-600 dark:text-amber-450 font-black">يحدد لاحقاً 🚚</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-450 font-black">مجاناً 🎉</span>
                )}
              </span>
            </div>
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700/80 pt-2.5 mt-2 flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
              <span>الإجمالي النهائي</span>
              <span className="text-brand-600 dark:text-brand-400 font-mono text-base font-black">
                {formatPrice(order.total)}
                <span className="saudi-riyal mr-0.5">{"\u00ea"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Actions Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 space-y-2.5 safe-area-bottom">
          {order.status === 'delivered' && (
            <button
              onClick={() => onRepeatOrder(order)}
              disabled={isRepeating}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white rounded-xl text-xs font-black hover:bg-brand-700 transition-all disabled:opacity-70 shadow-md active:scale-[0.98]"
            >
              {isRepeating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري التكرار...</>
              ) : (
                <><Repeat className="w-4 h-4" />إعادة طلب هذه الأصناف</>
              )}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onViewReceipt(order)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" />
              عرض الفاتورة
            </button>

            <button
              onClick={() => onShareWhatsApp(order, items)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-colors shadow-md active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              مشاركة بالواتساب
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
