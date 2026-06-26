# Glossary

## Projects

| Term | Meaning |
|---|---|
| JoudaApp | Supabase project `unsqyovqzsgmxacrqunh`; customer app data, admin UI data, and Edge Functions |
| Inventory / JoudaStockManager | Supabase project `tfecwguylsxbfknrxrlx`; POS, stock, invoices, warehouses, collectors |
| Frontend | React/Vite customer app and admin dashboard |
| Android app | Capacitor wrapper around the built frontend |

## Data and Tables

| Term | Meaning |
|---|---|
| `products` | JoudaApp product display/cache table synced from Inventory |
| `stock_quantity` | Read/display stock value in JoudaApp; `NULL` means always available/untracked |
| `is_stock_tracked` | Inventory/JoudaApp flag; `false` means quantity is not limiting display availability |
| `customer_orders` | JoudaApp order records created from app orders and POS webhook flows |
| `order_items` | Line items for `customer_orders` |
| `sync_logs` | Logs written by product sync and read by admin dashboard |
| `app_settings_public` | Safe public view for maintenance/delivery settings |
| `package_items` | Package-to-product component mapping used by packages and order submission |
| `app_categories` | Editable app-facing category list |
| `public-assets` | Supabase Storage bucket used for admin image uploads |
| `app_category` | Product category override for the customer app |
| `is_hidden_in_app` | Product flag that hides an item from customer-facing lists |
| `force_out_of_stock` | Product flag that forces unavailable display state |
| `valid_until` | Expiry/display date for offers or packages |

## Workflows

| Term | Meaning |
|---|---|
| `wf_*` | Telegram callback namespace for app order workflow |
| `inv_*` | Telegram callback namespace for POS invoice workflow |
| `reserve` | Inventory workflow status/action |
| `reserved` | JoudaApp customer order status |
| `create_quotation` | Inventory RPC used when submitting app orders |
| `convert_quotation_to_invoice` | Inventory RPC used when converting/reserving final invoice state |

## Operations

| Term | Meaning |
|---|---|
| `WEBHOOK_SECRET` | Shared secret for non-Telegram webhooks/cron calls |
| `ALLOWED_ORIGIN` | Optional CORS origin; missing value falls back to `*` in current functions |
| `ONLINE_WAREHOUSE_ID` | Inventory warehouse for online orders |
| `TELEGRAM_DRIVER_MAP` | JSON mapping from Telegram user id to Inventory user id |
| `GEMINI_API_KEY` | Secret for `analyze-product` AI product analysis |

## Conventions

| Term | Meaning |
|---|---|
| `fmtDate()` | Gregorian 12-hour date formatter in `supabase/functions/telegram-bot/format.ts` |
| `toLocaleString('ar-SA')` | Avoid for dates; may render Hijri dates |
| `service_role` | Server-side Supabase key for privileged writes; never expose to frontend |
