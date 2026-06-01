import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ShoppingBag, Trash2, MessageCircle, Plus, Minus, MapPin, User, FileText, Truck, FileOutput, Wallet, Info } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { ReceiptModal } from './ReceiptModal';
import { SuccessOrderModal } from './SuccessOrderModal';
import { useScrollLock } from '../hooks';

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

  // Checkout State
  const [deliveryZone, setDeliveryZone] = useState('sanaa_near');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('jouda_customer_name') || '');
  const [address, setAddress] = useState('');
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
   
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);

  // Close cart on route change
  useEffect(() => {
    if (isCartOpen) {
      setIsCartOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock scroll when cart is open
  useScrollLock(isCartOpen || showSuccessModal);

  const handleClose = () => {
    setIsCartOpen(false);
    setShowReceipt(false);
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

    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.price || '0') || 0;
      return sum + (price * item.quantity);
    }, 0);

    let deliveryFee = 0;
    if (deliveryZone === 'sanaa_near') {
      deliveryFee = subtotal >= 20000 ? 0 : 500;
    } else if (deliveryZone === 'sanaa_far') {
      deliveryFee = subtotal >= 20000 ? 0 : 1000;
    } else if (deliveryZone === 'provinces') {
      deliveryFee = subtotal >= 40000 ? 0 : 2000;
    }

    try {
      const result = await submitOrderToSystem({
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        customer_address: address,
        order_type: 'delivery',
        payment_method: 'CASH',
        notes: notes || undefined,
        subtotal,
        delivery_fee: deliveryFee,
      });

      if (result.success) {
        // Save phone for live order tracking
        localStorage.setItem('jouda_customer_phone', phone.trim());
        localStorage.setItem('jouda_customer_name', customerName.trim());

        setLastOrderDetails({
          orderNumber: result.order_number || result.quotation_id || '',
          quotationId: result.quotation_id || '',
          orderId: result.order_id,
          total: subtotal + deliveryFee,
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

  return (
    <>
      {isCartOpen && (
      <div className="fixed inset-0 z-[100] flex items-end justify-center md:justify-end md:items-stretch bg-black/60 backdrop-blur-sm animate-fade-in">
        <div 
          className="bg-gray-50 dark:bg-gray-900 w-full max-w-md h-[80vh] md:h-full md:max-w-lg md:rounded-l-3xl rounded-t-3xl shadow-2xl flex flex-col animate-slide-up-mobile md:animate-slide-in-right overflow-hidden border-l border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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
              className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 relative space-y-6">
            
            {items.length === 0 ? (
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
            ) : (
              <>
                {/* Items List */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                           <ShoppingBag className="w-4 h-4 text-brand-600" />
                           المنتجات ({totalItems})
                        </h3>
                    </div>

                    <div className="space-y-2">
                        {items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 mr-2">
                                <button 
                                onClick={() => decreaseQuantity(item.id)}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                                >
                                <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold min-w-[28px] text-center text-gray-800 dark:text-white">{item.quantity} عدد</span>
                                <button 
                                onClick={() => addToCart(item.name)}
                                className="w-7 h-7 flex items-center justify-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                                >
                                <Plus className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1 mr-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

                {/* Checkout Form */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                       <Wallet className="w-4 h-4 text-brand-600" />
                       <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          بيانات التوصيل
                       </h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="cart-name" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">الاسم الكريم *</label>
                        <div className="relative">
                          <User className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          <input 
                            id="cart-name"
                            type="text" 
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white font-medium"
                            placeholder="الاسم الثلاثي"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="cart-phone" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">رقم الهاتف *</label>
                        <div className="relative">
                          <MessageCircle className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          <input 
                            id="cart-phone"
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white font-medium"
                            placeholder="مثال: 967781117671"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="cart-zone" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">منطقة التوصيل *</label>
                        <div className="relative">
                          <Truck className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          <select 
                            id="cart-zone"
                            value={deliveryZone}
                            onChange={(e) => setDeliveryZone(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white font-medium appearance-none"
                          >
                            <option value="sanaa_near">صنعاء - الجراف والستين وما جاورها</option>
                            <option value="sanaa_far">صنعاء - مناطق أخرى</option>
                            <option value="provinces">محافظات أخرى</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="cart-address" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">عنوان التوصيل *</label>
                        <div className="relative">
                          <MapPin className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                          <textarea 
                            id="cart-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white resize-none font-medium"
                            placeholder="المدينة - الحي - أقرب معلم"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="cart-notes" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">ملاحظات (اختياري)</label>
                        <div className="relative">
                          <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                          <textarea 
                            id="cart-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white resize-none font-medium"
                            placeholder="تعليمات خاصة..."
                          />
                        </div>
                      </div>
                    </div>
                </section>

                <div className="h-px bg-gray-200 dark:bg-gray-800 my-4"></div>

                {/* Totals & Delivery Fee Display */}
                <section className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                   {(() => {
                      const currentSubtotal = items.reduce((sum, item) => {
                        const price = parseFloat(item.price || '0') || 0;
                        return sum + (price * item.quantity);
                      }, 0);
                      
                      let currentFee = 0;
                      let isFree = false;
                      if (deliveryZone === 'sanaa_near') {
                        isFree = currentSubtotal >= 20000;
                        currentFee = isFree ? 0 : 500;
                      } else if (deliveryZone === 'sanaa_far') {
                        isFree = currentSubtotal >= 20000;
                        currentFee = isFree ? 0 : 1000;
                      } else if (deliveryZone === 'provinces') {
                        isFree = currentSubtotal >= 40000;
                        currentFee = isFree ? 0 : 2000;
                      }
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-bold">
                            <span>المجموع الفرعي</span>
                            <span>{currentSubtotal} ريال</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-gray-600 dark:text-gray-400">رسوم التوصيل</span>
                            {isFree ? (
                              <span className="text-green-600">مجاناً! 🎉</span>
                            ) : (
                              <span className="text-gray-800 dark:text-gray-200">{currentFee} ريال</span>
                            )}
                          </div>
                          {isFree && (
                             <div className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center mt-2">
                               مبروك! لقد حصلت على توصيل مجاني.
                             </div>
                          )}
                          <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                          <div className="flex justify-between text-base font-black text-brand-600">
                            <span>الإجمالي</span>
                            <span>{currentSubtotal + currentFee} ريال</span>
                          </div>
                        </>
                      );
                   })()}
                </section>
              </>
            )}

            <div className="h-2"></div>
          </div>

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-bottom mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="space-y-3">
                  {!isFormValid && (
                      <div className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                          <Info className="w-3 h-3" />
                          <span>يرجى تعبئة الاسم والهاتف والعنوان</span>
                      </div>
                  )}

                  {submitResult && (
                    <div className={`flex items-center gap-2 text-[10px] p-2 rounded-lg ${submitResult.success ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                      <Info className="w-3 h-3" />
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
                        className="w-16 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center transition-colors border border-gray-200 dark:border-gray-700"
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
    </>
  );
};
