import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ShoppingBag, Trash2, MessageCircle, Plus, Minus, MapPin, User, FileText, Truck, FileOutput, Wallet, Info, ChevronDown } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { ReceiptModal } from './ReceiptModal';
import { SuccessOrderModal } from './SuccessOrderModal';
import { useScrollLock } from '../hooks';
import { getCachedProducts } from '../services/db';

/* ═══════════════════════════════════════════════
   Delivery Constants & Configurations
   ═══════════════════════════════════════════════ */
interface DeliveryZoneConfig {
  freeTarget: number;
  fee: number;
}

const DELIVERY_CONFIG: Record<string, DeliveryZoneConfig> = {
  sanaa_near: { freeTarget: 20000, fee: 500 },
  sanaa_far: { freeTarget: 20000, fee: 1000 },
  provinces: { freeTarget: 40000, fee: 2000 },
};

/* ═══════════════════════════════════════════════
   SwipeableItem — RTL swipe-to-delete wrapper
   Swipe RIGHT on screen → reveals delete zone on left
   ═══════════════════════════════════════════════ */
const SwipeableItem: React.FC<{
  children: React.ReactNode;
  onDelete: () => void;
}> = ({ children, onDelete }) => {
  const startRef = useRef({ x: 0, y: 0 });
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const directionRef = useRef<'h' | 'v' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    directionRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const dx = e.touches[0].clientX - startRef.current.x;
    const dy = e.touches[0].clientY - startRef.current.y;

    // Lock direction on first significant movement
    if (!directionRef.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (directionRef.current !== 'h') return;

    // Allow positive (right swipe on screen) to reveal delete on left side
    if (dx > 0) {
      setTranslateX(Math.min(dx * 0.7, 100));
    } else {
      setTranslateX(Math.max(dx * 0.2, -20));
    }
  };

  const handleTouchEnd = () => {
    if (translateX > 70) {
      // Threshold reached — slide out fully then delete
      setTranslateX(300);
      setTimeout(onDelete, 250);
    } else {
      setTranslateX(0);
    }
    setIsSwiping(false);
    directionRef.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete zone behind — screen-left side */}
      <div
        className="absolute inset-y-0 left-0 w-24 bg-red-500 dark:bg-red-600 flex items-center justify-center gap-1.5 rounded-2xl"
        style={{ opacity: Math.min(translateX / 40, 1) }}
      >
        <Trash2 className="w-5 h-5 text-white" />
        <span className="text-white text-[10px] font-bold">حذف</span>
      </div>
      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   CartHeader Component
   ═══════════════════════════════════════════════ */
interface CartHeaderProps {
  totalItems: number;
  handleClose: () => void;
}
const CartHeader: React.FC<CartHeaderProps> = ({ totalItems, handleClose }) => (
  <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-warm-white dark:bg-gray-900 sticky top-0 z-10 shrink-0 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="bg-brand-50 dark:bg-brand-900/20 p-2 rounded-xl relative">
        <ShoppingBag className="w-5 h-5 text-brand-600" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 px-0.5">
            {totalItems}
          </span>
        )}
      </div>
      <div>
        <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 leading-none">
          إتمام الطلب
        </h2>
        <p className="text-[10px] text-gray-400 font-bold mt-1">
          مراجعة المنتجات وبيانات التوصيل
        </p>
      </div>
    </div>
    <button 
      onClick={handleClose}
      className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

/* ═══════════════════════════════════════════════
   EmptyCartView Component
   ═══════════════════════════════════════════════ */
interface EmptyCartViewProps {
  handleClose: () => void;
}
const EmptyCartView: React.FC<EmptyCartViewProps> = ({ handleClose }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-center">
    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
    </div>
    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">سلتك فارغة</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px] leading-relaxed">
      تصفح المتجر وأضف منتجاتك المفضلة
    </p>
    <button 
      onClick={handleClose}
      className="mt-6 text-brand-600 font-bold text-sm hover:underline"
    >
      العودة للتسوق
    </button>
  </div>
);

/* ═══════════════════════════════════════════════
   CartItemRow Component
   ═══════════════════════════════════════════════ */
interface CartItemRowProps {
  item: any;
  cachedProducts: any[];
  bouncingItemId: string | null;
  handleIncrease: (name: string, id: string) => void;
  handleDecrease: (id: string) => void;
  handleRemove: (id: string) => void;
}
const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  cachedProducts,
  bouncingItemId,
  handleIncrease,
  handleDecrease,
  handleRemove
}) => {
  const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
  const isPackage = item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
  const bundleItems = matchedProduct?.bundle_items || [];
  
  // Calculate savings for packages
  let savings = 0;
  if (isPackage && bundleItems.length > 0) {
    const regularTotal = bundleItems.reduce((sum: number, bItem: any) => {
      const compProd = cachedProducts.find(p => p.barcode === bItem.barcode);
      const compPrice = compProd ? compProd.price : 0;
      return sum + (compPrice * bItem.quantity);
    }, 0);
    const pkgPrice = parseFloat(item.price || '0') || 0;
    if (regularTotal > pkgPrice) {
      savings = (regularTotal - pkgPrice) * item.quantity;
    }
  }

  const isBouncing = bouncingItemId === item.id;

  return (
    <SwipeableItem onDelete={() => handleRemove(item.id)}>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate leading-snug">{item.name}</h3>
              {isPackage && (
                <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                  🎁 عرض خاص
                </span>
              )}
            </div>
            
            {/* Bundle items list */}
            {isPackage && bundleItems.length > 0 && (
              <div className="pr-2.5 py-1.5 mt-1.5 mb-2 border-r-2 border-amber-200 dark:border-amber-900 space-y-1.5 bg-amber-50/10 dark:bg-amber-950/5 rounded-l-lg">
                {bundleItems.map((bItem: any, idx: number) => {
                  const compProd = cachedProducts.find(p => p.barcode === bItem.barcode);
                  const compImg = compProd ? compProd.image_url || compProd.image : null;
                  return (
                    <div key={idx} className="text-[10px] text-gray-600 dark:text-gray-300 font-bold flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-white dark:bg-gray-700 border border-gray-150 dark:border-gray-650 overflow-hidden flex items-center justify-center shrink-0">
                        {compImg ? (
                          <img src={compImg} alt={bItem.product_name} className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingBag className="w-3 h-3 text-gray-300 dark:text-gray-500" />
                        )}
                      </div>
                      <span className="truncate">{bItem.product_name}</span>
                      <span className="font-mono text-gray-400 dark:text-gray-500 font-bold mr-auto">×{bItem.quantity * item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Price & Savings */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-black text-gray-900 dark:text-white">
                {item.price ? `${parseFloat(item.price) * item.quantity} ريال` : 'السعر لاحقاً'}
              </span>
              {savings > 0 && (
                <span className="text-[9px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-900/30">
                  وفرت {savings.toLocaleString('en-US')} ريال! 🎉
                </span>
              )}
            </div>
          </div>

          {/* ✋ Quantity Controls — BIGGER TOUCH TARGETS (44px) */}
          <div className="flex items-center gap-2 mr-2 self-start mt-0.5 shrink-0">
            <button 
              onClick={() => handleDecrease(item.id)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 active:bg-red-50 active:text-red-500 dark:active:bg-red-950/30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className={`text-sm font-bold min-w-[28px] text-center text-gray-800 dark:text-white ${isBouncing ? 'cart-qty-bounce' : ''}`}>
              {item.quantity}
            </span>
            <button 
              onClick={() => handleIncrease(item.name, item.id)}
              className="w-10 h-10 flex items-center justify-center bg-brand-600 text-white rounded-xl active:bg-brand-700 transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </SwipeableItem>
  );
};

/* ═══════════════════════════════════════════════
   CollapsibleItemsList Component
   ═══════════════════════════════════════════════ */
interface CollapsibleItemsListProps {
  items: any[];
  cachedProducts: any[];
  productsExpanded: boolean;
  setProductsExpanded: (v: boolean) => void;
  currentSubtotal: number;
  totalItems: number;
  bouncingItemId: string | null;
  handleIncrease: (name: string, id: string) => void;
  handleDecrease: (id: string) => void;
  handleRemove: (id: string) => void;
}
const CollapsibleItemsList: React.FC<CollapsibleItemsListProps> = ({
  items,
  cachedProducts,
  productsExpanded,
  setProductsExpanded,
  currentSubtotal,
  totalItems,
  bouncingItemId,
  handleIncrease,
  handleDecrease,
  handleRemove
}) => (
  <section>
    <button
      onClick={() => setProductsExpanded(!productsExpanded)}
      className="w-full flex items-center justify-between mb-2 py-1"
    >
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-brand-600" />
        المنتجات ({totalItems})
        {!productsExpanded && (
          <span className="text-[10px] text-gray-400 font-medium mr-1">
            — {currentSubtotal.toLocaleString('en-US')} ريال
          </span>
        )}
      </h3>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${productsExpanded ? 'rotate-180' : ''}`} />
    </button>

    <div
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        maxHeight: productsExpanded ? '2000px' : '0px',
        opacity: productsExpanded ? 1 : 0,
      }}
    >
      <div className="space-y-2 px-1.5 py-1.5 pb-2">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            cachedProducts={cachedProducts}
            bouncingItemId={bouncingItemId}
            handleIncrease={handleIncrease}
            handleDecrease={handleDecrease}
            handleRemove={handleRemove}
          />
        ))}
      </div>
      {/* Swipe hint */}
      <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center mt-2 mb-1 select-none">
        اسحب المنتج يميناً لحذفه 👆
      </p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════
   DeliveryProgressBar Component
   ═══════════════════════════════════════════════ */
interface DeliveryProgressBarProps {
  isFreeDelivery: boolean;
  deliveryProgress: number;
  deliveryRemaining: number;
}
const DeliveryProgressBar: React.FC<DeliveryProgressBarProps> = ({
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
            : `باقي ${deliveryRemaining.toLocaleString('en-US')} ريال للتوصيل المجاني`
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

/* ═══════════════════════════════════════════════
   CheckoutFormFields Component
   ═══════════════════════════════════════════════ */
interface CheckoutFormFieldsProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  deliveryZone: string;
  setDeliveryZone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  formExpanded: boolean;
  setFormExpanded: (v: boolean) => void;
  isFormValid: boolean;
  isSaved: (key: string, value: string) => boolean;
}
const CheckoutFormFields: React.FC<CheckoutFormFieldsProps> = ({
  customerName,
  setCustomerName,
  phone,
  setPhone,
  deliveryZone,
  setDeliveryZone,
  address,
  setAddress,
  notes,
  setNotes,
  formExpanded,
  setFormExpanded,
  isFormValid,
  isSaved
}) => (
  <section>
    <button
      onClick={() => setFormExpanded(!formExpanded)}
      className="w-full flex items-center justify-between mb-2 py-1"
    >
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-brand-600" />
        بيانات التوصيل
        {isFormValid && !formExpanded && (
          <span className="text-[10px] text-green-500 font-bold">✓ مكتمل</span>
        )}
      </h3>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${formExpanded ? 'rotate-180' : ''}`} />
    </button>

    <div
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        maxHeight: formExpanded ? '2000px' : '0px',
        opacity: formExpanded ? 1 : 0,
      }}
    >
      <div className="space-y-3 px-1.5 py-1.5">
        {/* الاسم */}
        <div>
          <label htmlFor="cart-name" className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1.5 mr-1">
            الاسم الكريم *
            {isSaved('jouda_customer_name', customerName) && (
              <span className="text-[9px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              id="cart-name"
              type="text" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pr-10 pl-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white font-medium"
              placeholder="الاسم الثلاثي"
            />
          </div>
        </div>

        {/* الهاتف */}
        <div>
          <label htmlFor="cart-phone" className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1.5 mr-1">
            رقم الهاتف *
            {isSaved('jouda_customer_phone', phone) && (
              <span className="text-[9px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              id="cart-phone"
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pr-10 pl-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white font-medium"
              placeholder="مثال: 967781117671"
            />
          </div>
        </div>

        {/* منطقة التوصيل */}
        <div>
          <label htmlFor="cart-zone" className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1.5 mr-1">
            منطقة التوصيل *
            {isSaved('jouda_delivery_zone', deliveryZone) && (
              <span className="text-[9px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <Truck className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <select 
              id="cart-zone"
              value={deliveryZone}
              onChange={(e) => setDeliveryZone(e.target.value)}
              className="w-full pr-10 pl-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white font-medium appearance-none"
            >
              <option value="sanaa_near">صنعاء - الجراف والستين وما جاورها</option>
              <option value="sanaa_far">صنعاء - مناطق أخرى</option>
              <option value="provinces">محافظات أخرى</option>
            </select>
          </div>
        </div>

        {/* العنوان */}
        <div>
          <label htmlFor="cart-address" className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1.5 mr-1">
            عنوان التوصيل *
            {isSaved('jouda_customer_address', address) && (
              <span className="text-[9px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
            <textarea 
              id="cart-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full pr-10 pl-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white resize-none font-medium"
              placeholder="المدينة - الحي - أقرب معلم"
            />
          </div>
        </div>

        {/* ملاحظات */}
        <div>
          <label htmlFor="cart-notes" className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1.5 mr-1">ملاحظات (اختياري)</label>
          <div className="relative">
            <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
            <textarea 
              id="cart-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full pr-10 pl-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white resize-none font-medium"
              placeholder="تعليمات خاصة..."
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════
   TotalsBreakdownCard Component
   ═══════════════════════════════════════════════ */
interface TotalsBreakdownCardProps {
  currentSubtotal: number;
  totalSavings: number;
  currentFee: number;
  isFreeDelivery: boolean;
}
const TotalsBreakdownCard: React.FC<TotalsBreakdownCardProps> = ({
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

/* ═══════════════════════════════════════════════
   CartFooter Component
   ═══════════════════════════════════════════════ */
interface CartFooterProps {
  grandTotal: number;
  isFormValid: boolean;
  submitting: boolean;
  submitResult: { success: boolean; message: string } | null;
  handleSendOrder: () => void;
  handleSubmitOrder: () => void;
  showReceipt: boolean;
  setShowReceipt: (v: boolean) => void;
}
const CartFooter: React.FC<CartFooterProps> = ({
  grandTotal,
  isFormValid,
  submitting,
  submitResult,
  handleSendOrder,
  handleSubmitOrder,
  showReceipt,
  setShowReceipt
}) => (
  <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-bottom mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    {/* 📌 Sticky Total Display */}
    <div className="px-5 pt-4 pb-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">الإجمالي</span>
        <span className="text-xl font-black text-brand-600 tabular-nums">
          {grandTotal.toLocaleString('en-US')} ريال
        </span>
      </div>
    </div>

    <div className="px-5 pb-4 space-y-2.5">
      {!isFormValid && (
        <div className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-2 rounded-lg">
          <Info className="w-3 h-3 shrink-0" />
          <span>يرجى تعبئة الاسم والهاتف والعنوان</span>
        </div>
      )}

      {submitResult && (
        <div className={`flex items-center gap-2 text-[10px] p-2 rounded-lg ${
          submitResult.success 
            ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
            : 'text-red-600 bg-red-50 dark:bg-red-900/20'
        }`}>
          <Info className="w-3 h-3 shrink-0" />
          <span>{submitResult.message}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmitOrder}
          disabled={!isFormValid || submitting}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98]"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{submitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}</span>
        </button>
        
        <button
          onClick={() => {
            if (!isFormValid) return;
            setShowReceipt(true);
          }}
          disabled={!isFormValid || submitting}
          className="w-14 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center transition-colors border border-gray-200 dark:border-gray-700"
          title="معاينة الفاتورة"
        >
          <FileOutput className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleSendOrder}
        disabled={!isFormValid || submitting}
        className="w-full py-2 text-[10px] text-gray-400 hover:text-green-600 font-medium flex items-center justify-center gap-1 transition-colors"
      >
        <MessageCircle className="w-3 h-3" />
        <span>أو إرسال عبر واتساب</span>
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   Main CartDrawer Component
   ═══════════════════════════════════════════════ */
export const CartDrawer: React.FC = () => {
  const location = useLocation();
  const { 
    items, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart,
    decreaseQuantity,
    addToCart, 
    sendOrderToWhatsApp,
    submitOrderToSystem,
    totalItems 
  } = useCart();

  // ── Checkout State ──
  const [deliveryZone, setDeliveryZone] = useState(() => localStorage.getItem('jouda_delivery_zone') || 'sanaa_near');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('jouda_customer_name') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('jouda_customer_address') || '');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(() => localStorage.getItem('jouda_customer_phone') || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    orderNumber: string;
    quotationId: string;
    orderId?: string;
    total: number;
  } | null>(null);
   
  // ── Receipt State ──
  const [showReceipt, setShowReceipt] = useState(false);
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);

  // ── UX Enhancement State ──
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [formExpanded, setFormExpanded] = useState(true);
  const [bouncingItemId, setBouncingItemId] = useState<string | null>(null);

  // Load products to resolve packages details when open
  useEffect(() => {
    if (isCartOpen) {
      getCachedProducts().then(setCachedProducts).catch(console.warn);
    }
  }, [isCartOpen]);

  // Close cart on route change
  useEffect(() => {
    if (isCartOpen) {
      setIsCartOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock scroll when cart is open
  useScrollLock(isCartOpen || showSuccessModal);

  // ── Computed Values ──
  const currentSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price || '0') || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [items]);

  const totalSavings = useMemo(() => {
    return items.reduce((sum, item) => {
      const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
      const isPackage = item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
      const bundleItems = matchedProduct?.bundle_items || [];
      
      if (isPackage && bundleItems.length > 0) {
        const regularTotal = bundleItems.reduce((bSum: number, bItem: any) => {
          const compProd = cachedProducts.find(p => p.barcode === bItem.barcode);
          const compPrice = compProd ? compProd.price : 0;
          return bSum + (compPrice * bItem.quantity);
        }, 0);
        const pkgPrice = parseFloat(item.price || '0') || 0;
        if (regularTotal > pkgPrice) {
          return sum + ((regularTotal - pkgPrice) * item.quantity);
        }
      }
      return sum;
    }, 0);
  }, [items, cachedProducts]);

  const { currentFee, isFreeDelivery } = useMemo(() => {
    const config = DELIVERY_CONFIG[deliveryZone] || DELIVERY_CONFIG.sanaa_near;
    const isFree = currentSubtotal >= config.freeTarget;
    return {
      currentFee: isFree ? 0 : config.fee,
      isFreeDelivery: isFree
    };
  }, [deliveryZone, currentSubtotal]);

  const grandTotal = currentSubtotal + currentFee;

  // ── Handlers ──
  const handleClose = () => {
    setIsCartOpen(false);
    setShowReceipt(false);
  };

  const handleDecrease = (id: string) => {
    decreaseQuantity(id);
    setBouncingItemId(id);
    setTimeout(() => setBouncingItemId(null), 350);
    try { navigator.vibrate?.(10); } catch {}
  };

  const handleIncrease = (name: string, id: string) => {
    addToCart(name);
    setBouncingItemId(id);
    setTimeout(() => setBouncingItemId(null), 350);
  };

  const handleRemove = (id: string) => {
    try { navigator.vibrate?.(25); } catch {}
    removeFromCart(id);
  };

  const handleSendOrder = () => {
    if (!customerName.trim()) {
      alert('يرجى كتابة الاسم الكريم');
      return;
    }
    if (!address.trim()) {
      alert('يرجى كتابة عنوان التوصيل');
      return;
    }

    sendOrderToWhatsApp(customerName, address, notes);
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert('يرجى كتابة الاسم الكريم');
      return;
    }
    if (!phone.trim()) {
      alert('يرجى كتابة رقم الهاتف');
      return;
    }
    if (!address.trim()) {
      alert('يرجى كتابة عنوان التوصيل');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await submitOrderToSystem({
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        customer_address: address,
        order_type: 'delivery',
        payment_method: 'CASH',
        notes: notes || undefined,
        subtotal: currentSubtotal,
        delivery_fee: currentFee,
      });

      if (result.success) {
        // Save ALL form fields for auto-fill next time
        localStorage.setItem('jouda_customer_phone', phone.trim());
        localStorage.setItem('jouda_customer_name', customerName.trim());
        localStorage.setItem('jouda_customer_address', address.trim());
        localStorage.setItem('jouda_delivery_zone', deliveryZone);

        setLastOrderDetails({
          orderNumber: result.order_number || result.quotation_id || '',
          quotationId: result.quotation_id || '',
          orderId: result.order_id,
          total: currentSubtotal + currentFee,
        });
        setIsCartOpen(false);
        setTimeout(() => setShowSuccessModal(true), 300);
      } else {
        setSubmitResult({ success: false, message: result.message });
      }
    } catch (e: any) {
      setSubmitResult({ success: false, message: e.message || 'فشل إرسال الطلب' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isCartOpen && !showSuccessModal) return null;

  const isFormValid = customerName.trim() !== '' && phone.trim() !== '' && address.trim() !== '';

  // Free delivery progress
  const config = DELIVERY_CONFIG[deliveryZone] || DELIVERY_CONFIG.sanaa_near;
  const deliveryProgress = Math.min((currentSubtotal / config.freeTarget) * 100, 100);
  const deliveryRemaining = Math.max(config.freeTarget - currentSubtotal, 0);

  // Auto-fill badge helper
  const isSaved = (key: string, val: string) => !!val && localStorage.getItem(key) === val;

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:justify-end md:items-stretch bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-gray-50 dark:bg-gray-900 w-full max-w-md h-[85vh] md:h-full md:max-w-lg md:rounded-l-3xl rounded-t-3xl shadow-2xl flex flex-col animate-slide-up-mobile md:animate-slide-in-right overflow-hidden border-l border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <CartHeader totalItems={totalItems} handleClose={handleClose} />

            <div className="flex-1 overflow-y-auto p-5 relative space-y-4">
              {items.length === 0 ? (
                <EmptyCartView handleClose={handleClose} />
              ) : (
                <>
                  <CollapsibleItemsList
                    items={items}
                    cachedProducts={cachedProducts}
                    productsExpanded={productsExpanded}
                    setProductsExpanded={setProductsExpanded}
                    currentSubtotal={currentSubtotal}
                    totalItems={totalItems}
                    bouncingItemId={bouncingItemId}
                    handleIncrease={handleIncrease}
                    handleDecrease={handleDecrease}
                    handleRemove={handleRemove}
                  />

                  <DeliveryProgressBar
                    isFreeDelivery={isFreeDelivery}
                    deliveryProgress={deliveryProgress}
                    deliveryRemaining={deliveryRemaining}
                  />

                  <CheckoutFormFields
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    phone={phone}
                    setPhone={setPhone}
                    deliveryZone={deliveryZone}
                    setDeliveryZone={setDeliveryZone}
                    address={address}
                    setAddress={setAddress}
                    notes={notes}
                    setNotes={setNotes}
                    formExpanded={formExpanded}
                    setFormExpanded={setFormExpanded}
                    isFormValid={isFormValid}
                    isSaved={isSaved}
                  />

                  <TotalsBreakdownCard
                    currentSubtotal={currentSubtotal}
                    totalSavings={totalSavings}
                    currentFee={currentFee}
                    isFreeDelivery={isFreeDelivery}
                  />
                </>
              )}
              <div className="h-8"></div>
            </div>

            {items.length > 0 && (
              <CartFooter
                grandTotal={grandTotal}
                isFormValid={isFormValid}
                submitting={submitting}
                submitResult={submitResult}
                handleSendOrder={handleSendOrder}
                handleSubmitOrder={handleSubmitOrder}
                showReceipt={showReceipt}
                setShowReceipt={setShowReceipt}
              />
            )}
          </div>
        </div>
      )}

      {showReceipt && (
        <ReceiptModal 
          items={items}
          customerName={customerName}
          address={address}
          notes={notes}
          orderType="delivery"
          onClose={() => setShowReceipt(false)}
        />
      )}

      {showSuccessModal && lastOrderDetails && (
        <SuccessOrderModal
          orderNumber={lastOrderDetails.orderNumber}
          quotationId={lastOrderDetails.quotationId}
          orderId={lastOrderDetails.orderId}
          customerName={customerName}
          total={lastOrderDetails.total}
          onClose={() => {
            setShowSuccessModal(false);
            setIsCartOpen(false);
            setCustomerName('');
            setPhone('');
            setAddress('');
            setNotes('');
          }}
        />
      )}

      {/* ✨ Enhancement Animations */}
      <style>{`
        @keyframes qty-bounce {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.45); }
          70% { transform: scale(0.95); }
        }
        .cart-qty-bounce {
          animation: qty-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
};
