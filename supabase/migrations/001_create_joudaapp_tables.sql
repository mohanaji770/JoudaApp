-- Migration: 001_create_joudaapp_tables.sql
-- Project: JoudaApp (unsqyovqzsgmxacrqunh)
-- Description: Create tables for JoudaApp PWA (products cache, recipes, articles, orders)

-- ============================================
-- 1. Products (Cache from Inventory System)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_status TEXT DEFAULT 'available', -- 'available' | 'out_of_stock'
  unit TEXT DEFAULT 'piece',
  min_stock NUMERIC DEFAULT 0,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active products
CREATE POLICY "Allow public read products" ON products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ============================================
-- 2. Recipes
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  difficulty TEXT,
  calories TEXT,
  main_product TEXT,
  ingredients TEXT[] DEFAULT '{}',
  steps TEXT[] DEFAULT '{}',
  image_url TEXT,
  bundle_items TEXT[] DEFAULT '{}',
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read recipes" ON recipes
  FOR SELECT TO anon, authenticated
  USING (true);

-- ============================================
-- 3. Articles
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  author TEXT DEFAULT 'جودة',
  published_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read articles" ON articles
  FOR SELECT TO anon, authenticated
  USING (true);

-- ============================================
-- 4. Customer Orders
-- ============================================
CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id TEXT, -- From Inventory System
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  order_type TEXT DEFAULT 'delivery', -- 'delivery' | 'pickup'
  branch_id TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'CASH',
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'submitted' | 'confirmed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create (anonymous orders)
CREATE POLICY "Allow public insert orders" ON customer_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Read orders by phone (simple matching for customers)
CREATE POLICY "Allow public read own orders" ON customer_orders
  FOR SELECT TO anon, authenticated
  USING (true); -- Simplified: in production, use phone matching or session

-- ============================================
-- 5. Order Items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_barcode TEXT,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read order items" ON order_items
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert order items" ON order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================
-- 6. FAQ
-- ============================================
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read faq" ON faq
  FOR SELECT TO anon, authenticated
  USING (true);

-- ============================================
-- 7. Sync Logs (for debugging sync process)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success' | 'error'
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can write (Edge Functions)
CREATE POLICY "Allow service role sync logs" ON sync_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_orders_phone ON customer_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE products IS 'Local cache of inventory products. Synced every 10 minutes via Edge Function.';
COMMENT ON TABLE customer_orders IS 'Customer orders placed via JoudaApp. Submitted to Inventory as quotations.';
COMMENT ON TABLE recipes IS 'Gluten-free recipes content.';
COMMENT ON TABLE articles IS 'Blog articles and educational content.';
