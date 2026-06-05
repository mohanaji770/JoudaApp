import { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';

const HISTORY_KEY = 'yaqeen_scan_history_v1';
const MAX_HISTORY_ITEMS = 10;

export const useScanHistory = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);

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

  return { history, saveToHistory };
};
