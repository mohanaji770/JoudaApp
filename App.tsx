import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Clock, Shield } from 'lucide-react';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { HomePage } from './pages/HomePage';
import { ProductsPageRoute } from './pages/ProductsPageRoute';
import { RecipesPageRoute } from './pages/RecipesPageRoute';
import { AboutPageRoute } from './pages/AboutPageRoute';
import { OrdersPage } from './pages/OrdersPage';
import { Onboarding } from './components/Onboarding';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useScrollToTop, useLocalStorage } from './hooks';
import { SyncProvider } from './contexts/SyncContext';
import { supabase } from './services/supabaseClient';

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

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (checkingMaintenance || checkingAuth) {
    return (
      <div className="fixed inset-0 z-[200] bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (maintenanceMode && !isAdmin && location.pathname !== '/admin/login') {
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
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/about" element={<AboutPageRoute />} />
          <Route path="/admin/login" element={!isAdmin ? <AdminLogin /> : <AdminDashboard />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <AdminLogin />} />
        </Routes>
      </Layout>
      
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
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
