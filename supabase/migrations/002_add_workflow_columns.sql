-- Migration: 002_add_workflow_columns.sql
-- Add workflow tracking columns to customer_orders for Telegram bot

ALTER TABLE customer_orders 
  ADD COLUMN IF NOT EXISTS workflow_locked_by text;

ALTER TABLE customer_orders 
  ADD COLUMN IF NOT EXISTS workflow_updated_at timestamptz;

COMMENT ON COLUMN customer_orders.workflow_locked_by IS 'Telegram user ID who reserved the order';
COMMENT ON COLUMN customer_orders.workflow_updated_at IS 'Timestamp of last workflow transition';
