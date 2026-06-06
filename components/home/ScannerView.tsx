import React from 'react';
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
  return (
    <div className="animate-slide-up max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">فحص المنتجات</h2>
        <button
          onClick={onClose}
          className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {errorMessage === "LOCAL_QUOTA_EXCEEDED" && (
        <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl text-center mb-6">
          <ShieldAlert className="w-8 h-8 text-orange-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 dark:text-white">عفواً، انتهى رصيد الصور</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">جرب البحث الكتابي — مجاني وغير محدود</p>
          <button 
            onClick={onClearError} 
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
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
