import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, ChefHat, ClipboardList, Info, LayoutDashboard } from 'lucide-react';
import { APP_LOGO, STORE_CONFIG } from '../constants';

interface SidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, toggleDarkMode }) => {
  const location = useLocation();
  
  const tabs = [
    { id: 'home', path: '/', label: 'الرئيسية', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'products', path: '/products', label: 'المتجر', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'recipes', path: '/recipes', label: 'مطبخ جودة', icon: <ChefHat className="w-5 h-5" /> },
    { id: 'orders', path: '/orders', label: 'طلباتي', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'about', path: '/about', label: 'من نحن', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-warm-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 transition-colors duration-300 z-50">
      {/* Brand Area */}
      <div className="p-8 flex flex-col items-center border-b border-gray-50 dark:border-gray-800">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg shadow-red-100 dark:shadow-none p-1 border border-gray-100 dark:border-gray-700 mb-4 overflow-hidden">
          <img src={APP_LOGO} alt="Jouda Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{STORE_CONFIG.NAME}</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1">أسلوب حياة متكامل</p>
      </div>

      {/* Navigation */}
      <nav aria-label="التصفح الرئيسي" className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-gray-400 px-4 mb-2 uppercase tracking-wider">القائمة</div>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-brand-900/40' : 'bg-transparent'}`}>
                {tab.icon}
              </div>
              <span className="font-bold text-sm">{tab.label}</span>
              {isActive && (
                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-gray-50 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold">
                J
            </div>
            <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">ضيف جودة</p>
                <p className="text-xs text-gray-400 truncate">مرحباً بك</p>
            </div>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-4 font-mono">
            Jouda App v2.0 (Desktop)
        </p>
      </div>
    </aside>
  );
};
