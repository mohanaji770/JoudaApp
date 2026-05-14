
import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, MessageCircle, Plus, Minus, MapPin, User, FileText, Store, Truck, ShieldCheck, Clock, FileOutput, CheckCircle2, Wallet, Info } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { STORE_CONFIG, STORE_BRANCHES } from '../constants';
import { ReceiptModal } from './ReceiptModal';

export const CartDrawer: React.FC = () => {
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
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(STORE_BRANCHES[0].id);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
   
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);

  const handleClose = () => {
    setIsCartOpen(false);
    setShowReceipt(false);
  };

  const getSelectedBranchName = () => {
    const branch = STORE_BRANCHES.find(b => b.id === selectedBranchId);
    return branch ? branch.name : STORE_CONFIG.ADDRESS;
  };

  const handleSendOrder = () => {
    // Validation
    if (!customerName.trim()) {
      alert('يرجى كتابة الاسم الكريم');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      alert('يرجى كتابة عنوان التوصيل');
      return;
    }

    // Custom message construction based on order type
    let finalAddress = address;
    if (orderType === 'pickup') {
        const branchName = getSelectedBranchName();
        finalAddress = `استلام من الفرع: (${branchName})`;
    }

    sendOrderToWhatsApp(customerName, finalAddress, notes);
    // handleClose(); 
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
    if (orderType === 'delivery' && !address.trim()) {
      alert('يرجى كتابة عنوان التوصيل');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    const finalAddress = orderType === 'pickup'
      ? `استلام من الفرع: ${getSelectedBranchName()}`
      : address;

    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.price || '0') || 0;
      return sum + (price * item.quantity);
    }, 0);

    try {
      const result = await submitOrderToSystem({
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        customer_address: finalAddress,
        order_type: orderType,
        branch_id: orderType === 'pickup' ? selectedBranchId : undefined,
        payment_method: 'CASH',
        notes: notes || undefined,
        subtotal,
        delivery_fee: 0,
      });

      setSubmitResult({ success: result.success, message: result.message });
      if (result.success) {
        setTimeout(() => {
          setSubmitResult(null);
          handleClose();
        }, 3000);
      }
    } catch (e: any) {
      setSubmitResult({ success: false, message: e.message || 'فشل إرسال الطلب' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  const isFormValid = customerName.trim() !== '' && phone.trim() !== '' && (orderType === 'pickup' || address.trim() !== '');

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end justify-center md:justify-end md:items-stretch bg-black/60 backdrop-blur-sm animate-fade-in">
        <div 
          className="bg-gray-50 dark:bg-gray-900 w-full max-w-md h-[95vh] md:h-full md:max-w-lg md:rounded-l-3xl rounded-t-3xl shadow-2xl flex flex-col animate-slide-up-mobile md:animate-slide-in-right overflow-hidden border-l border-gray-200 dark:border-gray-700"
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
                    مراجعة المنتجات وبيانات الاستلام
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

          {/* SINGLE SCROLLABLE BODY CONTENT */}
          <div className="flex-1 overflow-y-auto p-5 relative space-y-8">
            
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">سلتك فارغة</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px] leading-relaxed">
                  تصفح المتجر أو الوصفات وأضف منتجاتك المفضلة
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
                {/* SECTION 1: ITEMS LIST */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                           <ShoppingBag className="w-4 h-4 text-brand-600" />
                           المنتجات المختارة
                        </h3>
                        <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">
                            {totalItems} منتج
                        </span>
                    </div>

                    <div className="space-y-3">
                        {items.map((item) => (
                        <div key={item.id} className="bg-warm-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{item.name}</h3>
                                <button 
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.source === 'bakery' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                                    {item.source === 'bakery' ? 'مخبوزات طازجة' : 'منتج متجر'}
                                </span>

                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                                    <button 
                                    onClick={() => decreaseQuantity(item.id)}
                                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                    <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-bold w-6 text-center text-gray-800 dark:text-white">{item.quantity}</span>
                                    <button 
                                    onClick={() => addToCart(item.name)}
                                    className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-md shadow-sm hover:bg-brand-700 transition-colors"
                                    >
                                    <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Summary Badge */}
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          <div>
                              <p className="text-xs font-bold text-green-800 dark:text-green-200">ضمان الجودة</p>
                              <p className="text-[10px] text-green-600 dark:text-green-300">جميع المنتجات خالية من الجلوتين 100%</p>
                          </div>
                    </div>
                </section>

                {/* DIVIDER */}
                <div className="h-px bg-gray-200 dark:bg-gray-800 border-t border-dashed border-gray-300 dark:border-gray-700"></div>

                {/* SECTION 2: CHECKOUT FORM */}
                <section className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                           <Wallet className="w-4 h-4 text-brand-600" />
                           بيانات الطلب
                        </h3>
                    </div>

                    {/* Order Type Toggle */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
                        <button
                          onClick={() => setOrderType('delivery')}
                          className={`flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                              orderType === 'delivery' 
                              ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm ring-1 ring-gray-100 dark:ring-0' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                          }`}
                        >
                            <Truck className="w-5 h-5" />
                            <span>توصيل للمنزل</span>
                        </button>
                        <button
                          onClick={() => setOrderType('pickup')}
                          className={`flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                              orderType === 'pickup' 
                              ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm ring-1 ring-gray-100 dark:ring-0' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                          }`}
                        >
                            <Store className="w-5 h-5" />
                            <span>استلام من الفرع</span>
                        </button>
                    </div>

                    {/* Info Form */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="cart-name" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">الاسم الكريم *</label>
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

                      <div>
                        <label htmlFor="cart-phone" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">رقم الهاتف *</label>
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

                      {orderType === 'delivery' ? (
                          <div className="animate-fade-in">
                              <label htmlFor="cart-address" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">عنوان التوصيل *</label>
                              <div className="relative">
                                  <MapPin className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
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
                      ) : (
                          <div className="animate-fade-in">
                              <h4 className="block text-xs font-bold text-gray-500 mb-2 mr-1">اختر الفرع الأقرب لك لاستلام الطلب:</h4>
                              <div className="space-y-2">
                                 {STORE_BRANCHES.map((branch) => {
                                   const isSelected = selectedBranchId === branch.id;
                                   return (
                                     <button
                                       key={branch.id}
                                       onClick={() => setSelectedBranchId(branch.id)}
                                       className={`w-full text-right p-4 rounded-xl border transition-all relative ${
                                         isSelected 
                                           ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 shadow-sm' 
                                           : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                       }`}
                                     >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Store className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-gray-400'}`} />
                                                <span className={`text-sm font-bold ${isSelected ? 'text-brand-900 dark:text-brand-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {branch.name}
                                                </span>
                                            </div>
                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
                                        </div>
                                        <p className={`text-[10px] pr-6 leading-relaxed ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {branch.address}
                                        </p>
                                     </button>
                                   );
                                 })}
                              </div>
                              
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg mt-3">
                                  <Clock className="w-3 h-3" />
                                  <span>مواعيد العمل: يومياً من 9 صباحاً - 10 مساءً</span>
                              </div>
                          </div>
                      )}

                      <div>
                        <label htmlFor="cart-notes" className="block text-xs font-bold text-gray-500 mb-1.5 mr-1">ملاحظات (اختياري)</label>
                        <div className="relative">
                          <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
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
                </section>
              </>
            )}

            {/* Bottom Padding for scroll */}
            <div className="h-2"></div>
          </div>

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-bottom mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="space-y-3">
                  {/* Status Indicator for user */}
                  {!isFormValid && (
                      <div className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg mb-1">
                          <Info className="w-3 h-3" />
                          <span>يرجى تعبئة الاسم والعنوان لتفعيل الأزرار</span>
                      </div>
                  )}

                  {submitResult && (
                    <div className={`flex items-center gap-2 text-[10px] p-2 rounded-lg mb-1 ${submitResult.success ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
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

      {showReceipt && (
        <ReceiptModal 
          items={items}
          customerName={customerName}
          address={orderType === 'delivery' ? address : `استلام من: ${getSelectedBranchName()}`}
          notes={notes}
          orderType={orderType}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
};
