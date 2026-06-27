import React from 'react';
import { ShoppingBag, MessageCircle, FileOutput, Info } from 'lucide-react';

interface CartFooterProps {
  isFormValid: boolean;
  canSubmitOrder?: boolean;
  validationMessage?: string;
  submitting: boolean;
  submitResult: { success: boolean; message: string } | null;
  handleSendOrder: () => void;
  handleSubmitOrder: () => void;
  showReceipt: boolean;
  setShowReceipt: (v: boolean) => void;
  step?: 'cart' | 'checkout';
  onNext?: () => void;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  isFormValid,
  canSubmitOrder = isFormValid,
  validationMessage,
  submitting,
  submitResult,
  handleSendOrder,
  handleSubmitOrder,
  showReceipt,
  setShowReceipt,
  step = 'cart',
  onNext
}) => (
  <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-bottom mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">

    <div className="px-5 pb-4 space-y-2.5">
      {(!isFormValid || validationMessage) && (
        <div className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-2 rounded-lg">
          <Info className="w-3 h-3 shrink-0" />
          <span>{validationMessage || 'لا تنسى تكتب الاسم، الجوال، وتحدد موقع التوصيل'}</span>
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

      <div className="flex flex-col gap-3">
        {step === 'cart' ? (
          <button
            onClick={onNext}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98] text-lg"
          >
            <span>التالي: بيانات التوصيل 🚚</span>
          </button>
        ) : (
          <button
            onClick={handleSubmitOrder}
            disabled={!canSubmitOrder || submitting}
            className={`w-full text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-lg shadow-lg ${
              !canSubmitOrder || submitting
                ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-80'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200 dark:shadow-none'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>{submitting ? 'جاري إرسال طلبك...' : 'أرسل الطلب الآن ✅'}</span>
          </button>
        )}
        
        {step === 'checkout' && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleSendOrder}
              disabled={!canSubmitOrder || submitting}
              className="py-2 text-[12px] text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span>أرسل الطلب بواتساب</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">|</span>

            <button
              onClick={() => {
                if (!canSubmitOrder) return;
                setShowReceipt(true);
              }}
              disabled={!canSubmitOrder || submitting}
              className="py-2 text-[12px] text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileOutput className="w-4 h-4" />
              <span>معاينة الفاتورة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
