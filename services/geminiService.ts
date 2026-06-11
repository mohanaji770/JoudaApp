import { supabase } from './supabaseClient';
import { AnalysisResult, VerdictType } from '../types';

export const analyzeImageWithGemini = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-product', {
      body: { image: base64Image }
    });

    if (error) {
      console.error("Supabase Edge Function Error:", error);
      throw error;
    }
    
    if (data.error === 'QUOTA_EXCEEDED') {
      throw new Error("QUOTA_EXCEEDED");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return parseResponse(data);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const analyzeTextWithGemini = async (productName: string): Promise<AnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-product', {
      body: { productName }
    });

    if (error) {
      console.error("Supabase Edge Function Error:", error);
      throw error;
    }
    
    if (data.error === 'QUOTA_EXCEEDED') {
      throw new Error("QUOTA_EXCEEDED");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return parseResponse(data);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

const handleApiError = (error: unknown) => {
  console.error("Gemini Analysis Error:", error);
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted") || errorMessage.includes("quota_exceeded")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  
  throw new Error("فشل في تحليل البيانات. يرجى المحاولة مرة أخرى.");
};

const parseResponse = (data: any): AnalysisResult => {
  if (!data || !data.verdict) {
    throw new Error("Invalid response from server");
  }

  return {
    ...data,
    verdict: data.verdict as VerdictType,
    timestamp: Date.now(),
  };
};
