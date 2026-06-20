import React, { useState } from 'react';
import { Scanner } from '../ui/Scanner';
import { ResultCard } from '../ui/ResultCard';
import { HistoryList } from '../blog/HistoryList';
import { AnalysisResult } from '../../types';
import { ShieldAlert, X } from 'lucide-react';

interface ScannerViewProps {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  history: AnalysisResult[];
  errorMessage: string | null;
  onClose: () => void;
  onImageSelected: (base64Data: string) => void;
  onTextSearch: (text: string) => void;
  onHistorySelect: (item: AnalysisResult) => void;
  onResetAnalysis: () => void;
  onClearError: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  isAnalyzing,
  result,
  history,
  errorMessage,
  onClose,
  onImageSelected,
  onTextSearch,
  onHistorySelect,
  onResetAnalysis,
  onClearError,
}) => {
  const [mode, setMode] = useState<'camera' | 'text'>('camera');

  return (
    <div className="animate-slide-up max-w-2xl mx-auto w-full">
      {/* Compact Top Header Bar */}
      <div className="flex justify-between items-center mb-2 px-1 text-right">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">فحص وتأكيد منتجات جوده</span>
        <button
          onClick={onClose}
          className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors active:scale-95"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMessage === "LOCAL_QUOTA_EXCEEDED" && (
        <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl text-center mb-6 border border-orange-100 dark:border-orange-900/40">
          <ShieldAlert className="w-8 h-8 text-orange-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 dark:text-white text-base">عفواً، انتهى رصيد الصور</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4 font-bold">جرب البحث الكتابي — مجاني وغير محدود</p>
          <button 
            onClick={() => {
              onClearError();
              setMode('text');
            }} 
            className="w-full bg-gray-900 dark:bg-gray-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-black dark:hover:bg-gray-600 active:scale-[0.98] transition-transform"
          >
            استخدم البحث الكتابي
          </button>
        </div>
      )}

      {errorMessage && errorMessage !== "LOCAL_QUOTA_EXCEEDED" && (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl text-center font-bold mb-4">
          {errorMessage}
        </div>
      )}

      {!result ? (
        <>
          <Scanner
            onImageSelected={onImageSelected}
            onTextSearch={onTextSearch}
            isAnalyzing={isAnalyzing}
            mode={mode}
            setMode={setMode}
          />
          {!isAnalyzing && history.length > 0 && (
            <HistoryList history={history} onSelect={onHistorySelect} />
          )}
        </>
      ) : (
        <ResultCard result={result} onReset={onResetAnalysis} />
      )}
    </div>
  );
};
