import React, { useState } from 'react';
import { Wallet, User, MessageCircle, MapPin, FileText, Map } from 'lucide-react';

interface CheckoutFormFieldsProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  customerLat: number | null;
  customerLng: number | null;
  address: string;
  setAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  isFormValid: boolean;
  isSaved: (key: string, value: string) => boolean;
  onOpenMap: () => void;
}

export const CheckoutFormFields: React.FC<CheckoutFormFieldsProps> = ({
  customerName,
  setCustomerName,
  phone,
  setPhone,
  customerLat,
  customerLng,
  address,
  setAddress,
  notes,
  setNotes,
  isFormValid,
  isSaved,
  onOpenMap
}) => {
  const [showNotes, setShowNotes] = useState(!!notes);

  return (
    <section className="mb-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-brand-600" />
          بيانات التوصيل
        </h3>
        {isFormValid && (
          <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 font-bold px-2 py-1 rounded-full">✓ مكتمل</span>
        )}
      </div>

      <div className="space-y-5">
          <div>
            <label htmlFor="cart-name" className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              اسمك الكريم
              {isSaved('jouda_customer_name', customerName) && (
                <span className="text-[10px] text-green-500 font-bold">حفظنا الاسم ✓</span>
              )}
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input 
                id="cart-name"
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-base dark:text-white font-medium transition-all shadow-sm"
                placeholder="اكتب اسمك الثلاثي"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cart-phone" className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              رقم جوالك
              {isSaved('jouda_customer_phone', phone) && (
                <span className="text-[10px] text-green-500 font-bold">حفظنا الرقم ✓</span>
              )}
            </label>
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input 
                id="cart-phone"
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-base dark:text-white font-medium transition-all shadow-sm text-left"
                placeholder="77XXXXXXX"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              مكانك على الخريطة
            </label>
            <button
              type="button"
              onClick={onOpenMap}
              className={`w-full py-3.5 px-4 rounded-xl font-medium text-base flex items-center justify-between transition-all border shadow-sm ${
                customerLat && customerLng 
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Map className={`w-5 h-5 ${customerLat && customerLng ? 'text-green-500' : 'text-brand-500'}`} />
                <span>
                  {customerLat && customerLng ? 'تحدد موقعك بدقة ✓' : 'اضغط لتحديد موقعك على الخريطة 📍'}
                </span>
              </div>
            </button>
          </div>

          <div>
            <label htmlFor="cart-address" className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              تفاصيل العنوان (رقم البيت / الدور / الشقة)
              {isSaved('jouda_customer_address', address) && (
                <span className="text-[10px] text-green-500 font-bold">حفظنا العنوان ✓</span>
              )}
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input 
                id="cart-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-base dark:text-white font-medium transition-all shadow-sm"
                placeholder="مثال: الدور الثاني، شقة 4، بجانب..."
              />
            </div>
          </div>

          {!showNotes ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1.5 py-1"
            >
              <span className="text-lg leading-none">+</span>
              حاب تضيف ملاحظة للمندوب؟ (اختياري)
            </button>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="cart-notes" className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">ملاحظاتك للمندوب</label>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNotes(false);
                    setNotes('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  إلغاء
                </button>
              </div>
              <div className="relative">
                <FileText className="w-5 h-5 text-gray-400 absolute right-4 top-4" />
                <textarea 
                  id="cart-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-base dark:text-white font-medium resize-none transition-all shadow-sm"
                  placeholder="مثال: اتصل بي أول ما توصل، لون الباب بني..."
                />
              </div>
            </div>
          )}
        </div>
    </section>
  );
};


