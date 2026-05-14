

import { GOOGLE_SHEET_URL, GOOGLE_SHEET_RECIPES_URL, GOOGLE_SHEET_BAKERY_URL, GOOGLE_SHEET_FAQ_URL, GOOGLE_SHEET_ARTICLES_URL } from "../constants";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image?: string;
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
  mainProduct: string;
  ingredients: string[];
  steps: string[];
  image?: string;
  bundleItems?: string[];
  videoUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Article {
  id: string;
  title: string;
  image: string;
  content: string;
  date: string;
  author: string;
}

const PRODUCTS_CACHE_KEY = 'jouda_products_cache_v1';
const BAKERY_CACHE_KEY = 'jouda_bakery_cache_v1';
const RECIPES_CACHE_KEY = 'jouda_recipes_cache_v1';
const FAQ_CACHE_KEY = 'jouda_faq_cache_v1';
const ARTICLES_CACHE_KEY = 'jouda_articles_cache_v1';

// Robust CSV Parser to handle multiline cells and quoted strings
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuote) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // Skip next quote (escaped quote)
      } else if (char === '"') {
        inQuote = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuote = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
        if (char === '\r') i++; // Skip \n if \r\n
      } else if (char === '\r') {
         // Handle standalone \r
         currentRow.push(currentVal.trim());
         rows.push(currentRow);
         currentRow = [];
         currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  
  // Push the last item if exists
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }
  
  return rows;
};

// Helper to convert Google Drive links to direct images
const processImageLink = (url: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/(.+?)(\/|$)/) || url.match(/id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }
  return url;
};

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

const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      return response;
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed for ${url}. Retrying...`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Fetch failed after retries");
};

export const fetchProductsFromSheet = async (): Promise<Product[]> => {
  try {
    const cacheBuster = `&t=${Date.now()}`;
    const response = await fetchWithRetry(GOOGLE_SHEET_URL + cacheBuster);
    const text = await response.text();
    
    const rows = parseCSV(text);
    const products: Product[] = [];
    
    // Skip header (index 0)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 2) {
        const stockValue = cols[7]?.toLowerCase();
        const isAvailable = stockValue !== "لا" && stockValue !== "no" && stockValue !== "false" && stockValue !== "0";
        const featuredValue = cols[8]?.toLowerCase();
        const isPopular = featuredValue === "نعم" || featuredValue === "yes" || featuredValue === "true" || featuredValue === "1";

        products.push({
          id: cols[0] || `row-${i}`,
          name: cols[1] || "منتج بدون اسم",
          category: cols[2] || "عام",
          description: cols[3] || "",
          price: cols[4] || "",
          image: processImageLink(cols[5] || ""), 
          tags: cols[6] ? cols[6].split(',').map(t => t.trim()) : [],
          inStock: isAvailable,
          popular: isPopular,
          source: 'store'
        });
      }
    }
    try { localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products)); } catch (e) {}
    return products;
  } catch (error) {
    console.warn("Network failed for Products, attempting to load from cache...", error);
    try {
        const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
};

export const fetchBakeryProductsFromSheet = async (): Promise<Product[]> => {
  try {
    const cacheBuster = `&t=${Date.now()}`;
    if (!GOOGLE_SHEET_BAKERY_URL || GOOGLE_SHEET_BAKERY_URL.includes('gid=0')) {
      return [];
    }
    const response = await fetchWithRetry(GOOGLE_SHEET_BAKERY_URL + cacheBuster);
    const text = await response.text();
    
    const rows = parseCSV(text);
    const products: Product[] = [];
    
    // STRUCTURE: A=ID, B=Name, C=Description, D=Price, E=Image, F=InStock
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 2) {
        const stockValue = cols[5]?.toLowerCase();
        const isAvailable = stockValue === "نعم" || stockValue === "yes" || stockValue === "true";

        products.push({
          id: cols[0] || `bakery-${i}`,
          name: cols[1] || "منتج مخبز",
          category: "مخبوزات طازجة",
          description: cols[2] || "",
          price: cols[3] || "",
          image: processImageLink(cols[4] || ""), 
          inStock: isAvailable,
          source: 'bakery'
        });
      }
    }
    try { localStorage.setItem(BAKERY_CACHE_KEY, JSON.stringify(products)); } catch (e) {}
    return products;
  } catch (error) {
    console.warn("Network failed for Bakery, attempting to load from cache...", error);
    try {
        const cached = localStorage.getItem(BAKERY_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
};

export const fetchRecipesFromSheet = async (): Promise<Recipe[]> => {
  try {
    const cacheBuster = `&t=${Date.now()}`;
    const response = await fetchWithRetry(GOOGLE_SHEET_RECIPES_URL + cacheBuster);
    const text = await response.text();
    
    const rows = parseCSV(text);
    const recipes: Recipe[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 2) {
        const rawBundle = cols[10];
        const bundleItems = rawBundle ? rawBundle.split(',').map(s => s.trim()).filter(Boolean) : [];
        const videoUrl = cols[11]?.trim() || "";

        recipes.push({
          id: cols[0] || `recipe-${i}`,
          title: cols[1] || "وصفة بدون عنوان",
          description: cols[2] || "",
          time: cols[3] || "",
          difficulty: cols[4] || "",
          calories: cols[5] || "",
          mainProduct: cols[6] || "",
          ingredients: cols[7] ? cols[7].split('|').map(s => s.trim()).filter(Boolean) : [],
          steps: cols[8] ? cols[8].split('|').map(s => s.trim()).filter(Boolean) : [],
          image: processImageLink(cols[9] || ""),
          bundleItems: bundleItems,
          videoUrl: videoUrl
        });
      }
    }
    try { localStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(recipes)); } catch (e) {}
    return recipes;
  } catch (error) {
    console.warn("Network failed for Recipes, attempting to load from cache...", error);
    try {
        const cached = localStorage.getItem(RECIPES_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
};

export const fetchArticlesFromSheet = async (): Promise<Article[]> => {
  try {
    if (!GOOGLE_SHEET_ARTICLES_URL) return [];
    const cacheBuster = `&t=${Date.now()}`;
    const response = await fetchWithRetry(GOOGLE_SHEET_ARTICLES_URL + cacheBuster);
    const text = await response.text();
    
    const rows = parseCSV(text);
    const articles: Article[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 2) {
        articles.push({
          id: cols[0] || `art-${i}`,
          title: cols[1] || "مقال جديد",
          image: processImageLink(cols[2] || ""),
          content: cols[3] || "",
          date: cols[4] || new Date().toLocaleDateString('ar-SA'),
          author: cols[5] || "جودة",
        });
      }
    }
    try { localStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify(articles)); } catch (e) {}
    return articles;
  } catch (error) {
    console.warn("Network failed for Articles, using cache...");
    try {
      const cached = localStorage.getItem(ARTICLES_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
};

const DEFAULT_FAQ: FAQItem[] = [
  { id: '1', question: 'هل يوجد توصيل للمحافظات؟', answer: 'نعم، نقوم بالشحن لجميع المحافظات عبر شركات النقل المعتمدة. التوصيل داخل صنعاء فوري، وللمحافظات خلال 1-2 يوم.' },
  { id: '2', question: 'كيف يتم الدفع؟', answer: 'الدفع عند الاستلام داخل صنعاء. للمحافظات، يمكنكم التحويل عبر الكريمي أو البنوك المعتمدة قبل الشحن.' },
  { id: '3', question: 'هل منتجاتكم مضمونة لمرضى السيلياك؟', answer: 'بالتأكيد. جميع منتجاتنا، بما فيها مخبوزات "حلو صار أحلى"، محضرة في بيئة معزولة تماماً عن القمح وتخضع لرقابة صارمة.' },
  { id: '4', question: 'دقيق "جودة" هل هو خلطة جاهزة أم دقيق خام؟', answer: 'نوفر النوعين. لدينا دقيق خام (أرز، تابيوكا..) ولدينا "مخاليط" جاهزة للخبز والكيك لضمان نجاح وصفاتكم.' },
  { id: '5', question: 'هل المخبوزات تتوفر يومياً؟', answer: 'نعم، يتم الخبز يومياً لضمان الطزاجة. يُفضل الطلب المبكر لضمان توفر الكمية التي تحتاجونها.' }
];

export const fetchFAQFromSheet = async (): Promise<FAQItem[]> => {
  try {
    if (!GOOGLE_SHEET_FAQ_URL) return DEFAULT_FAQ;
    const cacheBuster = `&t=${Date.now()}`;
    const response = await fetchWithRetry(GOOGLE_SHEET_FAQ_URL + cacheBuster);
    const text = await response.text();
    
    const rows = parseCSV(text);
    const faqItems: FAQItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 3) {
        faqItems.push({
          id: cols[0] || `faq-${i}`,
          question: cols[1] || "",
          answer: cols[2] || ""
        });
      }
    }
    try { localStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(faqItems)); } catch (e) {}
    return faqItems;
  } catch (error) {
    try {
        const cached = localStorage.getItem(FAQ_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_FAQ;
  }
};