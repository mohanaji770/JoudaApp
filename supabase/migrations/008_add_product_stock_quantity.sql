-- Migration: 008_add_product_stock_quantity.sql
-- Project: JoudaApp (unsqyovqzsgmxacrqunh)
-- Description: Store synced inventory quantities for customer-facing stock guidance.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stock_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_stock_tracked BOOLEAN DEFAULT true;

ALTER TABLE public.products
ALTER COLUMN stock_quantity SET DEFAULT NULL;

COMMENT ON COLUMN public.products.stock_quantity IS
  'Read-only inventory quantity synced from JoudaStockManager for customer UI guidance. NULL means not quantity-limited.';

COMMENT ON COLUMN public.products.stock_updated_at IS
  'Timestamp for the last stock quantity sync from JoudaStockManager.';

COMMENT ON COLUMN public.products.is_stock_tracked IS
  'Read-only copy of Inventory products.is_stock_tracked. false means always available / not quantity-limited.';
