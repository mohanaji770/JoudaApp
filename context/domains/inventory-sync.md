# Inventory Sync Domain

## Purpose

Inventory owns stock and product truth. JoudaApp keeps a product cache for fast app display.

## Main Flow

```text
pg_cron / net.http_post
→ sync-products with WEBHOOK_SECRET
→ Inventory products + product_stock_summary
→ JoudaApp products upsert
→ sync_logs insert
```

## Important Fields

| Field | Meaning |
|---|---|
| `products.stock_quantity` | Display-only stock snapshot in JoudaApp |
| `products.is_stock_tracked` | `false` means always available/not quantity-limited |
| `products.stock_updated_at` | Last stock sync timestamp |
| `products.is_active` | Public app visibility baseline |

## Rules

- Do not reserve stock based on JoudaApp `stock_quantity`.
- Final reservation/accounting belongs to Inventory RPCs.
- Always-available products should have `stock_quantity = NULL` in JoudaApp.
- Bakery/untracked products may be shown as available without finite stock.

## Related Code

- `supabase/functions/sync-products/index.ts`
- `supabase/functions/update-inventory/index.ts`
- `supabase/migrations/008_add_product_stock_quantity.sql`
- `utils/stockUtils.ts`
- `services/supabaseService.ts`

## Related Context

- Architecture: `context/architecture.md`
- Database/RLS: `context/domains/database-rls.md`
