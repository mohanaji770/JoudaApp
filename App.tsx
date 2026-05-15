import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { ProductsPageRoute } from './pages/ProductsPageRoute';
import { RecipesPageRoute } from './pages/RecipesPageRoute';
import { AboutPageRoute } from './pages/AboutPageRoute';
import { OrdersPage } from './pages/OrdersPage';
import { Onboarding } from './components/Onboarding';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useScrollToTop, useLocalStorage, useOnlineStatus } from './hooks';
import { SyncProvider } from './contexts/SyncContext';

const ONBOARDING_KEY = 'jouda_onboarding_seen_v1';

const AppContent: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  return (
    <>
      <OfflineIndicator />

      <Layout 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        onHelpClick={() => setShowOnboarding(true)}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPageRoute />} />
          <Route path="/recipes" element={<RecipesPageRoute />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/about" element={<AboutPageRoute />} />
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
