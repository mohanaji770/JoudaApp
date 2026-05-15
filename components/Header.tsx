
import React from 'react';
import { ShoppingBag, Moon, Sun, HelpCircle, Shield, LogOut } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { APP_LOGO } from '../constants';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  onHelpClick?: () => void;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, onHelpClick, isAdmin, onAdminLogout }) => {
  const { setIsCartOpen, totalItems } = useCart();

  return (
    <header className="bg-warm-white dark:bg-gray-900 sticky top-0 z-40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Branding: Jouda Logo Style - Hidden on Desktop (shown in Sidebar) */}
        <div className="flex items-center gap-3 md:hidden">
           <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md shadow-red-100 dark:shadow-none relative overflow-hidden bg-white border border-gray-100 dark:border-gray-800">
             <img src={APP_LOGO} alt="Jouda Logo" className="w-full h-full object-cover" />
           </div>
           <div className="flex flex-col justify-center">
             <span className="text-xl font-black text-brand-600 leading-none tracking-tight">عالم جودة</span>
             <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wide mt-0.5">أسلوب حياة متكامل</span>
           </div>
        </div>

        {/* Empty placeholder for Desktop alignment if needed, or breadcrumbs */}
        <div className="hidden md:block text-sm font-bold text-gray-400">
           {/* Future Breadcrumbs or Title */}
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Badge */}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-brand-600 text-white px-2 py-1 rounded-lg">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">مشرف</span>
              {onAdminLogout && (
                <button
                  onClick={onAdminLogout}
                  className="mr-1 p-0.5 hover:bg-white/20 rounded transition-colors"
                  title="تسجيل خروج"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

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
            <span className="hidden md:inline text-xs font-bold">السلة</span>
          </button>
        </div>
        
      </div>
    </header>
  );
};
