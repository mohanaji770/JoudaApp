import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ChefHat, Info } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const tabs = [
    { id: 'home', path: '/', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'products', path: '/products', label: 'المتجر', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'recipes', path: '/recipes', label: 'مطبخ جودة', icon: <ChefHat className="w-5 h-5" /> },
    { id: 'about', path: '/about', label: 'من نحن', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <nav aria-label="التصفح الرئيسي" className="fixed bottom-0 left-0 right-0 bg-warm-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 z-40 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all duration-300 ${
                isActive 
                  ? 'text-brand-600 dark:text-brand-500' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 translate-y-[-2px]' : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
