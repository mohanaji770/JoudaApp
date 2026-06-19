-- Migration: 003_security_fixes.sql
-- Project: JoudaApp (unsqyovqzsgmxacrqunh)
-- Description: Security hardening — RPC for PIN, RLS restrictions, missing tables & columns
-- Date: 2026-05-23

-- ============================================
-- Fix #1: Secure admin PIN verification via RPC
-- ============================================
-- Allows clients to verify the admin PIN without ever reading it.
-- SECURITY DEFINER runs with the function owner's privileges (bypasses RLS).

CREATE OR REPLACE FUNCTION verify_admin_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_settings WHERE id = 1 AND admin_pin = p_pin
  );
END;
$$;

-- Grant execute to anon and authenticated (they can verify but never read the PIN)
GRANT EXECUTE ON FUNCTION verify_admin_pin(TEXT) TO anon, authenticated;


-- ============================================
-- Fix #9: Create app_settings table if missing
-- ============================================
-- Stores system-wide settings (admin PIN, maintenance mode).
-- Only service_role may read/write — protects admin_pin from public access.

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  admin_pin TEXT DEFAULT '562422',
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT '',
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row if empty
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Only service_role can read/write app_settings (blocks anon from reading admin_pin)
DROP POLICY IF EXISTS "service_role_only" ON app_settings;
CREATE POLICY "service_role_only" ON app_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Public safe view (maintenance status only, no admin_pin)
CREATE OR REPLACE VIEW app_settings_public AS
  SELECT id, maintenance_mode, maintenance_message
  FROM app_settings;

-- Grant read access on the view
GRANT SELECT ON app_settings_public TO anon, authenticated;


-- ============================================
-- Fix #9: Create banners table if missing
-- ============================================
-- Promotional banners shown on the PWA home screen.

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read active banners" ON banners
  FOR SELECT TO anon, authenticated
  USING (is_active = true);


-- ============================================
-- Fix #2: Restrict customer_orders & order_items read access
-- ============================================
-- Previously these had permissive USING(true) policies.
-- Now: service_role has full access; anon/authenticated can only see their own orders
-- matched by x-customer-phone header.

-- Drop the permissive SELECT policies
DROP POLICY IF EXISTS "Allow public read own orders" ON customer_orders;
DROP POLICY IF EXISTS "Allow public read order items" ON order_items;

-- Customer orders: only service_role can read (Edge Functions handle data access)
CREATE POLICY "service_role_read_orders" ON customer_orders
  FOR SELECT TO service_role
  USING (true);

-- Allow customers to read their own orders by phone number match
CREATE POLICY "customer_read_own_orders" ON customer_orders
  FOR SELECT TO anon, authenticated
  USING (customer_phone = current_setting('request.headers', true)::json->>'x-customer-phone');

-- Order items: restrict to service_role for direct reads
CREATE POLICY "service_role_read_items" ON order_items
  FOR SELECT TO service_role
  USING (true);

-- Allow reading order items for orders the customer can see
CREATE POLICY "customer_read_own_items" ON order_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_orders co
      WHERE co.id = order_items.order_id
      AND co.customer_phone = current_setting('request.headers', true)::json->>'x-customer-phone'
    )
  );

-- Also restrict INSERT to service_role only (Edge Functions handle order creation)
DROP POLICY IF EXISTS "Allow public insert orders" ON customer_orders;
CREATE POLICY "service_role_insert_orders" ON customer_orders
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert order items" ON order_items;
CREATE POLICY "service_role_insert_items" ON order_items
  FOR INSERT TO service_role
  WITH CHECK (true);


-- ============================================
-- Fix #7: Prevent duplicate invoices
-- ============================================
-- Partial unique index: only enforced when quotation_id is not NULL.
-- Ensures no two orders share the same quotation_id from the Inventory system.

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_quotation_id
  ON customer_orders(quotation_id)
  WHERE quotation_id IS NOT NULL;


-- ============================================
-- Add missing columns for workflow tracking
-- ============================================

ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
-- discount already exists in 001 but IF NOT EXISTS makes this safe
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- Use a sequence for atomicity
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Function for generating sequential order numbers (J-YYYY-0001 format)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val INTEGER;
  year_str TEXT;
BEGIN
  year_str := to_char(NOW(), 'YYYY');
  seq_val := nextval('order_number_seq');
  RETURN 'J-' || year_str || '-' || lpad(seq_val::TEXT, 4, '0');
END;
$$;
