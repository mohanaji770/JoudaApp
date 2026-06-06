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
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-brand-600" />
        بيانات التوصيل
        {isFormValid && (
          <span className="text-[10px] text-green-500 font-bold">✓ مكتمل</span>
        )}
      </h3>
    </div>

    <div className="space-y-3 px-1.5 py-1.5">
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
  </section>
);
