
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, PackageSearch, FileText, ShoppingBag } from 'lucide-react';
import { STORE_CONFIG } from '../../constants';

interface ProductRequestModalProps {
  onClose: () => void;
  initialProductName?: string;
}

export const ProductRequestModal: React.FC<ProductRequestModalProps> = ({ onClose, initialProductName = '' }) => {
  const [productName, setProductName] = useState(initialProductName);
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendRequest = () => {
    if (!productName.trim() || isSending) return;
    setIsSending(true);

    let message = `*طلب توفير منتج جديد* 📦\n`;
    message += `------------------\n`;
    message += `🛒 *المنتج المطلوب:* ${productName}\n`;
    
    if (notes.trim()) {
      message += `📝 *ملاحظات:* ${notes}\n`;
    }
    
    message += `------------------\n`;
    message += `يرجى إبلاغي عند توفره في متجر جوده. شكراً!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = STORE_CONFIG.PHONE.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    setTimeout(() => {
      window.open(url, '_blank');
      onClose();
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-100 dark:border-brand-900/30">
            <PackageSearch className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">طلب توفير منتج</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            لم تجد ما تبحث عنه؟ اطلبه الآن وسنسعى لتوفيره لك في متجر جوده.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="request-product" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 mr-1">اسم المنتج *</label>
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                id="request-product"
                type="text" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && productName.trim() && !isSending) {
                    handleSendRequest();
                  }
                }}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white placeholder-gray-400"
                placeholder="مثال: دقيق لوز، بسكويت شار..."
                autoFocus
              />
            </div>
          </div>

          <div>
            <label htmlFor="request-notes" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 mr-1">ملاحظات إضافية (اختياري)</label>
            <div className="relative">
              <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              <textarea 
                id="request-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white resize-none placeholder-gray-400"
                placeholder="أي تفاصيل عن الماركة أو الحجم..."
              />
            </div>
          </div>

          <button
            onClick={handleSendRequest}
            disabled={!productName.trim() || isSending}
            className="w-full bg-whatsapp hover:bg-whatsapp-hover disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none transition-all active:scale-[0.98] mt-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{isSending ? 'جاري تحضير الطلب...' : 'إرسال الطلب عبر واتساب'}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
