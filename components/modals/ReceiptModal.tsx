
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCachedProducts } from '../../services/db';
import { toBlob } from 'html-to-image';
import { X, Share2, MapPin, User, FileText, ShoppingBag, Store, Scissors } from 'lucide-react';
import { CartItem } from '../../contexts/CartContext';
import { STORE_CONFIG, APP_LOGO } from '../../constants';
import { useScrollLock } from '../../hooks/index';

interface ReceiptModalProps {
  items: CartItem[];
  customerName: string;
  address: string;
  notes: string;
  orderType: 'delivery' | 'shipping' | 'pickup';
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  phone?: string;
  discount?: number;
  orderNumber?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  items,
  customerName,
  address,
  notes,
  orderType,
  subtotal,
  deliveryFee,
  total,
  phone,
  discount,
  orderNumber,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);

  // Lock body scroll when modal is open
  useScrollLock(true);

  // Load products to resolve packages details when open
  useEffect(() => {
    getCachedProducts().then(setCachedProducts).catch(console.warn);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const d = new Date();
  const orderDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const orderId = orderNumber || `#${Math.floor(1000 + Math.random() * 9000)}`;
  const isPickup = orderType === 'pickup';
  const addressLabel = orderType === 'shipping' ? 'عنوان الشحن' : orderType === 'delivery' ? 'عنوان التوصيل' : 'تستلم من';
  const feeLabel = orderType === 'shipping' ? 'رسوم الشحن' : 'سعر التوصيل';

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure images are loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      const blob = await toBlob(receiptRef.current, { 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      if (!blob) throw new Error('Failed to generate receipt');

      const file = new File([blob], `receipt-${orderId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة طلب ${orderId}`,
          text: `فاتورة طلب من تطبيق جوده - ${customerName}`,
        });
      } else {
        const link = document.createElement('a');
        link.download = `receipt-${orderId}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    } catch (err) {
      console.error('Error sharing receipt:', err);
      alert('حصلت مشكلة بسيطة وإحنا نجهز الفاتورة، شيك على الإنترنت وجرب مرة ثانية.');
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col gap-4 my-auto">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center text-white px-2">
          <h3 className="font-bold text-lg">فاتورتك الإلكترونية</h3>
          <button 
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* RECEIPT PREVIEW AREA */}
        <div className="relative shadow-2xl mx-auto w-full" ref={receiptRef}>
            {/* Paper Texture Background */}
            <div className="bg-receipt px-6 py-6 relative overflow-hidden text-gray-800 font-sans font-medium text-[13px] leading-relaxed">
                
                {/* Sawtooth Top Edge Effect */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#fffdf8_50%)] bg-[length:16px_16px] rotate-180 -mt-2"></div>

                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-4 mb-4 relative z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 border-gray-100">
                            <img 
                              src={APP_LOGO} 
                              alt="Logo" 
                              className="w-full h-full object-cover" 
                              crossOrigin="anonymous"
                            />
                        </div>
                        <div className="flex flex-col text-right">
                            <h2 className="text-lg font-black text-gray-900 leading-tight">{STORE_CONFIG.NAME}</h2>
                            <p className="text-xs text-gray-700 font-bold mt-0.5 tracking-wider" dir="ltr">{STORE_CONFIG.PHONE.replace('+967', '')}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col text-left space-y-0.5 text-[11px]">
                        <div className="text-gray-500">
                            رقم الطلب: <span className="font-bold text-gray-800 dir-ltr inline-block">{orderId}</span>
                        </div>
                        <div className="text-gray-500">
                            التاريخ: <span className="font-bold text-gray-800 dir-ltr inline-block">{orderDate}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 space-y-2 text-xs relative z-20">
                    <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        <div>
                            <span className="block text-gray-400 text-[10px]">الاسم الكريم</span>
                            <span className="font-bold">{customerName}</span>
                            {phone && <span className="block font-medium text-gray-500 dir-ltr text-right mt-0.5">{phone}</span>}
                        </div>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
                        {!isPickup ? (
                             <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        ) : (
                             <Store className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        )}
                        <div>
                            <span className="block text-gray-400 text-[10px]">
                                {addressLabel}
                            </span>
                            <span className="font-medium">{address}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table - UNIFIED */}
                <div className="mb-4 relative z-20">
                    <div className="flex justify-between text-xs font-bold border-b border-gray-800 pb-2 mb-3">
                        <span>المنتج</span>
                        <span>الكمية</span>
                    </div>
                    
                    <div className="space-y-2">
                        {items.map((item, idx) => {
                            const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
                            const bundleItems = matchedProduct?.bundle_items || [];
                            return (
                                <div key={`item-${idx}`} className="space-y-1">
                                    <div className="flex justify-between text-xs items-start">
                                        <span className="flex-1 ml-2 text-gray-800 font-medium">{item.name}</span>
                                        <span className="font-bold font-mono">x{item.quantity}</span>
                                    </div>
                                    {bundleItems.length > 0 && (
                                        <div className="pr-3 border-r border-dashed border-gray-300 space-y-0.5 text-gray-500 text-[10px]">
                                            {bundleItems.map((bItem: any, bIdx: number) => (
                                                <div key={bIdx} className="flex justify-between items-center">
                                                    <span>- {bItem.product_name}</span>
                                                    <span className="">x{bItem.quantity * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-800 mt-4 pt-2 space-y-2">
                        <div className="flex justify-between font-bold">
                            <span>إجمالي العدد</span>
                            <span>{totalItems}</span>
                        </div>
                        {subtotal !== undefined && (
                          <div className="flex justify-between font-bold text-gray-700">
                              <span>المجموع</span>
                              <span>{subtotal} ريال</span>
                          </div>
                        )}
                        {discount !== undefined && discount > 0 && (
                          <div className="flex justify-between font-bold text-green-600">
                              <span>الخصم</span>
                              <span>-{discount} ريال</span>
                          </div>
                        )}
                        {deliveryFee !== undefined && !isPickup && (
                          <div className="flex justify-between font-bold text-gray-700">
                              <span>{feeLabel}</span>
                              <span>{deliveryFee === 0 ? 'مجاناً' : `${deliveryFee} ريال`}</span>
                          </div>
                        )}
                        {total !== undefined && (
                          <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-gray-300">
                              <span>الإجمالي</span>
                              <span>{total} ريال</span>
                          </div>
                        )}
                    </div>
                </div>

                {/* Notes if any */}
                {notes && (
                    <div className="mb-6 border-t-2 border-dashed border-gray-200 pt-4 relative z-20">
                        <div className="flex items-center gap-1 text-xs font-bold mb-1">
                            <FileText className="w-3 h-3" />
                            ملاحظاتك للمندوب:
                        </div>
                        <p className="text-xs bg-yellow-50 p-2 rounded text-gray-600">{notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-2 relative z-20">
                    <p className="font-bold text-sm mb-1">صحتكم تهمنا وبالعافية مقدماً! ❤️</p>
                    <p className="text-[10px] text-gray-500">عالم جوده</p>
                </div>

                {/* Sawtooth Bottom Edge Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#fffdf8_50%)] bg-[length:16px_16px] -mb-2"></div>
            </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full bg-white text-gray-900 hover:bg-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] text-lg mt-2"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span>نجهز الفاتورة...</span>
            </div>
          ) : (
            <>
              <Share2 className="w-6 h-6" />
              <span>أرسل الفاتورة</span>
            </>
          )}
        </button>

      </div>
    </div>,
    document.body
  );
};
