import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const installPromptEnabled = false;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [promptType, setPromptType] = useState<'android' | 'ios' | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!installPromptEnabled) return;

    const handleShowIOSGuide = () => {
      setPromptType('ios');
      setShowBanner(true);
    };

    window.addEventListener('show-ios-install-guide', handleShowIOSGuide);
    return () => window.removeEventListener('show-ios-install-guide', handleShowIOSGuide);
  }, []);

  useEffect(() => {
    if (!installPromptEnabled) return;

    // 1. Check if already running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // 2. Detect iOS device
    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (checkIsIOS) {
      // Check if user previously dismissed the iOS guide
      const isDismissed = localStorage.getItem('jouda_ios_prompt_dismissed_v1');
      if (!isDismissed) {
        // Show iOS prompt after a short delay (e.g., 3 seconds) for a smoother entry
        const timer = setTimeout(() => {
          setPromptType('ios');
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 3. Android / Chrome / Desktop detection (BeforeInstallPromptEvent)
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
      setPromptType('android');
      setShowBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptType('android');
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the native browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user selection
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
      (window as any).deferredInstallPrompt = null;
    }
    
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowBanner(false);
    if (promptType === 'ios') {
      localStorage.setItem('jouda_ios_prompt_dismissed_v1', 'true');
    }
  };

  if (!showBanner) return null;

  // iOS Safari Install Guide Layout
  if (promptType === 'ios') {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-[90] animate-slide-up-fade">
        <div className="bg-white/95 dark:bg-gray-900/95 text-gray-800 dark:text-white backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-gray-150 dark:border-gray-800 relative flex flex-col gap-3">
          
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-3 left-3 p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95"
            aria-label="إغلاق"
          >
            <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 ml-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/20">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">تثبيت تطبيق جوده على الآيفون</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">تابع طلباتك واستمتع بتصفح أسرع</p>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl space-y-2.5 text-[11px] font-bold text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
              <span className="flex items-center gap-1.5 flex-wrap">
                اضغط على زر المشاركة في سفاري
                <span className="p-1 bg-white dark:bg-gray-750 rounded border border-gray-200 dark:border-gray-750 inline-flex items-center justify-center shadow-sm">
                  <svg className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h10a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 8.25l3-3m0 0l3 3m-3-3V15" />
                  </svg>
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
              <span>اختر <b>&quot;إضافة إلى الصفحة الرئيسية&quot;</b> ➕</span>
            </div>
          </div>
          
          {/* Pointer Triangle pointing to Safari bottom toolbar */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white dark:border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  // Android / Chrome Install Banner Layout
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down">
      <div className="bg-gray-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">حمل تطبيق جوده</h3>
            <p className="text-[10px] text-gray-300 truncate">تجربة أسرع ومزايا أكثر في جيبك</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-white text-brand-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm"
          >
            <Download className="w-3 h-3" />
            <span>تثبيت</span>
          </button>
          
          <button 
            onClick={handleClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

      </div>
    </div>
  );
};
