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
  app_category?: string | null;
  description?: string;
  price: number;
  image?: string; // backward compat
  image_url?: string;
  is_active?: boolean;
  is_hidden_in_app?: boolean;
  force_out_of_stock?: boolean;
  stock_status?: 'available' | 'out_of_stock';
  unit?: string;
  popular?: boolean;
  tags?: string[];
  valid_until?: string | null;
  inStock?: boolean;
  source?: 'store' | 'bakery';
  bundle_items?: {
    barcode: string;
    product_name: string;
    quantity: number;
  }[];
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

export interface AppCategory {
  id: string;
  name: string;
  sort_order: number;
}

export const fetchAppCategoriesFromSupabase = async (): Promise<AppCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('app_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      // 42P01 = undefined_table (table does not exist yet)
      if (error.code === '42P01') return []; 
      throw error;
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase app_categories failed or not found', err);
    return [];
  }
};

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

    // Fetch package items mappings
    let packageItems: any[] = [];
    try {
      const { data: mappings, error: mappingsError } = await supabase
        .from('package_items')
        .select('*');
      if (!mappingsError && mappings) {
        packageItems = mappings;
      }
    } catch (e) {
      console.warn('Failed to fetch package_items mappings', e);
    }

    const products: Product[] = (data || [])
      .filter((p) => p.is_hidden_in_app !== true)
      .map((p) => {
      const resolvedCategory = p.app_category || p.category || 'عام';
      const isBakery = resolvedCategory === 'مخبوزات' || p.category === 'مخبوزات';
      
      // If it is a package, resolve its bundle items
      let bundle_items: Product['bundle_items'] = undefined;
      const isPackage = p.barcode.startsWith('PKG-') || resolvedCategory === 'عروض وبكجات' || p.category === 'عروض وبكجات';
      let packageInStock = true;

      if (isPackage && packageItems.length > 0) {
        const mappings = packageItems.filter((m) => m.package_barcode === p.barcode);
        bundle_items = mappings.map((m) => {
          const compProduct = data.find((bp) => bp.barcode === m.product_barcode);
          return {
            barcode: m.product_barcode,
            product_name: compProduct ? compProduct.name : `منتج ${m.product_barcode}`,
            quantity: m.quantity,
          };
        });

        // Dynamic stock status check for packages: if any constituent item is out of stock, package is out of stock
        for (const m of mappings) {
          const compProduct = data.find((bp) => bp.barcode === m.product_barcode);
          if (!compProduct) {
            packageInStock = false;
            break;
          }
          const isCompBakery = compProduct.app_category === 'مخبوزات' || compProduct.category === 'مخبوزات';
          const isCompForcedOut = compProduct.force_out_of_stock === true;
          const compStockStatus = isCompForcedOut ? 'out_of_stock' : compProduct.stock_status;
          const compInStock = isCompForcedOut ? false : (isCompBakery ? true : compStockStatus === 'available');

          if (!compInStock) {
            packageInStock = false;
            break;
          }
        }
      }

      const isForcedOut = p.force_out_of_stock === true;
      const finalStockStatus = isForcedOut ? 'out_of_stock' : p.stock_status;

      return {
        id: p.barcode,
        barcode: p.barcode,
        name: p.name,
        category: resolvedCategory,
        app_category: p.app_category,
        description: p.description || '',
        price: p.price || 0,
        image: p.image_url,
        image_url: p.image_url,
        is_active: p.is_active,
        is_hidden_in_app: p.is_hidden_in_app,
        force_out_of_stock: p.force_out_of_stock,
        stock_status: finalStockStatus,
        unit: p.unit,
        tags: p.tags || [],
        valid_until: p.valid_until,
        // For packages, inStock is determined dynamically; bakery items are always available; others check stock_status
        inStock: isPackage 
          ? (isForcedOut ? false : packageInStock)
          : (isForcedOut ? false : (isBakery ? true : finalStockStatus === 'available')),
        source: isBakery ? ('bakery' as const) : ('store' as const),
        bundle_items,
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


