
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Scanner } from './components/Scanner';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';
import { Onboarding } from './components/Onboarding';
import { CartDrawer } from './components/CartDrawer';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { ProductsPage } from './components/ProductsPage';
import { RecipesPage } from './components/RecipesPage';
import { JoudaPage } from './components/JoudaPage';
import { KnowledgeHub } from './components/KnowledgeHub';
import { InstallPrompt } from './components/InstallPrompt';
import { RecipeOfTheDay } from './components/RecipeOfTheDay';
import { ProductRequestModal } from './components/ProductRequestModal';
import { analyzeImageWithGemini, analyzeTextWithGemini } from './services/geminiService';
import { checkDailyQuota, incrementDailyQuota } from './services/quotaService';
import { AnalysisResult } from './types';
import { MessageCircle, Search, ShieldAlert, X, Camera, Cake, PackageSearch, Sparkles, ScanLine, ShoppingBag, Check, ChevronLeft } from 'lucide-react';
import { STORE_CONFIG } from './constants';
import { useCart } from './contexts/CartContext';
import { CartFloatingButton } from './components/CartFloatingButton';

const HISTORY_KEY = 'yaqeen_scan_history_v1';
const MAX_HISTORY_ITEMS = 10;
const ONBOARDING_KEY = 'jouda_onboarding_seen_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showScanner, setShowScanner] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Specific State for Home Page Features
  const [showProductRequest, setShowProductRequest] = useState(false);
  const [productsInitialTab, setProductsInitialTab] = useState<'store' | 'bakery'>('store');

  const { lastAddedItem } = useCart(); // For Toast

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 500);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
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

  const saveToHistory = (newResult: AnalysisResult) => {
    const updatedHistory = [newResult, ...history].slice(0, MAX_HISTORY_ITEMS);
    setHistory(updatedHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleImageSelected = async (base64Data: string) => {
    if (!checkDailyQuota()) {
      setErrorMessage("LOCAL_QUOTA_EXCEEDED");
      setError(true);
      return;
    }

    setIsAnalyzing(true);
    setError(false);
    setErrorMessage(null);
    setResult(null);

    try {
      const analysis = await analyzeImageWithGemini(base64Data);
      incrementDailyQuota();
      const fullResult: AnalysisResult = {
        ...analysis,
        imageUrl: base64Data
      };
      setResult(fullResult);
      saveToHistory(fullResult);
    } catch (err) {
      setError(true);
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextSearch = async (text: string) => {
    setIsAnalyzing(true);
    setError(false);
    setErrorMessage(null);
    setResult(null);

    try {
      const analysis = await analyzeTextWithGemini(text);
      const fullResult: AnalysisResult = {
        ...analysis
      };
      setResult(fullResult);
      saveToHistory(fullResult);
    } catch (err) {
      setError(true);
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetApp = () => {
    setResult(null);
    setError(false);
    setErrorMessage(null);
  };

  const handleHistorySelect = (item: AnalysisResult) => {
    setResult(item);
    setShowScanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ------------------------------------------------------------------
  // YEMEN TIME GREETING LOGIC (Asia/Aden)
  // ------------------------------------------------------------------
  const getGreeting = () => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Aden',
        hour: 'numeric',
        hour12: false
      };
      
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const hour = parseInt(formatter.format(new Date()), 10);

      if (hour >= 5 && hour < 12) return "صباح الخير";
      if (hour >= 12 && hour < 16) return "طاب يومك";
      if (hour >= 16 && hour < 20) return "مساء الخير";
      if (hour >= 20 || hour < 5) return "ليلة سعيدة";
      
      return "أهلاً بك";
    } catch (e) {
      return "أهلاً بك 👋";
    }
  };

  const navigateToBakery = () => {
    setProductsInitialTab('bakery');
    setActiveTab('products');
  };

  // Handle Tab Switching from Sidebar or BottomNav
  const handleTabChange = (tab: string) => {
    if (tab === 'products') setProductsInitialTab('store');
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-gray-900 transition-colors duration-300 flex font-sans">
      <InstallPrompt />

      {/* DESKTOP SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
          onHelpClick={() => setShowOnboarding(true)}
        />

        {/* Main Content Area - Responsive Width */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col mb-24 md:mb-0">
          
          {activeTab === 'home' && (
            <>
              {!showScanner && !result ? (
                // ----------------------------------------------------
                // DASHBOARD VIEW
                // ----------------------------------------------------
                <div className="animate-fade-in flex flex-col gap-8">
                  
                  <div className="relative">
                     <div className="mb-6">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                          {getGreeting()} <span className="text-brand-600">.</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm md:text-base">
                           رفيقك للتحقق من سلامة طعامك
                        </p>
                     </div>

                     {/* Search Bar */}
                     <button 
                        onClick={() => setShowScanner(true)}
                        className="w-full bg-warm-white dark:bg-gray-800 rounded-2xl p-3 shadow-xl shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-transform active:scale-[0.98] group md:max-w-2xl"
                     >
                        <div className="bg-brand-600 text-white w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-200 dark:shadow-none group-hover:bg-brand-700 transition-colors">
                           <ScanLine className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-right">
                           <span className="text-base font-bold text-gray-800 dark:text-white block mb-0.5">فحص المنتجات</span>
                            <span className="text-[10px] text-gray-400 font-medium">صوّر المكونات أو اكتب اسمها</span>
                        </div>
                        <div className="pr-4 pl-4 border-r border-gray-100 dark:border-gray-700">
                           <Search className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                        </div>
                     </button>
                  </div>

                  {/* Quick Access Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Bakery Card */}
                      <button 
                        onClick={navigateToBakery}
                        className="group relative h-44 rounded-3xl overflow-hidden bg-warm-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 text-right p-5 transition-all hover:shadow-lg hover:border-orange-200 dark:hover:border-gray-600 active:scale-95 shadow-sm"
                      >
                          <div className="relative z-10 h-full flex flex-col justify-between">
                             <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-2">
                                <Cake className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-none mb-1.5">المخبز</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug">خبز وكيك طازج يومياً</p>
                             </div>
                             <div className="flex justify-end">
                                <div className="bg-orange-100 dark:bg-orange-900/40 p-1.5 rounded-full text-orange-600 dark:text-orange-400">
                                   <ChevronLeft className="w-4 h-4" />
                                </div>
                             </div>
                          </div>
                      </button>

                      {/* Request Card */}
                      <button 
                        onClick={() => setShowProductRequest(true)}
                        className="group relative h-44 rounded-3xl overflow-hidden bg-warm-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-right p-5 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 shadow-sm"
                      >
                          <div className="relative z-10 h-full flex flex-col justify-between">
                             <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                                <PackageSearch className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-none mb-1.5">طلب خاص</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug">نوفره لك إذا لم تجده</p>
                             </div>
                             <div className="flex justify-end">
                                <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full text-gray-600 dark:text-gray-300">
                                   <ChevronLeft className="w-4 h-4" />
                                </div>
                             </div>
                          </div>
                      </button>
                  </div>

                  {/* Daily Recipe & Knowledge Hub */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <RecipeOfTheDay />
                      <KnowledgeHub />
                  </div>

                  {/* Request Modal */}
                  {showProductRequest && (
                      <ProductRequestModal onClose={() => setShowProductRequest(false)} />
                  )}
                  
                </div>
              ) : (
                // ----------------------------------------------------
                // SCANNER VIEW
                // ----------------------------------------------------
                <div className="animate-slide-up max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">فحص المنتجات</h2>
                    <button 
                      onClick={() => {
                        setShowScanner(false);
                        setResult(null);
                        setError(false);
                        setErrorMessage(null);
                      }}
                      className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Error States */}
                  {errorMessage === "LOCAL_QUOTA_EXCEEDED" && (
                    <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl text-center mb-6">
                        <ShieldAlert className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-800 dark:text-white">عفواً، انتهى رصيد الصور</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-4">جرب البحث الكتابي — مجاني وغير محدود</p>
                        <button onClick={() => { setError(false); setErrorMessage(null); }} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">استخدم البحث الكتابي</button>
                    </div>
                  )}
                  
                  {errorMessage && errorMessage !== "LOCAL_QUOTA_EXCEEDED" && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-xl text-center font-bold mb-4">{errorMessage}</div>
                  )}

                  {!result ? (
                    <>
                      <Scanner 
                        onImageSelected={handleImageSelected}
                        onTextSearch={handleTextSearch}
                        isAnalyzing={isAnalyzing}
                      />
                      {!isAnalyzing && history.length > 0 && (
                        <HistoryList history={history} onSelect={handleHistorySelect} />
                      )}
                    </>
                  ) : (
                     <ResultCard result={result} onReset={resetApp} />
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'products' && <ProductsPage initialViewMode={productsInitialTab} />}
          {activeTab === 'recipes' && <RecipesPage />}
          {activeTab === 'about' && <JoudaPage />}

        </main>
        
        {/* GLOBAL TOAST NOTIFICATION */}
        {lastAddedItem && (
          <div aria-live="polite" className="fixed bottom-32 md:bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 dark:bg-white/90 backdrop-blur text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-slide-up-fade w-max max-w-[90%]">
             <div className="bg-green-500 p-1 rounded-full shrink-0">
               <Check className="w-3 h-3 text-white" />
             </div>
             <span className="text-sm font-bold truncate">تمت إضافة "{lastAddedItem}"</span>
          </div>
        )}

        {/* Floating Cart Button (Mobile only logic handled inside component or via CSS) */}
        <div className="md:hidden">
            <CartFloatingButton />
        </div>

        {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
        <CartDrawer />
        
        {/* MOBILE BOTTOM NAV */}
        <BottomNav 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
        />
      </div>
    </div>
  );
};

export default App;
