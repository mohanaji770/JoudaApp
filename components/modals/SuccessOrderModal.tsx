import React, { useEffect, useState } from 'react';
import { Check, Copy, Share2, Home, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScrollLock } from '../../hooks/index';

interface SuccessOrderModalProps {
  orderNumber: string;
  quotationId?: string;
  orderId?: string;
  customerName: string;
  total: number;
  onClose: () => void;
}

export const SuccessOrderModal: React.FC<SuccessOrderModalProps> = ({
  orderNumber,
  customerName,
  total,
  onClose,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useScrollLock(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    const message = `طلب جديد في جوده — ${orderNumber}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleHome = () => {
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-800">
        {/* Success Header */}
        <div className="bg-green-50 dark:bg-green-900/20 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            طلبك وصل وجاهز للاعتماد! 🎉
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تسلم يا {customerName}، وبنتواصل معك لتأكيد الطلب
          </p>
        </div>

        {/* Compact Order Info */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">رقم طلبك</p>
              <p className="text-base font-black text-brand-600 font-mono">{orderNumber}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'تم' : 'نسخ'}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            إجمالي الحساب: <span className="font-bold text-gray-700 dark:text-gray-300">{total.toLocaleString()}<span className="saudi-riyal mr-1">{"\u00ea"}</span></span>
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            ارجع للمتجر
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleHome}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              الرئيسية
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-green-200 dark:border-green-800 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              مشاركة
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};
