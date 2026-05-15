import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { CartDrawer } from './CartDrawer';
import { CartFloatingButton } from './CartFloatingButton';
import { InstallPrompt } from './InstallPrompt';
import { useCart } from '../contexts/CartContext';

interface LayoutProps {
  children: ReactNode;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onHelpClick: () => void;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, toggleDarkMode, onHelpClick, isAdmin, onAdminLogout }) => {
  const { lastAddedItem } = useCart();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-gray-900 transition-colors duration-300 flex font-sans">
      <InstallPrompt />

      {/* DESKTOP SIDEBAR */}
      <Sidebar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
          onHelpClick={onHelpClick}
          isAdmin={isAdmin}
          onAdminLogout={onAdminLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col mb-24 md:mb-0">
          {children}
        </main>
        
        {/* GLOBAL TOAST NOTIFICATION */}
        {lastAddedItem && (
          <div aria-live="polite" className="fixed bottom-32 md:bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 dark:bg-white/90 backdrop-blur text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-slide-up-fade w-max max-w-[90%]">
             <div className="bg-green-500 p-1 rounded-full shrink-0">
               <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <span className="text-sm font-bold truncate">تمت إضافة &quot;{lastAddedItem}&quot;</span>
          </div>
        )}

        {/* Floating Cart Button (Mobile only) */}
        <div className="md:hidden">
            <CartFloatingButton />
        </div>

        <CartDrawer />
        
        {/* MOBILE BOTTOM NAV */}
        <BottomNav />
      </div>
    </div>
  );
};
