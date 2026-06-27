
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Share2, ShoppingBag, ExternalLink, Sparkles, BadgeCheck, Check, Plus, Image as ImageIcon, Copy } from 'lucide-react';
import { AnalysisResult, VerdictType } from '../../types';
import { STORE_CONFIG } from '../../constants';
import { useCart } from '../../contexts/CartContext';
import { ShareModal } from '../modals/ShareModal';
import { getCachedProducts } from '../../services/db';

interface ResultCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart, addToCartWithBarcode } = useCart();

  const handleAddToCart = async () => {
    if (isAddingToCart || !result.matchedStoreItem) return;
    setIsAddingToCart(true);
    
    try {
      const cachedProducts = await getCachedProducts();
      const matchedProd = cachedProducts.find(p => p.name === result.matchedStoreItem);
      
      if (matchedProd) {
        addToCartWithBarcode({
          name: matchedProd.name,
          barcode: matchedProd.barcode,
          price: matchedProd.price?.toString(),
          source: 'store'
        });
      } else {
        addToCart(result.matchedStoreItem, 'store');
      }
    } catch (e) {
      addToCart(result.matchedStoreItem, 'store');
    }

    setTimeout(() => {
      setIsAddingToCart(false);
    }, 2000);
  };

  const getTheme = (verdict: VerdictType) => {
    switch (verdict) {
      case VerdictType.SAFE:
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          titleColor: 'text-green-800 dark:text-green-200',
          headerBg: 'bg-green-100 dark:bg-green-900/30'
        };
      case VerdictType.RISKY:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
          titleColor: 'text-yellow-800 dark:text-yellow-200',
          headerBg: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      case VerdictType.UNSAFE:
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          titleColor: 'text-red-800 dark:text-red-200',
          headerBg: 'bg-red-100 dark:bg-red-900/30'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          icon: <AlertTriangle className="w-12 h-12 text-gray-500" />,
          titleColor: 'text-gray-800 dark:text-gray-200',
          headerBg: 'bg-gray-100 dark:bg-gray-800'
        };
    }
  };

  const theme = getTheme(result.verdict);

  const copyToClipboardFallback = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch (err) {
      console.error('Fallback: Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const handleTextShare = async () => {
    if (isCopied) return;
    let shareText = `🧐 *تقرير فحص "جوده"*:\n\n${result.verdictTitle}\n\n🔍 *التحليل:* ${result.analysis}\n\n💡 *توصية جوده:* ${result.guidance}\n\n`;
    if (result.matchedStoreItem) {
      shareText += `🛍️ متوفر في متجر جوده: ${result.matchedStoreItem}\n`;
    }
    shareText += `تفضل بزيارة المتجر: ${STORE_CONFIG.URL}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch (err) {
        copyToClipboardFallback(shareText);
      }
    } else {
      copyToClipboardFallback(shareText);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto rounded-3xl overflow-hidden border ${theme.border} shadow-lg animate-fade-in-up transition-colors duration-300`}>
      {/* Header Section */}
      <div className={`${theme.headerBg} p-6 flex flex-col items-center text-center`}>
        <div className="mb-3 bg-warm-white dark:bg-gray-800 rounded-full p-2 shadow-sm">
          {theme.icon}
        </div>
        <h2 className={`text-xl font-bold ${theme.titleColor} mb-1 leading-tight`}>{result.verdictTitle}</h2>
        <h3 className="text-xs uppercase tracking-wider font-bold opacity-60 mb-2 text-gray-800 dark:text-white">تقرير الفحص</h3>
        <p className="text-sm opacity-75 font-medium text-gray-600 dark:text-gray-400">
          {new Date(result.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Content Section */}
      <div className="bg-warm-white dark:bg-gray-800 p-6 space-y-6 transition-colors duration-300">
        
        {/* JOUDA INVENTORY MATCH */}
        {result.matchedStoreItem && (
           <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-5 shadow-sm relative overflow-hidden animate-pulse-slow">
              <div className="flex items-start gap-3">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm shrink-0 border border-green-100 dark:border-green-900">
                      <BadgeCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                      <h3 className="font-bold text-green-900 dark:text-green-100 text-base mb-1">
                          متوفر في متجر جوده! 🎉
                      </h3>
                      <p className="text-green-800 dark:text-green-200 text-sm leading-relaxed mb-3">
                          المنتج <strong>"{result.matchedStoreItem}"</strong> متاح لدينا للطلب الفوري.
                      </p>
                      <button 
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md dark:shadow-none ${
                          isAddingToCart 
                            ? 'bg-emerald-700 text-white shadow-none scale-95 cursor-default' 
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200 active:scale-95'
                        }`}
                      >
                         {isAddingToCart ? (
                           <>
                             <Check className="w-4 h-4 animate-bounce" />
                             <span>تمت الإضافة ✅</span>
                           </>
                         ) : (
                           <>
                             <Plus className="w-4 h-4" />
                             <span>إضافة لسلتك</span>
                           </>
                         )}
                      </button>
                  </div>
              </div>
           </div>
        )}

        {/* Analysis */}
        <div>
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-sm border border-gray-100 dark:border-gray-600">
            {result.analysis}
          </p>
        </div>

        {/* Guidance */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">توصية جوده</h3>
          <div className={`p-4 rounded-xl text-sm font-medium ${theme.bg} ${theme.titleColor}`}>
            {result.guidance}
          </div>
        </div>

        {/* Medical disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-200">
            الفحص إرشادي ولا يغني عن قراءة الملصق والمكونات أو استشارة الطبيب.
          </p>
        </div>

        {/* Alternatives */}
        {(result.verdict === VerdictType.RISKY || result.verdict === VerdictType.UNSAFE) && result.alternatives && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-50"></div>
             <div className="flex items-start gap-3 relative z-10">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm shrink-0 border border-blue-50 dark:border-blue-900">
                   <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                   <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1.5 flex items-center gap-2">
                      شاهد البديل المتوفر لدينا 🛍️
                   </h3>
                   <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed font-medium">
                      {result.alternatives}
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex gap-2 pt-2">
          {/* 1. Share Text (Copy) */}
          <button
            onClick={handleTextShare}
            disabled={isCopied}
            className={`flex-1 py-3.5 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm ${
              isCopied 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300 cursor-default' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-750 active:scale-95'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>نسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ النص</span>
              </>
            )}
          </button>
          
          {/* 2. Share Image - Outlined Style */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 py-3.5 bg-white text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm active:scale-95"
          >
            <ImageIcon className="w-4 h-4" />
            <span>صورة</span>
          </button>

          {/* 3. Reset (New Scan) - Primary Action */}
          <button
            onClick={onReset}
            className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-100 dark:shadow-none text-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            <span>جديد</span>
          </button>
        </div>
      </div>

      {/* Share as Image Modal */}
      {showShareModal && (
        <ShareModal 
          result={result} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
};
