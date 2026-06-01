import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { setIsCartOpen, totalItems } = useCart();
  
  const tabs = [
    { id: 'home', path: '/', label: 'الرئيسية', icon: <Home className="w-[22px] h-[22px]" /> },
    { id: 'products', path: '/products', label: 'الأقسام', icon: <LayoutGrid className="w-[22px] h-[22px]" /> },
    { id: 'cart', isCart: true, label: 'السلة', icon: <ShoppingBag className="w-6 h-6 text-white" /> },
    { id: 'orders', path: '/orders', label: 'طلباتي', icon: <ClipboardList className="w-[22px] h-[22px]" /> },
    { id: 'about', path: '/about', label: 'حسابي', icon: <User className="w-[22px] h-[22px]" /> },
  ];

  return (
    <nav aria-label="التصفح الرئيسي" className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom md:hidden pointer-events-none">
      <div className="bg-white dark:bg-gray-900 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] dark:shadow-none border-t border-gray-100 dark:border-gray-800 rounded-t-[1.5rem] pointer-events-auto px-2 pb-2 pt-1 relative">
        <div className="max-w-md mx-auto flex items-end justify-between relative">
          {tabs.map((tab) => {
            if (tab.isCart) {
              return (
                <div key={tab.id} className="relative flex flex-col items-center justify-center -translate-y-4 z-50">
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-900 shadow-[0_8px_20px_rgba(211,47,47,0.35)] text-white hover:scale-105 active:scale-95 transition-all relative"
                    aria-label="فتح سلة المشتريات"
                  >
                    {tab.icon}
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm animate-bounce-short">
                        {totalItems}
                      </span>
                    )}
                  </button>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">
                    {tab.label}
                  </span>
                </div>
              );
            }

            const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path!));
            return (
              <NavLink
                key={tab.id}
                to={tab.path!}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center w-16 py-2 gap-1.5 transition-all duration-300 ${
                  isActive 
                    ? 'text-brand-600 dark:text-brand-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <div className={`transition-all ${isActive ? 'translate-y-[-2px]' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                  {tab.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
