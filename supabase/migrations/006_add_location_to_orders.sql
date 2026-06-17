-- Migration: 006_add_location_to_orders.sql
-- Description: Add GPS coordinates for dynamic delivery fee calculations

-- 1. Add coordinates to customer_orders
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- 2. Add delivery configurations to app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS delivery_price_per_km NUMERIC DEFAULT 150;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_latitude NUMERIC DEFAULT 15.3980555;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_longitude NUMERIC DEFAULT 44.2094444;

-- 3. Update public view to expose delivery config to the app checkout
DROP VIEW IF EXISTS app_settings_public;
CREATE OR REPLACE VIEW app_settings_public AS
  SELECT id, maintenance_mode, maintenance_message, delivery_price_per_km, store_latitude, store_longitude
  FROM app_settings;

GRANT SELECT ON app_settings_public TO anon, authenticated;

-- 4. Recreate admin RPC for updating settings
CREATE OR REPLACE FUNCTION admin_update_app_settings(
  p_maintenance_mode BOOLEAN,
  p_maintenance_message TEXT,
  p_ai_api_key TEXT DEFAULT NULL,
  p_delivery_price_per_km NUMERIC DEFAULT NULL,
  p_store_latitude NUMERIC DEFAULT NULL,
  p_store_longitude NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_settings
  SET maintenance_mode = p_maintenance_mode,
      maintenance_message = p_maintenance_message,
      ai_api_key = COALESCE(p_ai_api_key, ai_api_key),
      delivery_price_per_km = COALESCE(p_delivery_price_per_km, delivery_price_per_km),
      store_latitude = COALESCE(p_store_latitude, store_latitude),
      store_longitude = COALESCE(p_store_longitude, store_longitude)
  WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_app_settings(BOOLEAN, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
