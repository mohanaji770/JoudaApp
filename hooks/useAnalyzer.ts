import { useState } from 'react';
import { analyzeImageWithGemini, analyzeTextWithGemini } from '../services/geminiService';
import { checkDailyQuota, incrementDailyQuota } from '../services/quotaService';
import { AnalysisResult } from '../types';

export const useAnalyzer = (onSuccess?: (result: AnalysisResult) => void) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setError(false);
    setErrorMessage(null);
  };

  const executeAnalysis = async (
    analysisFn: () => Promise<AnalysisResult>, 
    requiresQuota: boolean
  ) => {
    if (requiresQuota && !checkDailyQuota()) {
      setErrorMessage("LOCAL_QUOTA_EXCEEDED");
      setError(true);
      return;
    }

    setIsAnalyzing(true);
    reset();

    try {
      const analysis = await analysisFn();
      if (requiresQuota) incrementDailyQuota();
      
      setResult(analysis);
      onSuccess?.(analysis);
    } catch (err) {
      setError(true);
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = (base64Data: string) => {
    executeAnalysis(async () => {
      const result = await analyzeImageWithGemini(base64Data);
      return { ...result, imageUrl: base64Data };
    }, true);
  };

  const analyzeText = (text: string) => {
    executeAnalysis(() => analyzeTextWithGemini(text), false);
  };

  return {
    isAnalyzing,
    result,
    error,
    errorMessage,
    analyzeImage,
    analyzeText,
    reset,
    setResult,
    setError,
    setErrorMessage
  };
};
