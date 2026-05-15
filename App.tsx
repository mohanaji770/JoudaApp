import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProductsPageRoute } from './pages/ProductsPageRoute';
import { RecipesPageRoute } from './pages/RecipesPageRoute';
import { AboutPageRoute } from './pages/AboutPageRoute';
import { Onboarding } from './components/Onboarding';

const ONBOARDING_KEY = 'jouda_onboarding_seen_v1';

const AppContent: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  return (
    <>
      <Layout 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        onHelpClick={() => setShowOnboarding(true)}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPageRoute />} />
          <Route path="/recipes" element={<RecipesPageRoute />} />
          <Route path="/about" element={<AboutPageRoute />} />
        </Routes>
      </Layout>
      
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
