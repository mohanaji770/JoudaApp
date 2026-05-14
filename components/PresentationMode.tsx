
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Smartphone, BrainCircuit, ShoppingBag, Heart, ShieldCheck, Zap, ScanLine, ArrowLeftRight, Camera, CheckCircle, AlertTriangle, ScanBarcode } from 'lucide-react';
import { APP_LOGO, STORE_CONFIG } from '../constants';
import { Scanner } from './Scanner';
import { ResultCard } from './ResultCard';
import { AnalysisResult, VerdictType } from '../types';

interface PresentationModeProps {
  onClose: () => void;
}

// --- Sub-Component: Before/After Slider ---
const CompareSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const position = ((clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.min(100, Math.max(0, position)));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      setIsDragging(true);
      handleMove(e.clientX);
    }
  };

  const handleInteractionEnd = () => setIsDragging(false);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in w-full">
      <h2 className="text-3xl font-black mb-8 text-white text-center drop-shadow-md">الفرق واضح .. والحياة أسهل</h2>
      
      <div 
        ref={containerRef}
        className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl cursor-col-resize select-none border-[6px] border-white/10 ring-1 ring-white/20"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
        onMouseUp={handleInteractionEnd}
        onClick={(e) => handleMove(e.clientX)}
      >
        {/* --- RIGHT IMAGE (BEFORE - The Problem) --- */}
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center select-none">
           {/* Abstract Ingredients Background */}
           <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale blur-sm"></div>
           
           <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 p-4 rounded-2xl animate-pulse">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-red-100">قلق وحيرة</h3>
              </div>
              <div className="bg-black/40 p-4 rounded-xl backdrop-blur-sm max-w-xs border border-white/10">
                 <p className="text-gray-300 font-mono text-xs leading-relaxed text-right dir-rtl">
                    نشا معدل (E1442)؟ <br/>
                    نكهات طبيعية ومماثلة للطبيعة؟ <br/>
                    قد يحتوي على أثر جلوتين؟ <br/>
                    <span className="text-red-400 font-bold">هل هذا آمن لابني؟</span>
                 </p>
              </div>
           </div>
           
           {/* Label top right */}
           <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
              قبل تطبيق جودة ❌
           </div>
        </div>

        {/* --- LEFT IMAGE (AFTER - The Solution) --- */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center overflow-hidden border-r-[3px] border-white shadow-[-10px_0_20px_rgba(0,0,0,0.5)]"
          style={{ width: `${sliderPosition}%` }}
        >
           {/* Fixed content inside resizing container */}
           <div className="absolute inset-0 w-full max-w-lg flex items-center justify-center">
               <div className="relative bg-white rounded-[2rem] shadow-2xl w-64 overflow-hidden transform scale-110">
                  <div className="bg-green-50 p-6 flex flex-col items-center text-center border-b border-green-100">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-black text-green-800 mb-1">آمن 100%</h3>
                      <p className="text-xs font-bold text-green-600 bg-green-200/50 px-2 py-0.5 rounded-full">القرار النهائي</p>
                  </div>
                  <div className="p-4 bg-white text-center">
                     <p className="text-gray-500 text-xs font-medium mb-3">
                        لا داعي للقراءة والتحليل.<br/>
                        جودة قام بالمهمة لأجلك.
                     </p>
                     <button className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-200">
                        إضافة للسلة
                     </button>
                  </div>
               </div>
           </div>

           {/* Label top left */}
           <div className="absolute top-4 left-4 bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
              مع تطبيق جودة ✅
           </div>
        </div>

        {/* --- Slider Handle --- */}
        <div 
            className="absolute top-0 bottom-0 w-1 bg-transparent cursor-col-resize z-20"
            style={{ left: `${sliderPosition}%` }}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] text-brand-600 border-4 border-brand-50 hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-5 h-5" />
            </div>
        </div>
      </div>
      
      <p className={`mt-8 text-white/60 text-sm font-medium transition-opacity duration-500 ${isDragging ? 'opacity-0' : 'opacity-100 animate-bounce'}`}>
        اسحب الدائرة للمقارنة ↔️
      </p>
    </div>
  );
};

// --- Main Presentation Component ---
export const PresentationMode: React.FC<PresentationModeProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Live Demo State
  const [showLiveDemo, setShowLiveDemo] = useState(false);
  const [demoAnalyzing, setDemoAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState<AnalysisResult | null>(null);

  const handleDemoScan = async (base64: string) => {
    setDemoAnalyzing(true);
    // SIMULATE SCAN for Presentation (Guarantees success/speed)
    // In a real scenario, this could use the actual API, but for a pitch, deterministic is better.
    setTimeout(() => {
        setDemoAnalyzing(false);
        setDemoResult({
            verdict: VerdictType.SAFE,
            verdictTitle: "آمن وشهي ✅",
            analysis: "بناءً على الفحص الدقيق، هذا المنتج خالي تماماً من الجلوتين ومشتقاته.",
            guidance: "خيار رائع! هذا المنتج مناسب لنظامك الغذائي.",
            matchedStoreItem: "دقيق شار (Mix B)", // Upsell demo
            timestamp: Date.now(),
            imageUrl: base64
        });
    }, 2500); // 2.5s delay for dramatic effect
  };

  const slides = [
    {
      id: 'intro',
      bg: 'bg-gradient-to-br from-brand-600 to-brand-800',
      text: 'text-white',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
          
          <div className="relative z-10 w-48 h-48 bg-white rounded-[2.5rem] p-4 shadow-2xl animate-scale-in rotate-3 hover:rotate-0 transition-transform duration-500">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain rounded-[2rem]" />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-6xl font-black mb-2 tracking-tight drop-shadow-sm">عالم جودة</h1>
            <p className="text-3xl font-light opacity-90 tracking-widest uppercase">Jouda World</p>
          </div>
          
          <div className="relative z-10 max-w-lg mx-auto border-t border-white/20 pt-8 mt-4">
            <p className="text-2xl font-bold leading-relaxed text-brand-50">
              أول مساعد ذكي وشامل لحياة خالية من الجلوتين.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'comparison',
      bg: 'bg-gray-900',
      text: 'text-white',
      content: <CompareSlider />
    },
    {
      id: 'demo',
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      content: (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in relative w-full">
          {!showLiveDemo ? (
            <>
               <div 
                 onClick={() => setShowLiveDemo(true)}
                 className="w-72 h-auto aspect-[9/18] bg-white border-[8px] border-gray-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col mb-10 cursor-pointer hover:scale-105 hover:-translate-y-2 transition-all duration-500 group ring-4 ring-gray-200"
               >
                  {/* Mock UI inside phone */}
                  <div className="bg-brand-600 h-20 w-full shrink-0 flex items-end justify-center pb-3 shadow-md relative z-10">
                     <span className="text-white font-bold text-lg">عالم جودة</span>
                  </div>
                  <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center justify-center gap-4 relative">
                     <div className="absolute inset-0 bg-gray-200/50 animate-pulse"></div>
                     <ScanBarcode className="w-24 h-24 text-gray-300 relative z-10" />
                     <div className="px-4 py-2 bg-white rounded-full shadow-sm text-xs font-bold text-gray-400 relative z-10">
                        اضغط لبدء الفحص
                     </div>
                  </div>
                  
                  {/* Floating Action Button Mock */}
                  <div className="absolute bottom-6 right-6 w-14 h-14 bg-brand-600 rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-white" />
                  </div>
               </div>
               
               <h2 className="text-4xl font-black mb-3 text-brand-600">تجربة حية</h2>
               <p className="text-gray-500 font-medium mb-8 text-lg max-w-sm">
                 لا نكتفي بالصور.. شاهد كيف يعمل الذكاء الاصطناعي في الوقت الفعلي.
               </p>
               
               <button 
                 onClick={() => setShowLiveDemo(true)}
                 className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-gray-300 hover:bg-black hover:scale-105 transition-all flex items-center gap-3 text-lg"
               >
                 <Smartphone className="w-6 h-6" />
                 <span>تشغيل الديمو</span>
               </button>
            </>
          ) : (
             <div className="absolute inset-0 z-50 bg-gray-100/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                 {/* PHONE FRAME */}
                 <div className="w-full max-w-[380px] h-[85vh] bg-white rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden flex flex-col relative ring-4 ring-black/10 animate-slide-up">
                     
                     {/* Status Bar Mock */}
                     <div className="h-7 bg-gray-900 w-full shrink-0 flex items-center justify-between px-6">
                        <div className="text-[10px] text-white font-bold">{new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="flex gap-1">
                           <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
                           <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
                           <div className="w-3 h-3 bg-white rounded-full opacity-40"></div>
                        </div>
                     </div>

                     {/* App Header */}
                     <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shrink-0 z-20 shadow-sm">
                        <span className="font-bold text-gray-800">فحص المنتجات</span>
                        <button onClick={() => { setShowLiveDemo(false); setDemoResult(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <X className="w-5 h-5"/>
                        </button>
                     </div>
                     
                     {/* App Content */}
                     <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scrollbar-hide">
                        {!demoResult ? (
                            <div className="animate-fade-in h-full flex flex-col justify-center">
                                <Scanner 
                                    isAnalyzing={demoAnalyzing} 
                                    onImageSelected={handleDemoScan} 
                                    onTextSearch={() => {}} 
                                />
                                <p className="text-center text-xs text-gray-400 mt-4">
                                    * وضع المحاكاة للعرض التقديمي
                                </p>
                            </div>
                        ) : (
                            <div className="animate-slide-up pb-20">
                                <ResultCard result={demoResult} onReset={() => setDemoResult(null)} />
                            </div>
                        )}
                     </div>

                     {/* Home Indicator */}
                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-300 rounded-full"></div>
                 </div>

                 <button 
                    onClick={() => setShowLiveDemo(false)}
                    className="mt-6 text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors bg-white px-6 py-2 rounded-full shadow-sm"
                 >
                    <X className="w-4 h-4" />
                    <span>إنهاء العرض التجريبي</span>
                 </button>
             </div>
          )}
        </div>
      )
    },
    {
      id: 'vision',
      bg: 'bg-black',
      text: 'text-white',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
             <Zap className="w-12 h-12 text-yellow-400" />
          </div>
          <h2 className="text-5xl font-bold mb-8 tracking-tight">الرؤية</h2>
          <p className="text-3xl font-light leading-relaxed max-w-2xl text-gray-300">
            "أن نجعل حياة مرضى حساسية القمح <br/>
            <span className="text-white font-bold">طبيعية، آمنة، ومليئة بالخيارات.</span>"
          </p>
          <div className="mt-16 pt-8 border-t border-white/10 w-full max-w-sm">
            <p className="font-bold text-brand-500 text-xl">{STORE_CONFIG.NAME}</p>
            <p className="text-sm text-gray-500 mt-2">شريكك الغذائي الأول</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (showLiveDemo) return;
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (showLiveDemo) return;
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLiveDemo) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === ' ') {
         nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
         prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, showLiveDemo]);

  return (
    <div className="fixed inset-0 z-[200] bg-black font-sans overflow-hidden">
      {/* Slide Container */}
      <div 
        className={`w-full h-full transition-colors duration-700 ease-in-out ${slides[currentSlide].bg} ${slides[currentSlide].text}`}
        onClick={nextSlide}
      >
        <div className="w-full h-full max-w-4xl mx-auto relative flex items-center justify-center">
           {slides[currentSlide].content}
        </div>
      </div>

      {/* Controls Overlay - Hidden during Live Demo */}
      {!showLiveDemo && (
        <>
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-50">
                <div className="bg-black/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest pointer-events-auto border border-white/10">
                    SLIDE {currentSlide + 1} / {slides.length}
                </div>
                <button 
                    onClick={onClose}
                    className="bg-black/20 hover:bg-red-500/80 backdrop-blur-md p-3 rounded-full text-white transition-colors pointer-events-auto border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between items-center pointer-events-none max-w-4xl mx-auto z-50">
                <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    disabled={currentSlide === 0}
                    className={`p-4 rounded-full backdrop-blur-md pointer-events-auto transition-all border border-white/10 ${currentSlide === 0 ? 'opacity-0 cursor-default' : 'bg-black/20 text-white hover:bg-white/20 hover:scale-110'}`}
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                <div className="flex gap-3">
                    {slides.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-500 shadow-sm ${idx === currentSlide ? 'w-12 bg-white' : 'w-2 bg-white/30'}`}
                        />
                    ))}
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    disabled={currentSlide === slides.length - 1}
                    className={`p-4 rounded-full backdrop-blur-md pointer-events-auto transition-all border border-white/10 ${currentSlide === slides.length - 1 ? 'opacity-0 cursor-default' : 'bg-black/20 text-white hover:bg-white/20 hover:scale-110'}`}
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            </div>
        </>
      )}
    </div>
  );
};
