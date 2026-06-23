import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Wrench, Clock, Shield } from 'lucide-react';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { HomePage } from './pages/HomePage';
import { ProductsPageRoute } from './pages/ProductsPageRoute';
import { RecipesPageRoute } from './pages/RecipesPageRoute';
import { ArticlesPageRoute } from './pages/ArticlesPageRoute';
import { AboutPageRoute } from './pages/AboutPageRoute';
import { OrdersPage } from './pages/OrdersPage';
import { Onboarding } from './components/ui/Onboarding';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { useScrollToTop, useLocalStorage, handleBackButton } from './hooks';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SyncProvider } from './contexts/SyncContext';
import { supabase } from './services/supabaseClient';
import { AdminLayout } from './components/admin/AdminLayout';

const ONBOARDING_KEY = 'jouda_onboarding_seen_v1';

const MaintenancePage: React.FC<{ message: string; onSecretClick: () => void }> = ({ message, onSecretClick }) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleWrenchClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    setLastClickTime(now);

    if (clickCount >= 2) {
      onSecretClick();
      setClickCount(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div 
          onClick={handleWrenchClick}
          className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 cursor-pointer select-none active:scale-95 transition-transform"
          title=""
        >
          <Wrench className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">
          تحت الصيانة
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Clock className="w-4 h-4" />
          <span>نحاول العودة في أسرع وقت</span>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showExitToast, setShowExitToast] = useState(false);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcut: Ctrl+Shift+A to open admin login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        navigate('/admin/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Check maintenance mode on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings_public')
          .select('maintenance_mode, maintenance_message')
          .eq('id', 1)
          .single();

        if (!error && data) {
          setMaintenanceMode(data.maintenance_mode || false);
          setMaintenanceMessage(data.maintenance_message || '');
        }
      } catch (e) {
        console.error('Failed to check maintenance mode:', e);
      } finally {
        setCheckingMaintenance(false);
      }
    };

    checkMaintenance();

    const subscription = supabase
      .channel('app_settings_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        (payload) => {
          const newData = payload.new as any;
          setMaintenanceMode(newData.maintenance_mode || false);
          setMaintenanceMessage(newData.maintenance_message || '');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Scroll to top on route change
  useScrollToTop();

  // Apply dark mode class on mount and when changed
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Show onboarding on first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle Capacitor Android Hardware Back Button
  useEffect(() => {
    let lastTime = 0;
    let toastTimeout: NodeJS.Timeout;

    const handleBackButtonCap = async () => {
      // 1. Check if any overlay/modal handled the event (LIFO stack)
      const handled = handleBackButton();
      if (handled) {
        return;
      }

      // 2. If no modal is open, check current path
      if (location.pathname !== '/') {
        // Go back in history (which reacts within the SPA router)
        navigate(-1);
      } else {
        // We are on the homepage. Double tap to exit.
        const now = Date.now();
        if (now - lastTime < 2000) {
          CapApp.exitApp();
        } else {
          lastTime = now;
          setShowExitToast(true);
          clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => {
            setShowExitToast(false);
          }, 2000);
        }
      }
    };

    const setupListener = async () => {
      if (!Capacitor.isNativePlatform()) {
        return null;
      }
      const listener = await CapApp.addListener('backButton', handleBackButtonCap);
      return listener;
    };

    const listenerPromise = setupListener();

    return () => {
      clearTimeout(toastTimeout);
      listenerPromise.then(l => {
        if (l) l.remove();
      });
    };
  }, [location.pathname, navigate]);


  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const handleAdminLogout = async () => {
    navigate('/', { replace: true });
    // Add a tiny delay before signing out so React Router processes the navigation first
    setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    }, 50);
  };

  if (checkingMaintenance || checkingAuth) {
    return (
      <div className="fixed inset-0 z-[200] bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle Admin Routes completely outside the customer Layout
  if (location.pathname.startsWith('/admin')) {
    if (!isAdmin && location.pathname !== '/admin/login') {
      // Redirect to login if not admin
      return <Navigate to="/admin/login" replace />;
    }

    if (location.pathname === '/admin/login') {
      return !isAdmin ? <AdminLogin /> : <AdminDashboard />;
    }

    return (
      <AdminLayout onLogout={handleAdminLogout}>
        <Routes>
          <Route path="/*" element={<AdminDashboard />} />
        </Routes>
      </AdminLayout>
    );
  }

  // Handle Customer Routes
  if (maintenanceMode && !isAdmin) {
    return (
      <MaintenancePage 
        message={maintenanceMessage} 
        onSecretClick={() => navigate('/admin/login')} 
      />
    );
  }

  return (
    <>
      <OfflineIndicator />

      <Layout 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        onHelpClick={() => setShowOnboarding(true)}
        isAdmin={isAdmin}
        onAdminLogout={handleAdminLogout}
        onLogoClick={() => {
          if (!isAdmin) navigate('/admin/login');
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPageRoute />} />
          <Route path="/recipes" element={<RecipesPageRoute />} />
          <Route path="/articles" element={<ArticlesPageRoute />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/about" element={<AboutPageRoute />} />
        </Routes>
      </Layout>
      
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}

      {showExitToast && (
        <div aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/90 dark:bg-white/90 backdrop-blur text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[200] flex items-center gap-2 animate-slide-up-fade text-sm font-black w-max max-w-[90%]">
          <span>اضغط مرة أخرى للخروج من التطبيق</span>
        </div>
      )}
    </>

  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
