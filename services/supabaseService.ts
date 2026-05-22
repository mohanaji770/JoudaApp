import { supabase } from './supabaseClient';
import {
  cacheProducts,
  getCachedProducts,
  cacheRecipes,
  getCachedRecipes,
  cacheArticles,
  getCachedArticles,
  cacheFAQ,
  getCachedFAQ,
  getCacheAge,
} from './db';

export interface Product {
  id: string; // barcode for compatibility
  barcode: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  image?: string; // backward compat
  image_url?: string;
  is_active?: boolean;
  stock_status?: 'available' | 'out_of_stock';
  unit?: string;
  popular?: boolean;
  tags?: string[];
  inStock?: boolean;
  source?: 'store' | 'bakery';
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  time: string;
  difficulty: string;
  calories: string;
  main_product: string;
  mainProduct: string; // backward compat
  ingredients: string[];
  steps: string[];
  image?: string; // backward compat
  image_url?: string;
  bundle_items?: string[];
  bundleItems?: string[]; // backward compat
  video_url?: string;
  videoUrl?: string; // backward compat
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Article {
  id: string;
  title: string;
  image?: string; // backward compat
  image_url: string;
  content: string;
  date?: string; // backward compat
  published_date?: string;
  author: string;
}

// ==========================
// PRODUCTS (from Supabase)
// ==========================

export const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    const products: Product[] = (data || []).map((p) => {
      const isBakery = (p.category || '') === 'مخبوزات';
      return {
        id: p.barcode,
        barcode: p.barcode,
        name: p.name,
        category: p.category || 'عام',
        description: p.description || '',
        price: p.price || 0,
        image: p.image_url,
        image_url: p.image_url,
        is_active: p.is_active,
        stock_status: p.stock_status,
        unit: p.unit,
        // Bakery items are always available (made-to-order)
        inStock: isBakery ? true : p.stock_status === 'available',
        source: isBakery ? ('bakery' as const) : ('store' as const),
      };
    });

    // Cache in IndexedDB for offline
    try { await cacheProducts(products); } catch (e) { console.warn('Failed to cache products', e); }
    return products;
  } catch (error) {
    console.warn('Supabase products failed, trying IndexedDB cache...', error);
    try {
      const cached = await getCachedProducts();
      if (cached.length > 0) return cached;
    } catch (e) {}
    return [];
  }
};

// Bakery products - for now, keep empty or fetch from a separate source
// ==========================
// RECIPES
// ==========================

export const fetchRecipesFromSupabase = async (): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const recipes: Recipe[] = (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      time: r.time || '',
      difficulty: r.difficulty || '',
      calories: r.calories || '',
      main_product: r.main_product || '',
      mainProduct: r.main_product || '',
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      image: r.image_url,
      image_url: r.image_url,
      bundle_items: r.bundle_items || [],
      bundleItems: r.bundle_items || [],
      video_url: r.video_url,
      videoUrl: r.video_url,
    }));

    try { await cacheRecipes(recipes); } catch (e) { console.warn('Failed to cache recipes', e); }
    return recipes;
  } catch (error) {
    console.warn('Supabase recipes failed, trying IndexedDB cache...', error);
    try {
      const cached = await getCachedRecipes();
      if (cached.length > 0) return cached;
    } catch (e) {}
    return [];
  }
};

// ==========================
// ARTICLES
// ==========================

export const fetchArticlesFromSupabase = async (): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const articles: Article[] = (data || []).map((a) => ({
      id: a.id,
      title: a.title,
      image: a.image_url || '',
      image_url: a.image_url || '',
      content: a.content || '',
      date: a.published_date,
      published_date: a.published_date,
      author: a.author || 'جودة',
    }));

    try { await cacheArticles(articles); } catch (e) { console.warn('Failed to cache articles', e); }
    return articles;
  } catch (error) {
    console.warn('Supabase articles failed, trying IndexedDB cache...', error);
    try {
      const cached = await getCachedArticles();
      if (cached.length > 0) return cached;
    } catch (e) {}
    return [];
  }
};

// ==========================
// FAQ
// ==========================

export const fetchFAQFromSupabase = async (): Promise<FAQItem[]> => {
  try {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const faq: FAQItem[] = (data || []).map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));

    try { await cacheFAQ(faq); } catch (e) { console.warn('Failed to cache FAQ', e); }
    return faq;
  } catch (error) {
    console.warn('Supabase FAQ failed, trying IndexedDB cache...', error);
    try {
      const cached = await getCachedFAQ();
      if (cached.length > 0) return cached;
    } catch (e) {}
    return [];
  }
};

// ==========================
// ORDER SUBMISSION
// ==========================

export interface SubmitOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  order_type: 'delivery' | 'pickup';
  branch_id?: string;
  payment_method: string;
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  items: {
    product_barcode: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface SubmitOrderResult {
  success: boolean;
  order_number?: string;
  quotation_id?: string;
  order_id?: string;
  message: string;
}

export const submitOrderToSupabase = async (
  payload: SubmitOrderPayload
): Promise<SubmitOrderResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('submit-order', {
      body: payload,
    });

    if (error) throw error;
    return data as SubmitOrderResult;
  } catch (error: any) {
    console.error('submitOrderToSupabase error:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit order',
    };
  }
};

// ==========================
// Helpers
// ==========================

export const getYouTubeEmbedId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  if (url.includes('youtube.com/shorts/')) {
    const shortsMatch = url.split('shorts/')[1];
    if (shortsMatch) return shortsMatch.split('?')[0];
  }
  return null;
};


