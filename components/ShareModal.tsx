import React, { useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { X, Share2, CheckCircle, AlertTriangle, XCircle, Leaf, ScanLine, BadgeCheck } from 'lucide-react';
import { AnalysisResult, VerdictType } from '../types';

interface ShareModalProps {
  result: AnalysisResult;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ result, onClose }) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic Theme based on Verdict
  const getTheme = (verdict: VerdictType) => {
    switch (verdict) {
      case VerdictType.SAFE:
        return {
          gradient: 'from-emerald-500 to-green-700',
          icon: <CheckCircle className="w-full h-full text-emerald-600" />,
          stamp: 'border-emerald-200 text-emerald-100 bg-emerald-800/30',
          footerText: 'text-emerald-800',
          label: 'آمن ✅'
        };
      case VerdictType.RISKY:
        return {
          gradient: 'from-amber-400 to-orange-600',
          icon: <AlertTriangle className="w-full h-full text-amber-600" />,
          stamp: 'border-amber-200 text-amber-100 bg-amber-800/30',
          footerText: 'text-orange-800',
          label: 'مشكوك ⚠️'
        };
      case VerdictType.UNSAFE:
        return {
          gradient: 'from-red-500 to-rose-700',
          icon: <XCircle className="w-full h-full text-red-600" />,
          stamp: 'border-red-200 text-red-100 bg-red-800/30',
          footerText: 'text-red-800',
          label: 'خطر 🚫'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-700',
          icon: <ScanLine className="w-full h-full text-gray-600" />,
          stamp: 'border-gray-200 text-gray-100 bg-gray-800/30',
          footerText: 'text-gray-800',
          label: 'غير محدد'
        };
    }
  };

  const theme = getTheme(result.verdict);
  const appUrl = 'https://jouda.vercel.app';
  // QR Code API (Simple & Reliable)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(appUrl)}`;

  const handleShare = async () => {
    if (!captureRef.current) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure images are loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate High-Res Blob
      const blob = await toBlob(captureRef.current, { 
        cacheBust: true, 
        pixelRatio: 2, 
        style: { borderRadius: '0px' },
        // Filter out link tags to prevent "Error loading remote css"
        filter: (node) => {
            return (node.tagName !== 'LINK');
        }
      });

      if (!blob) throw new Error('Failed to generate image');

      const file = new File([blob], 'jouda-scan-result.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: result.verdictTitle,
          text: result.analysis,
        });
      } else {
        const link = document.createElement('a');
        link.download = 'jouda-scan-result.png';
        link.href = URL.createObjectURL(blob);
        link.click();
      }
      
      // Optional: Close after share
      // onClose(); 
    } catch (err) {
      console.error('Error sharing image:', err);
      alert('عذراً، حدث خطأ أثناء إنشاء الصورة.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col gap-4 my-auto">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center text-white px-2">
          <h3 className="font-bold text-lg">معاينة الصورة</h3>
          <button 
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CAPTURE AREA (9:16 Aspect Ratio for Stories) */}
        <div className="relative w-full aspect-[9/16] shadow-2xl rounded-none overflow-hidden mx-auto bg-gray-900" ref={captureRef}>
            
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}></div>
            
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col px-6 pt-8 pb-6 text-white justify-between">
                
                {/* App Header */}
                <div className="flex items-center justify-center gap-2 opacity-90 mb-2">
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                        <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight">جودة | Jouda</span>
                </div>

                {/* Main Result Area */}
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 -mt-6">
                    
                    {/* Product Image with Ring */}
                    <div className="relative">
                        <div className="w-44 h-44 rounded-full border-[3px] border-white/40 shadow-2xl bg-white flex items-center justify-center overflow-hidden p-1">
                             {result.imageUrl ? (
                                <img 
                                    src={`data:image/jpeg;base64,${result.imageUrl}`} 
                                    alt="Product" 
                                    loading="lazy"
                                    className="w-full h-full object-cover rounded-full"
                                    crossOrigin="anonymous"
                                />
                             ) : (
                                <div className="p-10 opacity-50">
                                   {theme.icon}
                                </div>
                             )}
                        </div>
                        
                        {/* Stamp Effect */}
                        <div className={`absolute -bottom-3 -right-3 px-4 py-1.5 border-[3px] ${theme.stamp} rounded-xl transform -rotate-6 shadow-lg backdrop-blur-md bg-black/20`}>
                            <span className="text-xl font-black uppercase tracking-widest text-white drop-shadow-sm">{theme.label}</span>
                        </div>
                    </div>

                    {/* Verdict Title */}
                    <div className="space-y-1 mt-4">
                        <h1 className="text-2xl font-black leading-tight drop-shadow-md max-w-[250px] mx-auto">
                            {result.verdictTitle.replace(/✅|🚫|⚠️/g, '').trim()}
                        </h1>
                        <p className="text-xs font-bold text-white/80 bg-black/10 px-3 py-1 rounded-full inline-block backdrop-blur-sm border border-white/10 mt-2">
                            {new Date(result.timestamp).toLocaleDateString('ar-SA')}
                        </p>
                    </div>
                    
                    {/* Mini Advice - Shorter and clearer */}
                    <p className="text-xs text-white/95 font-medium leading-relaxed line-clamp-3 max-w-[90%] bg-black/10 p-3 rounded-xl border border-white/10">
                        {result.guidance}
                    </p>
                </div>

                {/* Bottom White Card (Footer) - Compact Version */}
                <div className="mt-auto bg-white rounded-2xl p-3 shadow-xl text-gray-900 flex items-center justify-between gap-3 mx-1 mb-1">
                    <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-1.5 mb-1">
                           <div className="bg-gray-900 text-white p-1 rounded">
                              <ScanLine className="w-3 h-3" />
                           </div>
                           <p className="font-black text-sm">حمل تطبيق جودة</p>
                        </div>
                        <p className={`text-[10px] font-bold leading-tight text-gray-500`}>
                             افحص طعامك وتأكد من سلامته في ثوانٍ.
                        </p>
                        
                        {result.matchedStoreItem && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold w-fit border border-green-100">
                                <BadgeCheck className="w-3 h-3" />
                                متوفر في المتجر
                            </div>
                        )}
                    </div>
                    
                    {/* QR Code - Smaller */}
                    <div className="shrink-0 bg-white p-0.5 rounded-lg border border-gray-100">
                        <img 
                            src={qrCodeUrl} 
                            alt="QR Code" 
                            loading="lazy"
                            className="w-16 h-16 mix-blend-multiply"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>

            </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full bg-white text-gray-900 hover:bg-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] text-lg"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span>جاري تحضير الصورة...</span>
            </div>
          ) : (
            <>
              <Share2 className="w-6 h-6" />
              <span>مشاركة النتيجة</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};