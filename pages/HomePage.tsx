import React, { useState } from 'react';
import { useScanHistory } from '../hooks/useScanHistory';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { DashboardView } from '../components/home/DashboardView';
import { ScannerView } from '../components/home/ScannerView';
import { AnalysisResult } from '../types';

export const HomePage: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const { history, saveToHistory } = useScanHistory();
  
  const handleAnalysisSuccess = (newResult: AnalysisResult) => {
    saveToHistory(newResult);
  };

  const {
    isAnalyzing,
    result,
    errorMessage,
    analyzeImage,
    analyzeText,
    reset,
    setResult,
    setError,
    setErrorMessage
  } = useAnalyzer(handleAnalysisSuccess);

  const handleHistorySelect = (item: AnalysisResult) => {
    setResult(item);
    setShowScanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    reset();
  };

  const handleClearError = () => {
    setError(false);
    setErrorMessage(null);
  };

  return (
    <>
      {!showScanner && !result ? (
        <DashboardView onOpenScanner={() => setShowScanner(true)} />
      ) : (
        <ScannerView
          isAnalyzing={isAnalyzing}
          result={result}
          history={history}
          errorMessage={errorMessage}
          onClose={handleCloseScanner}
          onImageSelected={analyzeImage}
          onTextSearch={analyzeText}
          onHistorySelect={handleHistorySelect}
          onResetAnalysis={reset}
          onClearError={handleClearError}
        />
      )}
    </>
  );
};
