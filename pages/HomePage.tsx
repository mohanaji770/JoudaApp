import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '../components/Scanner';
import { ResultCard } from '../components/ResultCard';
import { HistoryList } from '../components/HistoryList';
import { ProductRequestModal } from '../components/ProductRequestModal';
import { TrendingRecipes } from '../components/TrendingRecipes';
import { PromoBanner } from '../components/PromoBanner';
import { KnowledgeHub } from '../components/KnowledgeHub';
import { analyzeImageWithGemini, analyzeTextWithGemini } from '../services/geminiService';
import { checkDailyQuota, incrementDailyQuota } from '../services/quotaService';
import { AnalysisResult } from '../types';
import { Search, ShieldAlert, X, ChefHat, Store, ScanLine, ChevronLeft } from 'lucide-react';

const HISTORY_KEY = 'yaqeen_scan_history_v1';
const MAX_HISTORY_ITEMS = 10;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const [showProductRequest, setShowProductRequest] = useState(false);

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



  return (
    <>
      {!showScanner && !result ? (
        // DASHBOARD VIEW
        <div className="animate-fade-in flex flex-col">

            {/* Search Bar Container */}
            <div className="mt-5 mb-5 relative">
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-1.5 flex items-center justify-between transition-all duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-800">
                {/* Search Clickable Area: Redirects to /products */}
                <button
                  onClick={() => navigate('/products')}
                  className="flex-1 flex items-center gap-3 p-1.5 text-right transition-all group/btn"
                  aria-label="البحث في المتجر"
                >
                  <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 group-hover/btn:scale-105 transition-transform duration-200" />
                  <div className="flex-1 text-right">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 block transition-colors group-hover/btn:text-gray-600 dark:group-hover/btn:text-gray-300">ابحث عن منتج، وصفة، أو مكون...</span>
                  </div>
                </button>

                {/* Scan Clickable Area: Opens Product Scanner */}
                <div className="pl-2 border-r border-gray-200 dark:border-gray-700 mr-2 pr-2">
                  <button
                    onClick={() => setShowScanner(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-white dark:hover:bg-gray-700 transition-all active:scale-95 group/scan"
                    aria-label="بدء الفحص بالكميرا"
                    title="بدء الفحص بالكميرا"
                  >
                    <ScanLine className="w-5 h-5 group-hover/scan:scale-110 transition-transform duration-300 group-hover/scan:text-brand-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* PROMO BANNERS */}
          <PromoBanner />

          {/* QUICK ACCESS — compact, elegant 2-column grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Kitchen Card */}
            <button
              onClick={() => navigate('/recipes')}
              className="group relative h-28 rounded-3xl overflow-hidden bg-warm-white dark:bg-gray-800 border border-orange-100/80 dark:border-gray-700/50 text-right p-4 transition-all duration-300 hover:border-orange-200/80 hover:bg-orange-50/10 dark:hover:bg-gray-700/80 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(234,88,12,0.03)] active:scale-[0.98] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.015)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <ChefHat className="w-7 h-7 text-orange-600 dark:text-orange-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
                <ChevronLeft className="w-4 h-4 text-orange-500 dark:text-orange-400 group-hover:-translate-x-1 transition-transform" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1">مطبخ جودة</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-snug line-clamp-1">وصفات وأكلات صحية خالية من الجلوتين</p>
              </div>
            </button>

            {/* Store Card */}
            <button
              onClick={() => navigate('/products')}
              className="group relative h-28 rounded-3xl overflow-hidden bg-warm-white dark:bg-gray-800 border border-rose-100/80 dark:border-gray-700/50 text-right p-4 transition-all duration-300 hover:border-rose-200/80 hover:bg-rose-50/10 dark:hover:bg-gray-700/80 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(211,47,47,0.03)] active:scale-[0.98] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.015)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <Store className="w-7 h-7 text-brand-600 dark:text-brand-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
                <ChevronLeft className="w-4 h-4 text-rose-500 dark:text-rose-400 group-hover:-translate-x-1 transition-transform" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1">المتجر</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-snug line-clamp-1">كافة المنتجات والمقاضي</p>
              </div>
            </button>
          </div>

          {/* Section divider */}
          <div className="py-2.5">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">اكتشف</span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>

          {/* RECIPE & KNOWLEDGE — stacked layout */}
          <div className="mb-6">
            <TrendingRecipes />
          </div>

          <div className="mb-10">
            <KnowledgeHub />
          </div>

          {/* Request Modal */}
          {showProductRequest && (
            <ProductRequestModal onClose={() => setShowProductRequest(false)} />
          )}

        </div>
      ) : (
        // SCANNER VIEW
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
  );
};
