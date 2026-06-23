import React, { useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { X, Share2, CheckCircle, AlertTriangle, XCircle, Leaf, ScanLine, BadgeCheck } from 'lucide-react';
import { AnalysisResult, VerdictType } from '../../types';

import { useBackButton } from '../../hooks';

interface ShareModalProps {
  result: AnalysisResult;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ result, onClose }) => {
  // Handle android back button
  useBackButton(true, onClose);

  const captureRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic Theme (100% html-to-image safe without problematic blur filters)
  const getTheme = (verdict: VerdictType) => {
    switch (verdict) {
      case VerdictType.SAFE:
        return {
          gradient: 'from-emerald-500 to-green-700',
          cardBg: 'bg-black/20 border-white/15 text-white',
          badgeBg: 'bg-white text-emerald-700 border-emerald-200',
          icon: <CheckCircle className="w-16 h-16 text-white filter drop-shadow-lg" />,
          label: 'آمن تماماً ✅'
        };
      case VerdictType.RISKY:
        return {
          gradient: 'from-amber-500 to-orange-600',
          cardBg: 'bg-black/20 border-white/15 text-white',
          badgeBg: 'bg-white text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-16 h-16 text-white filter drop-shadow-lg" />,
          label: 'مشكوك فيه ⚠️'
        };
      case VerdictType.UNSAFE:
        return {
          gradient: 'from-red-500 to-rose-700',
          cardBg: 'bg-black/20 border-white/15 text-white',
          badgeBg: 'bg-white text-red-700 border-red-200',
          icon: <XCircle className="w-16 h-16 text-white filter drop-shadow-lg" />,
          label: 'خطر غير آمن 🚫'
        };
      default:
        return {
          gradient: 'from-gray-600 to-slate-800',
          cardBg: 'bg-black/20 border-white/15 text-white',
          badgeBg: 'bg-white text-gray-700 border-gray-200',
          icon: <ScanLine className="w-16 h-16 text-white filter drop-shadow-lg" />,
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
      await new Promise(resolve => setTimeout(resolve, 150));

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
          <h3 className="font-bold text-lg">معاينة بطاقة الفحص</h3>
          <button 
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CAPTURE AREA (9:16 Aspect Ratio for Stories) */}
        <div className="relative w-full aspect-[9/16] shadow-2xl rounded-none overflow-hidden mx-auto bg-gray-900 flex flex-col justify-between border border-white/20" ref={captureRef}>
            
            {/* Clean Background Gradient (100% html-to-image safe) */}
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.gradient} pointer-events-none`}></div>
            
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')] pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col p-6 text-white justify-between">
                
                {/* App Header */}
                <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-2 rounded-xl shadow-md text-emerald-600 flex items-center justify-center">
                            <Leaf className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-lg tracking-tight text-white leading-none mb-1">جوده | Jouda</h2>
                            <span className="text-[9px] font-bold text-white/80 tracking-wider uppercase block">Gluten-Free Scanner</span>
                        </div>
                    </div>
                    <div className="bg-black/20 px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-white shadow-inner">
                        {new Date(result.timestamp).toLocaleDateString('ar-SA')}
                    </div>
                </div>

                {/* Main Showcase Area */}
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 my-auto py-2">
                    
                    {/* Product Showcase Card */}
                    <div className="w-48 h-48 rounded-3xl bg-white p-1.5 shadow-2xl border-4 border-white/40 flex items-center justify-center overflow-hidden relative mx-auto">
                         {result.imageUrl ? (
                            <img 
                                src={`data:image/jpeg;base64,${result.imageUrl}`} 
                                alt="Product" 
                                loading="lazy"
                                className="w-full h-full object-cover rounded-2xl"
                                crossOrigin="anonymous"
                            />
                         ) : (
                            <div className="p-8 opacity-90">
                               {theme.icon}
                            </div>
                         )}
                    </div>
                    
                    {/* Status Badge (Cleanly overlapping product card bottom) */}
                    <div className={`-mt-6 relative z-10 mx-auto px-6 py-2 rounded-full shadow-xl ${theme.badgeBg} border-2 flex items-center gap-2 font-black text-lg w-fit`}>
                        <span>{theme.label}</span>
                    </div>

                    {/* Verdict Title */}
                    <h1 className="text-2xl md:text-3xl font-black leading-tight drop-shadow-lg text-white mt-2 px-2">
                        {result.verdictTitle.replace(/✅|🚫|⚠️/g, '').trim()}
                    </h1>
                    
                    {/* Clean Advice Box (No backdrop-blur to prevent html-to-image bugs) */}
                    <div className={`w-full ${theme.cardBg} p-4 rounded-2xl border shadow-xl text-right relative overflow-hidden mt-1`}>
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-white/40"></div>
                        <p className="text-xs md:text-sm font-semibold leading-relaxed text-white/95 line-clamp-4">
                            {result.guidance}
                        </p>
                    </div>
                </div>

                {/* Bottom VIP Ticket (Footer) */}
                <div className="bg-white rounded-2xl p-3.5 shadow-2xl text-gray-900 flex items-center justify-between gap-3 mt-auto border border-gray-100 relative overflow-hidden">
                    <div className="flex-1 min-w-0 text-right space-y-1">
                        <div className="flex items-center gap-1.5">
                           <div className="bg-emerald-600 text-white p-1 rounded shadow-sm flex items-center justify-center">
                              <ScanLine className="w-3.5 h-3.5" />
                           </div>
                           <h4 className="font-black text-sm text-gray-900">حمل تطبيق جوده</h4>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 leading-tight">
                             افحص طعامك وتأكد من خلوه من الجلوتين في ثوانٍ.
                        </p>
                        
                        {result.matchedStoreItem && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold w-fit border border-emerald-100 shadow-sm">
                                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                                متوفر في متجر جوده
                            </div>
                        )}
                    </div>
                    
                    {/* QR Code Container */}
                    <div className="shrink-0 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner flex flex-col items-center justify-center">
                        <img 
                            src={qrCodeUrl} 
                            alt="QR Code" 
                            loading="lazy"
                            className="w-14 h-14 mix-blend-multiply"
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
          className="w-full bg-white text-gray-900 hover:bg-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] text-lg mt-2 border border-gray-100"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span>جاري تحضير الصورة عالية الدقة...</span>
            </div>
          ) : (
            <>
              <Share2 className="w-6 h-6" />
              <span>مشاركة بطاقة الفحص</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};