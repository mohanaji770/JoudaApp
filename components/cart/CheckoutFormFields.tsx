import React from 'react';
import { Wallet, User, MessageCircle, Truck, MapPin, FileText } from 'lucide-react';

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
  isFormValid: boolean;
  isSaved: (key: string, value: string) => boolean;
}

export const CheckoutFormFields: React.FC<CheckoutFormFieldsProps> = ({
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
  isFormValid,
  isSaved
}) => (
  <section className="mt-4 mb-4">
    <div className="w-full flex items-center justify-between mb-3 py-1">
      <h3 className="text-base font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-brand-600" />
        الرجاء تعبئة بيانات الاستلام
        {isFormValid && (
          <span className="text-xs text-green-500 font-bold">✓ مكتمل</span>
        )}
      </h3>
    </div>

    <div className="space-y-3 px-1.5 py-1.5">
        <div>
          <label htmlFor="cart-name" className="flex items-center gap-1 text-sm font-black text-gray-600 dark:text-gray-300 mb-2 mr-1">
            الاسم الكريم *
            {isSaved('jouda_customer_name', customerName) && (
              <span className="text-[10px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <User className="w-6 h-6 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input 
              id="cart-name"
              type="text" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 text-lg dark:text-white font-bold transition-all shadow-sm"
              placeholder="الاسم الثلاثي"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cart-phone" className="flex items-center gap-1 text-sm font-black text-gray-600 dark:text-gray-300 mb-2 mr-1">
            رقم الجوال *
            {isSaved('jouda_customer_phone', phone) && (
              <span className="text-[10px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input 
              id="cart-phone"
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 text-xl dark:text-white font-black transition-all shadow-sm"
              placeholder="77XXXXXXX"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1 text-sm font-black text-gray-600 dark:text-gray-300 mb-2 mr-1">
            منطقة التوصيل *
            {isSaved('jouda_delivery_zone', deliveryZone) && (
              <span className="text-[10px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'sanaa_near', label: 'صنعاء (الجراف والستين وما جاورها)' },
              { id: 'sanaa_far', label: 'صنعاء (مناطق أخرى)' },
              { id: 'provinces', label: 'محافظات أخرى' }
            ].map(zone => (
              <button
                key={zone.id}
                onClick={() => setDeliveryZone(zone.id)}
                className={`py-3.5 px-4 rounded-xl border-2 font-bold text-base transition-all flex items-center gap-3 ${
                  deliveryZone === zone.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  deliveryZone === zone.id ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {deliveryZone === zone.id && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />}
                </div>
                <span>{zone.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="cart-address" className="flex items-center gap-1 text-sm font-black text-gray-600 dark:text-gray-300 mb-2 mr-1">
            وصف البيت أو العنوان *
            {isSaved('jouda_customer_address', address) && (
              <span className="text-[10px] text-green-500 font-bold">محفوظ ✓</span>
            )}
          </label>
          <div className="relative">
            <MapPin className="w-6 h-6 text-gray-400 absolute right-4 top-4" />
            <textarea 
              id="cart-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full pr-12 pl-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 text-lg dark:text-white resize-none font-bold transition-all shadow-sm"
              placeholder="مثال: الحصبة - بجوار مطعم..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="cart-notes" className="flex items-center gap-1 text-sm font-black text-gray-600 dark:text-gray-300 mb-2 mr-1">ملاحظات (اختياري)</label>
          <div className="relative">
            <FileText className="w-6 h-6 text-gray-400 absolute right-4 top-4" />
            <textarea 
              id="cart-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full pr-12 pl-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 text-lg dark:text-white resize-none font-bold transition-all shadow-sm"
              placeholder="أي تعليمات إضافية..."
            />
          </div>
        </div>
      </div>
  </section>
);
