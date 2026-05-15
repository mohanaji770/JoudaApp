import { useState, useEffect, useCallback } from 'react';
import { getCachedProducts, getCachedRecipes, getCachedArticles, getCachedFAQ, getStorageInfo, isCacheValid } from '../services/db';
import { Product, Recipe, Article, FAQItem } from '../services/supabaseService';

interface UseIndexedDBResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
}

export function useCachedProducts(): UseIndexedDBResult<Product[]> {
  const [result, setResult] = useState<UseIndexedDBResult<Product[]>>({
    data: null,
    isLoading: true,
    error: null,
    isStale: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [products, valid] = await Promise.all([
          getCachedProducts(),
          isCacheValid('products'),
        ]);

        setResult({
          data: products,
          isLoading: false,
          error: null,
          isStale: !valid && products.length > 0,
        });
      } catch (error) {
        setResult({
          data: null,
          isLoading: false,
          error: error as Error,
          isStale: false,
        });
      }
    };

    load();
  }, []);

  return result;
}

export function useCachedRecipes(): UseIndexedDBResult<Recipe[]> {
  const [result, setResult] = useState<UseIndexedDBResult<Recipe[]>>({
    data: null,
    isLoading: true,
    error: null,
    isStale: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [recipes, valid] = await Promise.all([
          getCachedRecipes(),
          isCacheValid('recipes'),
        ]);

        setResult({
          data: recipes,
          isLoading: false,
          error: null,
          isStale: !valid && recipes.length > 0,
        });
      } catch (error) {
        setResult({
          data: null,
          isLoading: false,
          error: error as Error,
          isStale: false,
        });
      }
    };

    load();
  }, []);

  return result;
}

export function useCachedArticles(): UseIndexedDBResult<Article[]> {
  const [result, setResult] = useState<UseIndexedDBResult<Article[]>>({
    data: null,
    isLoading: true,
    error: null,
    isStale: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [articles, valid] = await Promise.all([
          getCachedArticles(),
          isCacheValid('articles'),
        ]);

        setResult({
          data: articles,
          isLoading: false,
          error: null,
          isStale: !valid && articles.length > 0,
        });
      } catch (error) {
        setResult({
          data: null,
          isLoading: false,
          error: error as Error,
          isStale: false,
        });
      }
    };

    load();
  }, []);

  return result;
}

export function useCachedFAQ(): UseIndexedDBResult<FAQItem[]> {
  const [result, setResult] = useState<UseIndexedDBResult<FAQItem[]>>({
    data: null,
    isLoading: true,
    error: null,
    isStale: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [faq, valid] = await Promise.all([
          getCachedFAQ(),
          isCacheValid('faq'),
        ]);

        setResult({
          data: faq,
          isLoading: false,
          error: null,
          isStale: !valid && faq.length > 0,
        });
      } catch (error) {
        setResult({
          data: null,
          isLoading: false,
          error: error as Error,
          isStale: false,
        });
      }
    };

    load();
  }, []);

  return result;
}

export function useStorageInfo() {
  const [info, setInfo] = useState<{
    products: number;
    recipes: number;
    articles: number;
    faq: number;
    cart: number;
    pendingOrders: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStorageInfo();
      setInfo(data);
    } catch (e) {
      console.error('Failed to get storage info', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { info, isLoading, refresh };
}
