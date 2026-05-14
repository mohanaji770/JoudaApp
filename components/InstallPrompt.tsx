
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    
    // Clear the prompt variable, it can only be used once
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down">
      <div className="bg-gray-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">حمل تطبيق جودة</h3>
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
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

      </div>
    </div>
  );
};
