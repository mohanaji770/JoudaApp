import React, { useState } from 'react';
import { Moon, Sun, HelpCircle, Shield, LogOut, Download, MessageSquare, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_LOGO } from '../../constants';
import { SuggestionModal } from '../modals/SuggestionModal';
import { useCart } from '../../contexts/CartContext';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  onHelpClick?: () => void;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, onHelpClick, isAdmin, onAdminLogout, onLogoClick }) => {
  const installPromptEnabled = false;
  const { setIsCartOpen, totalItems } = useCart();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  React.useEffect(() => {
    // Check if standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already captured in window
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handler = (e: Event) => {
      setDeferredPrompt(e);
    };

    const installHandler = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);
      if (nextCount >= 5) {
        if (onLogoClick) onLogoClick();
        setClickCount(0);
      }
    }
    setLastClickTime(now);
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      window.dispatchEvent(new Event('show-ios-install-guide'));
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredInstallPrompt = null;
        setDeferredPrompt(null);
      }
    }
  };

  const showInstallButton = installPromptEnabled && !isStandalone && (isIOS || !!deferredPrompt);

  return (
    <header className="bg-warm-white dark:bg-gray-900 sticky top-0 z-40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-colors duration-300">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        
        {/* Branding: Jouda Logo Style */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none active:scale-[0.98] transition-transform"
        >
           <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md shadow-red-100 dark:shadow-none relative overflow-hidden bg-white border border-gray-100 dark:border-gray-800">
              <img src={APP_LOGO} alt="Jouda Logo" className="w-full h-full object-cover" />
           </div>
           <div className="flex flex-col justify-center">
             <span className="text-xl font-black text-brand-600 leading-none tracking-tight">عالم جوده</span>
             <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wide mt-0.5">أسلوب حياة متكامل</span>
           </div>
        </div>


        <div className="flex items-center gap-2">
          {/* Admin Badge */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <Link 
                to="/admin" 
                className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>لوحة التحكم</span>
              </Link>
              {onAdminLogout && (
                <button
                  onClick={onAdminLogout}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 rounded-lg transition-colors border border-gray-250 dark:border-gray-700"
                  title="تسجيل خروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Install Button */}
          {showInstallButton && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl text-xs font-black transition-all border border-brand-100/50 dark:border-brand-900/10 active:scale-95"
              title="تثبيت التطبيق"
            >
              <Download className="w-3.5 h-3.5 animate-bounce-subtle" />
              <span>تثبيت</span>
            </button>
          )}

          {/* Suggestion Button */}
          <button 
            onClick={() => setIsSuggestionModalOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-950/20 text-red-550 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
            title="شاركنا اقتراحك"
            aria-label="شاركنا اقتراحك"
          >
            <MessageSquare className="w-5 h-5 text-red-500" />
          </button>

          {/* Help Button */}
          {onHelpClick && (
            <button 
              onClick={onHelpClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-950/20 text-red-550 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
              aria-label="مساعدة"
            >
              <HelpCircle className="w-5 h-5 text-red-500" />
            </button>
          )}

          {/* Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors relative font-black text-xs shadow-sm shadow-brand-700/20 active:scale-95"
            title="فتح سلتك"
            aria-label="سلتك"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            <span>سلتك</span>
            {totalItems > 0 && (
              <span className="bg-white text-brand-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm leading-none shrink-0">
                {totalItems}
              </span>
            )}
          </button>

        </div>
        
      </div>

      {isSuggestionModalOpen && (
        <SuggestionModal onClose={() => setIsSuggestionModalOpen(false)} />
      )}
    </header>
  );
};
