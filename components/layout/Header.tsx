
import React from 'react';
import { ShoppingBag, Moon, Sun, HelpCircle, Shield, LogOut, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { APP_LOGO } from '../../constants';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  onHelpClick?: () => void;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, onHelpClick, isAdmin, onAdminLogout, onLogoClick }) => {
  const { setIsCartOpen, totalItems } = useCart();

  const [clickCount, setClickCount] = React.useState(0);
  const [lastClickTime, setLastClickTime] = React.useState(0);

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
             <span className="text-xl font-black text-brand-600 leading-none tracking-tight">عالم جودة</span>
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

          {/* Search Button */}
          <Link 
            to="/products"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="بحث"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Help Button */}
          {onHelpClick && (
            <button 
              onClick={onHelpClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors"
              aria-label="مساعدة"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}

          {/* Dark Mode Toggle */}
          {toggleDarkMode && (
            <button 
              onClick={toggleDarkMode}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="تبديل الوضع الداكن"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {/* Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            aria-label={`السلة (${totalItems})`}
            className="flex items-center gap-2 bg-gray-900 dark:bg-brand-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-gray-200 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 group relative"
          >
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border border-white dark:border-gray-900 px-0.5">
                {totalItems}
              </span>
            )}
            <ShoppingBag className="w-4 h-4 group-hover:text-white transition-colors" />
          </button>
        </div>
        
      </div>
    </header>
  );
};
