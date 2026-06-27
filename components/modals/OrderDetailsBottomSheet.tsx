import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Repeat, MessageCircle, FileText, Share2, MapPin, Calendar, CheckCircle2, Clipboard, Check } from 'lucide-react';
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

  const getTimelineSteps = () => {
    const isShippingOrder = order.order_type === 'shipping';
    
    // Define the sequence of status keys
    const statusSequence = isShippingOrder
      ? ['submitted', 'confirmed', 'preparing', 'delivered', 'paid', 'deposited']
      : ['submitted', 'confirmed', 'reserved', 'preparing', 'delivered', 'paid', 'deposited'];

    // Map each status key to its index
    const currentStatusIdx = statusSequence.indexOf(order.status);

    // If order is cancelled or failed, we handle it separately
    const isCancelled = order.status === 'cancelled';
    const isFailed = order.status === 'failed';

    const formatDateOnlyTime = (isoString: string) => {
      try {
        const d = new Date(isoString);
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      } catch {
        return '--:--';
      }
    };

    const steps = statusSequence.map((statusKey, idx) => {
      let isCompleted = false;
      let isCurrent = false;

      if (!isCancelled && !isFailed) {
        isCompleted = idx < currentStatusIdx;
        isCurrent = idx === currentStatusIdx;
      } else {
        isCompleted = false;
        isCurrent = false;
      }

      // Titles & Explanations mapping
      let title = '';
      let explanation = '';

      if (statusKey === 'submitted') {
        title = 'تم إرسال الطلب';
        explanation = 'طلبك وصل لفريق جودة وجاري مراجعته';
      } else if (statusKey === 'confirmed') {
        title = 'تم تأكيد الطلب';
        explanation = 'تم اعتماد الطلب وتجهيز الفاتورة';
      } else if (statusKey === 'reserved') {
        title = 'استلمه المندوب';
        explanation = 'المندوب استلم مسؤولية التوصيل وسيبدأ التنسيق قريباً';
      } else if (statusKey === 'preparing') {
        title = isShippingOrder ? 'تجهيز الشحنة' : 'قيد التجهيز';
        explanation = isShippingOrder ? 'جاري تغليف شحنتك وتجهيزها للنقل البري' : 'جاري تجهيز وتغليف منتجاتك الطازجة';
      } else if (statusKey === 'delivered') {
        title = isShippingOrder ? 'سُلّمت لشركة الشحن' : 'تم التسليم';
        explanation = isShippingOrder ? 'سُلّمت الشحنة لشركة النقل البري ومتاحة للاستلام' : 'تم تسليم طلبك بنجاح، صحة وعافية! 💚';
      } else if (statusKey === 'paid') {
        title = 'تم استلام المبلغ';
        explanation = 'تم استلام وسداد قيمة الطلب بنجاح';
      } else if (statusKey === 'deposited') {
        title = 'تم الإيداع';
        explanation = 'تم إيداع المبلغ في حساب المتجر بنجاح';
      }

      // Time resolution
      let time = '--:--';
      if (statusKey === 'submitted') {
        time = formatDateOnlyTime(order.created_at);
      } else if (isCurrent && order.workflow_updated_at) {
        time = formatDateOnlyTime(order.workflow_updated_at);
      } else if (isCompleted) {
        time = 'مكتمل';
      }

      return {
        statusKey,
        title,
        explanation,
        isCompleted,
        isCurrent,
        time,
        isUpcoming: !isCompleted && !isCurrent
      };
    });

    // If cancelled or failed, append a final red node
    if (isCancelled) {
      steps.push({
        statusKey: 'cancelled',
        title: 'تم إلغاء الطلب 🚫',
        explanation: 'تم إلغاء هذا الطلب من قبل الإدارة أو بناءً على طلبك',
        isCompleted: false,
        isCurrent: true,
        time: order.workflow_updated_at ? formatDateOnlyTime(order.workflow_updated_at) : '--:--',
        isUpcoming: false
      });
    } else if (isFailed) {
      steps.push({
        statusKey: 'failed',
        title: 'فشل الطلب ⚠️',
        explanation: 'تعذر تسليم أو إتمام هذا الطلب',
        isCompleted: false,
        isCurrent: true,
        time: order.workflow_updated_at ? formatDateOnlyTime(order.workflow_updated_at) : '--:--',
        isUpcoming: false
      });
    }

    return steps;
  };

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
          
          {/* Status & Delivery Summary Card with Timeline */}
          <div className="bg-gray-50/50 dark:bg-gray-805/40 p-4 rounded-3xl border border-gray-100 dark:border-gray-800/55 space-y-4">
            
            {/* Header: Title and Active Status Pill */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-850">
              <span className="text-xs font-bold text-gray-550 dark:text-gray-400">تتبع مسار الطلب</span>
              <span 
                style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                className="px-3 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1.5 justify-center text-center"
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>

            {/* Vertical Timeline */}
            <div className="relative flex flex-col gap-5 pr-2.5 mr-1.5 overflow-visible">
              {/* Vertical connecting line */}
              <div className="absolute right-[9px] top-2.5 bottom-2.5 w-0.5 bg-gray-200 dark:bg-gray-800" />
              
              {getTimelineSteps().map((step, idx) => {
                let bulletClass = '';
                let bulletIcon = null;
                let titleClass = '';

                if (step.isCompleted) {
                  // Green checkmark
                  bulletClass = 'bg-emerald-500 border-emerald-500 text-white z-10 shadow-sm';
                  bulletIcon = <Check className="w-3 h-3 stroke-[3]" />;
                  titleClass = 'text-gray-800 dark:text-gray-200 font-bold';
                } else if (step.isCurrent) {
                  // Pulsing active state (Brand red/orange or amber)
                  const isRedStatus = ['cancelled', 'failed'].includes(step.statusKey);
                  bulletClass = isRedStatus 
                    ? 'bg-red-500 border-red-500 text-white z-10 shadow-sm'
                    : 'bg-amber-500 border-amber-500 text-white z-10 animate-pulse shadow-sm shadow-amber-500/20';
                  bulletIcon = isRedStatus 
                    ? <X className="w-3 h-3 stroke-[3]" />
                    : <div className="w-1.5 h-1.5 bg-white rounded-full" />;
                  titleClass = isRedStatus
                    ? 'text-red-650 dark:text-red-400 font-extrabold'
                    : 'text-amber-600 dark:text-amber-400 font-black';
                } else {
                  // Upcoming gray state
                  bulletClass = 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 z-10';
                  bulletIcon = <div className="w-1.5 h-1.5 bg-gray-200 dark:bg-gray-750 rounded-full" />;
                  titleClass = 'text-gray-400 dark:text-gray-650 font-bold';
                }

                return (
                  <div key={idx} className="relative flex items-start gap-2 select-none">
                    {/* Bullet Circle Node */}
                    <div className={`absolute right-0 top-0.5 w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 transition-all duration-300 ${bulletClass}`}>
                      {bulletIcon}
                    </div>

                    {/* Text block (indented to avoid overlapping bullet) */}
                    <div className="pr-7 flex-1 flex items-start justify-between gap-4">
                      {/* Left: Title & Description */}
                      <div className="flex-1 text-right">
                        <h5 className={`text-xs ${titleClass}`}>
                          {step.title}
                        </h5>
                        {(step.isCompleted || step.isCurrent) && (
                          <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold mt-0.5 leading-relaxed">
                            {step.explanation}
                          </p>
                        )}
                      </div>

                      {/* Right: Time / Status text */}
                      <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                        {step.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Address Info Section */}
            {order.customer_address && (
              <div className="flex items-start gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold text-gray-450 dark:text-gray-500">عنوان التوصيل</span>
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
