import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, LogOut, 
  Gift, Image as ImageIcon, ChefHat, BookOpen, Shield, HelpCircle, Settings, Activity, PackageSearch
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'الرئيسية', icon: <Activity className="w-5 h-5" />, path: '/admin/overview' },
  { id: 'products', label: 'خصائص المنتجات', icon: <PackageSearch className="w-5 h-5" />, path: '/admin/products' },
  { id: 'packages', label: 'الباكجات', icon: <Gift className="w-5 h-5" />, path: '/admin/packages' },
  { id: 'banners', label: 'البانرات', icon: <ImageIcon className="w-5 h-5" />, path: '/admin/banners' },
  { id: 'recipes', label: 'الوصفات', icon: <ChefHat className="w-5 h-5" />, path: '/admin/recipes' },
  { id: 'articles', label: 'المقالات', icon: <BookOpen className="w-5 h-5" />, path: '/admin/articles' },
  { id: 'faq', label: 'الأسئلة الشائعة', icon: <HelpCircle className="w-5 h-5" />, path: '/admin/faq' },
  { id: 'settings', label: 'إعدادات النظام', icon: <Settings className="w-5 h-5" />, path: '/admin/settings' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row text-right" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-brand-50 dark:bg-brand-900/30 p-2 rounded-xl">
            <Shield className="w-5 h-5 text-brand-600" />
          </div>
          <span className="font-black text-gray-900 dark:text-white text-sm">الإدارة</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 right-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 dark:bg-brand-900/30 p-2.5 rounded-xl">
              <Shield className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-sm">لوحة التحكم</h2>
              <p className="text-[10px] text-gray-500 font-bold">إدارة النظام</p>
            </div>
          </div>
          <button 
            className="md:hidden p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.path) || (currentPath === '/admin' && item.id === 'overview');
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-gray-900 text-white dark:bg-brand-600 shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
