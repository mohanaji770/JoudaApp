
import React, { useRef, useState, useEffect } from 'react';
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
  orderType: 'delivery' | 'pickup';
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  items,
  customerName,
  address,
  notes,
  orderType,
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
  const orderDate = new Date().toLocaleDateString('ar-SA', { 
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
  const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`;

  // Categorize Items
  const packagesList = items.filter(item => {
    const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
    return item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
  });

  const storeItems = items.filter(item => {
    const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
    const isPackage = item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
    return !isPackage && (!item.source || item.source === 'store');
  });

  const bakeryItems = items.filter(item => {
    const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
    const isPackage = item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
    return !isPackage && item.source === 'bakery';
  });

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure images are loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      const blob = await toBlob(receiptRef.current, { 
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          return (node.tagName !== 'LINK');
        }
      });

      if (!blob) throw new Error('Failed to generate receipt');

      const file = new File([blob], `receipt-${orderId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة طلب ${orderId}`,
          text: `فاتورة طلب من تطبيق جودة - ${customerName}`,
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
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
            <div className="bg-receipt px-6 py-8 relative overflow-hidden text-gray-800 font-mono text-sm leading-relaxed">
                
                {/* Sawtooth Top Edge Effect */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#fffdf8_50%)] bg-[length:16px_16px] rotate-180 -mt-2"></div>

                {/* RUBBER STAMP EFFECT */}
                <div className="absolute top-24 left-6 z-10 pointer-events-none select-none opacity-20">
                      <div className="border-4 border-red-800 text-red-800 font-black text-lg px-4 py-2 rounded-lg -rotate-12 uppercase tracking-widest flex items-center justify-center border-double">
                          <span>طلب من التطبيق</span>
                      </div>
                </div>

                {/* Header */}
                <div className="flex flex-col items-center text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6 relative z-20">
                    <div className="w-16 h-16 mb-3 grayscale opacity-90">
                        <img 
                          src={APP_LOGO} 
                          alt="Logo" 
                          className="w-full h-full object-contain" 
                          crossOrigin="anonymous"
                        />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">{STORE_CONFIG.NAME}</h2>
                    <p className="text-xs text-gray-500 dir-ltr">{STORE_CONFIG.PHONE}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">Electronic Receipt</p>
                </div>

                {/* Order Details */}
                <div className="mb-6 space-y-2 text-xs relative z-20">
                    <div className="flex justify-between">
                        <span className="text-gray-500">رقم الطلب:</span>
                        <span className="font-bold">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">التاريخ:</span>
                        <span className="font-bold">{orderDate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">طريقة الاستلام:</span>
                        <span className="font-bold bg-gray-100 px-2 rounded">
                            {orderType === 'delivery' ? 'توصيل للبيت 🚚' : 'استلام من المحل 🏪'}
                        </span>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 mb-6 space-y-2 text-xs relative z-20">
                    <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        <div>
                            <span className="block text-gray-400 text-[10px]">الاسم الكريم</span>
                            <span className="font-bold">{customerName}</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
                        {orderType === 'delivery' ? (
                             <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        ) : (
                             <Store className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        )}
                        <div>
                            <span className="block text-gray-400 text-[10px]">
                                {orderType === 'delivery' ? 'عنوان التوصيل' : 'تستلم من'}
                            </span>
                            <span className="font-medium">{address}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table - CATEGORIZED SPLIT */}
                <div className="mb-6 relative z-20">
                    <div className="flex justify-between text-xs font-bold border-b border-gray-800 pb-2 mb-3">
                        <span>المنتج</span>
                        <span>الكمية</span>
                    </div>
                    
                    <div className="space-y-5">
                        {/* Packages Section */}
                        {packagesList.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-rose-600 mb-2 pb-1 border-b border-rose-100 flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3 text-rose-500" />
                                    <span>العروض والباكجات 🎁</span>
                                </h4>
                                <div className="space-y-3 pr-2">
                                    {packagesList.map((item, idx) => {
                                        const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
                                        const bundleItems = matchedProduct?.bundle_items || [];
                                        return (
                                            <div key={`package-${idx}`} className="space-y-1">
                                                <div className="flex justify-between text-xs items-start font-bold">
                                                    <span className="flex-1 ml-2 text-gray-900">{item.name}</span>
                                                    <span className="font-bold font-mono">x{item.quantity}</span>
                                                </div>
                                                {bundleItems.length > 0 && (
                                                    <div className="pr-3 border-r border-dashed border-gray-300 space-y-0.5 text-gray-500 text-[10px]">
                                                        {bundleItems.map((bItem: any, bIdx: number) => (
                                                            <div key={bIdx} className="flex justify-between items-center">
                                                                <span>- {bItem.product_name}</span>
                                                                <span className="font-mono">x{bItem.quantity * item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Store Section */}
                        {storeItems.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-500 mb-2 pb-1 border-b border-gray-100 flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3" />
                                    <span>طلبات المتجر</span>
                                </h4>
                                <div className="space-y-2 pr-2">
                                    {storeItems.map((item, idx) => (
                                        <div key={`store-${idx}`} className="flex justify-between text-xs items-start">
                                            <span className="flex-1 ml-2 text-gray-800">{item.name}</span>
                                            <span className="font-bold font-mono">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bakery Section */}
                        {bakeryItems.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-pink-500 mb-2 pb-1 border-b border-pink-100 flex items-center gap-1">
                                    <Store className="w-3 h-3" />
                                    <span>مخبوزات طازجة</span>
                                </h4>
                                <div className="space-y-2 pr-2">
                                    {bakeryItems.map((item, idx) => (
                                        <div key={`bakery-${idx}`} className="flex justify-between text-xs items-start">
                                            <span className="flex-1 ml-2 text-gray-800">{item.name}</span>
                                            <span className="font-bold font-mono">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-800 mt-5 pt-2 flex justify-between font-bold">
                        <span>إجمالي العدد</span>
                        <span>{totalItems}</span>
                    </div>
                    <div className="text-center text-[10px] text-gray-400 mt-2">
                        * بنحسب السعر النهائي ونكلمك عند تأكيد الطلب
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

                {/* BONUS COUPON */}
                <div className="mt-8 mb-4 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 relative z-20 mx-1">
                     {/* Scissors Icon */}
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-receipt px-2 text-gray-400">
                        <Scissors className="w-4 h-4 text-gray-400 rotate-90" />
                     </div>
                     <div className="text-center">
                        <p className="font-bold text-xs mb-1 text-gray-800">🎁 شكراً لثقتك في جودة</p>
                        <p className="text-[10px] text-gray-600 mb-2">خلي الفاتورة معك، ولك خصم 5% على طلبك الجاي لكيك المناسبات!</p>
                        <div className="font-mono font-bold text-xs bg-white border border-gray-200 inline-block px-3 py-1 rounded text-gray-700 tracking-wider">
                            JOUDA-CAKE-5
                        </div>
                     </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-2 relative z-20">
                    <p className="font-bold text-sm mb-1">صحتكم تهمنا وبالعافية مقدماً! ❤️</p>
                    <p className="text-[10px] text-gray-500">عالم جودة</p>
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
    </div>
  );
};
